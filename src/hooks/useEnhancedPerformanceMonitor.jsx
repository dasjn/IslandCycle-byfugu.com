// src/hooks/useEnhancedPerformanceMonitor.jsx
import { useEffect, useRef, useState, useCallback } from "react";

export const useEnhancedPerformanceMonitor = (enabled = true) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    renderTime: 0,
    eventListeners: 0,
    animationFrames: 0,
    // GC-related metrics
    gcCount: 0,
    gcFrequency: 0, // GCs per minute
    lastGCTime: null,
    memoryPressure: "normal", // low, normal, high, critical
    allocationRate: 0, // MB/s
    memoryEfficiency: 100, // %
    longTasks: 0,
    frameDrops: 0,
    gcPauses: [],
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderStartTime = useRef(0);
  const animationFrameIds = useRef(new Set());

  // GC tracking refs
  const lastMemoryCheck = useRef(performance.now());
  const memoryHistory = useRef([]);
  const gcEvents = useRef([]);
  const frameTimeHistory = useRef([]);
  const allocationHistory = useRef([]);
  const longTaskObserver = useRef(null);

  // GC Detection: Monitor sudden memory drops
  const detectGarbageCollection = useCallback(() => {
    if (!performance.memory) return;

    const now = performance.now();
    const currentMemory = performance.memory.usedJSHeapSize;
    const timeDelta = now - lastMemoryCheck.current;

    if (timeDelta < 100) return; // Check every 100ms minimum

    // Store memory history (keep last 50 samples)
    memoryHistory.current.push({
      time: now,
      memory: currentMemory,
      timeDelta,
    });

    if (memoryHistory.current.length > 50) {
      memoryHistory.current.shift();
    }

    // Detect GC: sudden memory drop of >5MB or >10%
    if (memoryHistory.current.length >= 2) {
      const prev = memoryHistory.current[memoryHistory.current.length - 2];
      const memoryDrop = prev.memory - currentMemory;
      const dropPercentage = (memoryDrop / prev.memory) * 100;

      if (memoryDrop > 5 * 1024 * 1024 || dropPercentage > 10) {
        // Detected GC!
        const gcEvent = {
          time: now,
          memoryDropped: memoryDrop,
          dropPercentage,
          duration: timeDelta, // Approximate
        };

        gcEvents.current.push(gcEvent);

        // Keep only last 20 GC events
        if (gcEvents.current.length > 20) {
          gcEvents.current.shift();
        }
      }
    }

    // Calculate allocation rate (MB/s)
    if (memoryHistory.current.length >= 10) {
      const last10 = memoryHistory.current.slice(-10);
      const totalTime = last10[last10.length - 1].time - last10[0].time;
      const memoryIncrease = Math.max(
        0,
        last10[last10.length - 1].memory - last10[0].memory
      );
      const allocationRate =
        memoryIncrease / (1024 * 1024) / (totalTime / 1000);

      allocationHistory.current.push({
        time: now,
        rate: allocationRate,
      });

      if (allocationHistory.current.length > 20) {
        allocationHistory.current.shift();
      }
    }

    lastMemoryCheck.current = now;
  }, []);

  // Memory Pressure Analysis
  const analyzeMemoryPressure = useCallback(() => {
    if (!performance.memory) return "normal";

    const used = performance.memory.usedJSHeapSize;
    const total = performance.memory.totalJSHeapSize;
    const limit = performance.memory.jsHeapSizeLimit;

    const usagePercentage = (used / limit) * 100;
    const totalPercentage = (total / limit) * 100;

    if (usagePercentage > 85 || totalPercentage > 90) return "critical";
    if (usagePercentage > 70 || totalPercentage > 80) return "high";
    if (usagePercentage > 50 || totalPercentage > 60) return "medium";
    return "low";
  }, []);

  // Frame Drop Detection
  const detectFrameDrops = useCallback((frameTime) => {
    frameTimeHistory.current.push({
      time: performance.now(),
      frameTime,
    });

    if (frameTimeHistory.current.length > 60) {
      // Keep 1 second of frame history at 60fps
      frameTimeHistory.current.shift();
    }

    // Detect frame drops (frame time > 33ms = below 30fps)
    return frameTime > 33.33;
  }, []);

  // Setup Long Task Observer
  useEffect(() => {
    if (!enabled || !window.PerformanceObserver) return;

    try {
      longTaskObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === "longtask") {
            setMetrics((prev) => ({
              ...prev,
              longTasks: prev.longTasks + 1,
            }));

            // Long tasks might indicate GC pauses
            if (entry.duration > 50) {
              // Tasks longer than 50ms
              setMetrics((prev) => ({
                ...prev,
                gcPauses: [
                  ...prev.gcPauses.slice(-9),
                  {
                    time: entry.startTime,
                    duration: entry.duration,
                    type: entry.duration > 100 ? "major" : "minor",
                  },
                ],
              }));
            }
          }
        });
      });

      longTaskObserver.current.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      console.warn("Long task observer not supported:", e);
    }

    return () => {
      if (longTaskObserver.current) {
        longTaskObserver.current.disconnect();
      }
    };
  }, [enabled]);

  // Monkey patch requestAnimationFrame
  useEffect(() => {
    if (!enabled) return;

    const originalRAF = window.requestAnimationFrame;
    const originalCAF = window.cancelAnimationFrame;

    window.requestAnimationFrame = (callback) => {
      const id = originalRAF((time) => {
        animationFrameIds.current.delete(id);
        callback(time);
      });
      animationFrameIds.current.add(id);
      return id;
    };

    window.cancelAnimationFrame = (id) => {
      animationFrameIds.current.delete(id);
      return originalCAF(id);
    };

    return () => {
      window.requestAnimationFrame = originalRAF;
      window.cancelAnimationFrame = originalCAF;
    };
  }, [enabled]);

  const countEventListeners = useCallback(() => {
    let count = 0;
    const elementsWithListeners = document.querySelectorAll("*");
    elementsWithListeners.forEach((el) => {
      if (el.onclick || el.onmousemove || el.onmouseenter || el.onmouseleave)
        count++;
    });
    return count;
  }, []);

  // Main performance monitoring loop
  useEffect(() => {
    if (!enabled) return;

    let rafId;

    const measurePerformance = () => {
      const now = performance.now();
      frameCount.current++;

      // Detect GC on every frame
      detectGarbageCollection();

      // Calculate FPS every second
      if (now - lastTime.current >= 1000) {
        const fps = Math.round(
          (frameCount.current * 1000) / (now - lastTime.current)
        );
        const frameTime = (now - lastTime.current) / frameCount.current;
        const isFrameDropped = detectFrameDrops(frameTime);

        // Memory analysis
        const memory = performance.memory || {};
        const memoryUsed = Math.round(
          (memory.usedJSHeapSize || 0) / 1024 / 1024
        );
        const memoryTotal = Math.round(
          (memory.totalJSHeapSize || 0) / 1024 / 1024
        );

        // GC analysis
        const recentGCs = gcEvents.current.filter(
          (gc) => now - gc.time < 60000
        ); // Last minute
        const gcFrequency = recentGCs.length; // GCs per minute
        const lastGC = gcEvents.current[gcEvents.current.length - 1];

        // Allocation rate analysis
        const recentAllocations = allocationHistory.current.filter(
          (a) => now - a.time < 5000
        );
        const avgAllocationRate =
          recentAllocations.length > 0
            ? recentAllocations.reduce((sum, a) => sum + a.rate, 0) /
              recentAllocations.length
            : 0;

        // Memory efficiency calculation
        const memoryEfficiency = memory.jsHeapSizeLimit
          ? Math.round(
              (1 - memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            )
          : 100;

        setMetrics((prevMetrics) => ({
          ...prevMetrics,
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          memoryUsed,
          memoryTotal,
          renderTime:
            renderStartTime.current > 0
              ? now - renderStartTime.current
              : prevMetrics.renderTime,
          eventListeners: countEventListeners(),
          animationFrames: animationFrameIds.current.size,
          // GC metrics
          gcCount: gcEvents.current.length,
          gcFrequency,
          lastGCTime: lastGC ? lastGC.time : null,
          memoryPressure: analyzeMemoryPressure(),
          allocationRate: Math.round(avgAllocationRate * 100) / 100,
          memoryEfficiency,
          frameDrops: prevMetrics.frameDrops + (isFrameDropped ? 1 : 0),
        }));

        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId = requestAnimationFrame(measurePerformance);
    };

    rafId = requestAnimationFrame(measurePerformance);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [
    enabled,
    detectGarbageCollection,
    analyzeMemoryPressure,
    detectFrameDrops,
    countEventListeners,
  ]);

  const startRenderMeasure = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRenderMeasure = useCallback(() => {
    if (renderStartTime.current > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics((prev) => ({
        ...prev,
        renderTime: Math.round(renderTime * 100) / 100,
      }));
      renderStartTime.current = 0;
    }
  }, []);

  // Enhanced performance warnings including GC
  const getPerformanceWarnings = useCallback(() => {
    const warnings = [];

    if (metrics.fps < 30) warnings.push("FPS bajo (<30)");
    if (metrics.frameTime > 33) warnings.push("Frame time alto (>33ms)");
    if (metrics.memoryUsed > 100) warnings.push("Alto uso de memoria (>100MB)");
    if (metrics.eventListeners > 50) warnings.push("Muchos event listeners");
    if (metrics.animationFrames > 10)
      warnings.push("Muchos animation frames activos");
    if (metrics.renderTime > 16) warnings.push("Render time alto (>16ms)");

    // GC-specific warnings
    if (metrics.gcFrequency > 10) warnings.push("GC muy frecuente (>10/min)");
    if (metrics.memoryPressure === "critical")
      warnings.push("Presión de memoria crítica");
    if (metrics.memoryPressure === "high")
      warnings.push("Presión de memoria alta");
    if (metrics.allocationRate > 5)
      warnings.push("Tasa de asignación alta (>5MB/s)");
    if (metrics.memoryEfficiency < 20)
      warnings.push("Eficiencia de memoria baja (<20%)");
    if (metrics.longTasks > 5) warnings.push("Muchas tareas largas detectadas");
    if (metrics.frameDrops > metrics.fps * 0.1)
      warnings.push("Muchos frame drops detectados");
    if (metrics.gcPauses.length > 3)
      warnings.push("Pausas de GC frecuentes detectadas");

    return warnings;
  }, [metrics]);

  // Force GC if available (for testing)
  const forceGC = useCallback(() => {
    if (window.gc) {
      const before = performance.memory?.usedJSHeapSize || 0;
      const gcStart = performance.now();

      window.gc();

      const after = performance.memory?.usedJSHeapSize || 0;
      const gcDuration = performance.now() - gcStart;

      console.log(
        `🗑️ Manual GC: ${Math.round(
          (before - after) / 1024 / 1024
        )}MB freed in ${gcDuration.toFixed(2)}ms`
      );

      // Add manual GC to events
      gcEvents.current.push({
        time: performance.now(),
        memoryDropped: before - after,
        dropPercentage: ((before - after) / before) * 100,
        duration: gcDuration,
        manual: true,
      });
    } else {
      console.log(
        '⚠️ GC no disponible. Abre Chrome con --js-flags="--expose-gc"'
      );
    }
  }, []);

  // Get detailed GC stats
  const getGCStats = useCallback(() => {
    const recentGCs = gcEvents.current.filter(
      (gc) => performance.now() - gc.time < 60000
    );

    const manualGCs = recentGCs.filter((gc) => gc.manual).length;
    const autoGCs = recentGCs.length - manualGCs;
    const avgDropSize =
      recentGCs.length > 0
        ? recentGCs.reduce((sum, gc) => sum + gc.memoryDropped, 0) /
          recentGCs.length /
          1024 /
          1024
        : 0;

    return {
      totalGCs: gcEvents.current.length,
      recentGCs: recentGCs.length,
      manualGCs,
      autoGCs,
      avgDropSize: Math.round(avgDropSize * 100) / 100,
      gcHistory: gcEvents.current.slice(-10), // Last 10 GCs
    };
  }, []);

  return {
    metrics,
    warnings: getPerformanceWarnings(),
    startRenderMeasure,
    endRenderMeasure,
    forceGC,
    getGCStats,
    // Advanced debugging info
    memoryHistory: memoryHistory.current.slice(-20),
    frameTimeHistory: frameTimeHistory.current.slice(-30),
    allocationHistory: allocationHistory.current.slice(-10),
  };
};
