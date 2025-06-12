// src/hooks/usePerformanceMonitor.jsx
import { useEffect, useRef, useState, useCallback } from "react";

export const usePerformanceMonitor = (enabled = true) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    frameTime: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    renderTime: 0,
    eventListeners: 0,
    animationFrames: 0,
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderStartTime = useRef(0);
  const animationFrameIds = useRef(new Set());

  // Monkey patch requestAnimationFrame para contar frames activos
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
    // Aproximación para contar listeners
    let count = 0;

    // Contar elementos con listeners (aproximación)
    const elementsWithListeners = document.querySelectorAll("*");
    elementsWithListeners.forEach((el) => {
      // Esto es una aproximación - detecta algunos listeners comunes
      if (el.onclick || el.onmousemove || el.onmouseenter || el.onmouseleave)
        count++;
    });

    return count;
  }, []);

  // Monitor FPS y otros métricas
  useEffect(() => {
    if (!enabled) return;

    let rafId;

    const measurePerformance = () => {
      const now = performance.now();
      frameCount.current++;

      // Calcular FPS cada segundo
      if (now - lastTime.current >= 1000) {
        const fps = Math.round(
          (frameCount.current * 1000) / (now - lastTime.current)
        );
        const frameTime = (now - lastTime.current) / frameCount.current;

        // Memoria (si está disponible)
        const memory = performance.memory || {};
        const memoryUsed = Math.round(
          (memory.usedJSHeapSize || 0) / 1024 / 1024
        );
        const memoryTotal = Math.round(
          (memory.totalJSHeapSize || 0) / 1024 / 1024
        );

        // Contar event listeners activos
        const eventListeners = countEventListeners();

        setMetrics({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          memoryUsed,
          memoryTotal,
          renderTime:
            renderStartTime.current > 0 ? now - renderStartTime.current : 0,
          eventListeners,
          animationFrames: animationFrameIds.current.size,
        });

        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId = requestAnimationFrame(measurePerformance);
    };

    rafId = requestAnimationFrame(measurePerformance);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled, countEventListeners]);

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

  // Detectar problemas de rendimiento
  const getPerformanceWarnings = useCallback(() => {
    const warnings = [];

    if (metrics.fps < 30) warnings.push("FPS bajo (<30)");
    if (metrics.frameTime > 33) warnings.push("Frame time alto (>33ms)");
    if (metrics.memoryUsed > 100) warnings.push("Alto uso de memoria (>100MB)");
    if (metrics.eventListeners > 50) warnings.push("Muchos event listeners");
    if (metrics.animationFrames > 10)
      warnings.push("Muchos animation frames activos");
    if (metrics.renderTime > 16) warnings.push("Render time alto (>16ms)");

    return warnings;
  }, [metrics]);

  return {
    metrics,
    warnings: getPerformanceWarnings(),
    startRenderMeasure,
    endRenderMeasure,
  };
};

// Hook para detectar memory leaks
export const useMemoryLeakDetector = () => {
  const [leaks, setLeaks] = useState([]);
  const initialMemory = useRef(0);
  const checkInterval = useRef(null);

  useEffect(() => {
    if (performance.memory) {
      initialMemory.current = performance.memory.usedJSHeapSize;

      // Revisar memoria cada 5 segundos
      checkInterval.current = setInterval(() => {
        const currentMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = currentMemory - initialMemory.current;

        // Si la memoria ha aumentado más de 50MB, es sospechoso
        if (memoryIncrease > 50 * 1024 * 1024) {
          setLeaks((prev) => [
            ...prev,
            {
              timestamp: Date.now(),
              memoryIncrease: Math.round(memoryIncrease / 1024 / 1024),
              message: `Posible memory leak: +${Math.round(
                memoryIncrease / 1024 / 1024
              )}MB`,
            },
          ]);
        }
      }, 5000);
    }

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, []);

  const clearLeaks = useCallback(() => {
    setLeaks([]);
    if (performance.memory) {
      initialMemory.current = performance.memory.usedJSHeapSize;
    }
  }, []);

  return { leaks, clearLeaks };
};
