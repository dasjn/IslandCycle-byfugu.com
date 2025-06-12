// src/components/EnhancedPerformanceOverlay.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEnhancedPerformanceMonitor } from "../hooks/useEnhancedPerformanceMonitor";

export default function EnhancedPerformanceOverlay({ enabled = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, gc, memory, detailed

  const {
    metrics,
    warnings,
    startRenderMeasure,
    endRenderMeasure,
    forceGC,
    getGCStats,
    memoryHistory,
    frameTimeHistory,
    allocationHistory,
  } = useEnhancedPerformanceMonitor(enabled);

  if (!enabled) return null;

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.danger) return "text-red-500";
    if (value >= thresholds.warning) return "text-yellow-500";
    return "text-green-500";
  };

  const getMemoryPressureColor = (pressure) => {
    switch (pressure) {
      case "critical":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const fpsColor = getStatusColor(60 - metrics.fps, {
    warning: 20,
    danger: 40,
  });
  const memoryColor = getStatusColor(metrics.memoryUsed, {
    warning: 50,
    danger: 100,
  });
  const frameTimeColor = getStatusColor(metrics.frameTime, {
    warning: 20,
    danger: 33,
  });
  const gcColor = getStatusColor(metrics.gcFrequency, {
    warning: 5,
    danger: 10,
  });
  const allocationColor = getStatusColor(metrics.allocationRate, {
    warning: 2,
    danger: 5,
  });

  const gcStats = getGCStats();

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatDuration = (ms) => {
    return `${ms.toFixed(1)}ms`;
  };

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Core Metrics */}
      <div className="space-y-2">
        <h3 className="text-white font-bold text-sm">Core Performance</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={fpsColor}>FPS: {metrics.fps}</div>
          <div className={frameTimeColor}>Frame: {metrics.frameTime}ms</div>
          <div className={memoryColor}>Memory: {metrics.memoryUsed}MB</div>
          <div className="text-white">Total: {metrics.memoryTotal}MB</div>
          <div className="text-white">Render: {metrics.renderTime}ms</div>
          <div className="text-white">RAF: {metrics.animationFrames}</div>
        </div>
      </div>

      {/* GC Quick Stats */}
      <div className="space-y-2">
        <h3 className="text-white font-bold text-sm">Garbage Collection</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={gcColor}>GC/min: {metrics.gcFrequency}</div>
          <div className="text-white">Total GCs: {metrics.gcCount}</div>
          <div className={allocationColor}>
            Alloc: {metrics.allocationRate}MB/s
          </div>
          <div className="text-white">
            Efficiency: {metrics.memoryEfficiency}%
          </div>
          <div className={getMemoryPressureColor(metrics.memoryPressure)}>
            Pressure: {metrics.memoryPressure}
          </div>
          <div className="text-white">Drops: {metrics.frameDrops}</div>
        </div>
      </div>

      {/* Last GC */}
      {metrics.lastGCTime && (
        <div className="space-y-1">
          <h4 className="text-white font-bold text-xs">Last GC</h4>
          <div className="text-xs text-gray-300">
            {formatTime(metrics.lastGCTime)}
          </div>
        </div>
      )}
    </div>
  );

  const renderGCTab = () => (
    <div className="space-y-4">
      {/* GC Statistics */}
      <div className="space-y-2">
        <h3 className="text-white font-bold text-sm">GC Analysis</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-white">Recent GCs: {gcStats.recentGCs}</div>
          <div className="text-white">Auto GCs: {gcStats.autoGCs}</div>
          <div className="text-white">Manual GCs: {gcStats.manualGCs}</div>
          <div className="text-white">Avg Drop: {gcStats.avgDropSize}MB</div>
        </div>
      </div>

      {/* GC Pauses */}
      {metrics.gcPauses.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-bold text-xs">Recent GC Pauses</h4>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {metrics.gcPauses.slice(-5).map((pause, index) => (
              <div key={index} className="text-xs flex justify-between">
                <span
                  className={
                    pause.type === "major" ? "text-red-400" : "text-yellow-400"
                  }
                >
                  {pause.type} pause
                </span>
                <span className="text-gray-300">
                  {formatDuration(pause.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GC History */}
      {gcStats.gcHistory.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-white font-bold text-xs">GC History</h4>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {gcStats.gcHistory.slice(-5).map((gc, index) => (
              <div key={index} className="text-xs flex justify-between">
                <span className="text-gray-300">
                  {Math.round(gc.memoryDropped / 1024 / 1024)}MB
                </span>
                <span className="text-gray-400">{formatTime(gc.time)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GC Controls */}
      <div className="space-y-2">
        <button
          onClick={forceGC}
          className="w-full bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
        >
          Force GC
        </button>
      </div>
    </div>
  );

  const renderMemoryTab = () => (
    <div className="space-y-4">
      {/* Memory Status */}
      <div className="space-y-2">
        <h3 className="text-white font-bold text-sm">Memory Status</h3>
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Used:</span>
            <span className={memoryColor}>{metrics.memoryUsed}MB</span>
          </div>
          <div className="flex justify-between">
            <span>Total:</span>
            <span>{metrics.memoryTotal}MB</span>
          </div>
          <div className="flex justify-between">
            <span>Pressure:</span>
            <span className={getMemoryPressureColor(metrics.memoryPressure)}>
              {metrics.memoryPressure}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Efficiency:</span>
            <span>{metrics.memoryEfficiency}%</span>
          </div>
          <div className="flex justify-between">
            <span>Allocation Rate:</span>
            <span className={allocationColor}>
              {metrics.allocationRate}MB/s
            </span>
          </div>
        </div>
      </div>

      {/* Memory History Chart (Simple) */}
      {memoryHistory.length > 5 && (
        <div className="space-y-2">
          <h4 className="text-white font-bold text-xs">Memory Trend</h4>
          <div className="h-8 bg-gray-800 rounded relative overflow-hidden">
            <div className="flex h-full items-end">
              {memoryHistory.slice(-20).map((point, index) => {
                const height = (point.memory / (100 * 1024 * 1024)) * 100; // Normalize to 100MB
                return (
                  <div
                    key={index}
                    className="bg-blue-500 w-1 mx-px"
                    style={{ height: `${Math.min(height, 100)}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailedTab = () => (
    <div className="space-y-4">
      {/* System Info */}
      <div className="space-y-2">
        <h3 className="text-white font-bold text-sm">System</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Long Tasks: {metrics.longTasks}</div>
          <div>Frame Drops: {metrics.frameDrops}</div>
          <div>Event Listeners: {metrics.eventListeners}</div>
          <div>Active RAFs: {metrics.animationFrames}</div>
        </div>
      </div>

      {/* Frame Time History */}
      {frameTimeHistory.length > 5 && (
        <div className="space-y-2">
          <h4 className="text-white font-bold text-xs">Frame Times</h4>
          <div className="h-6 bg-gray-800 rounded relative overflow-hidden">
            <div className="flex h-full items-end">
              {frameTimeHistory.slice(-30).map((frame, index) => {
                const height = (frame.frameTime / 50) * 100; // Normalize to 50ms
                const color =
                  frame.frameTime > 33
                    ? "bg-red-500"
                    : frame.frameTime > 20
                    ? "bg-yellow-500"
                    : "bg-green-500";
                return (
                  <div
                    key={index}
                    className={`${color} w-1`}
                    style={{ height: `${Math.min(height, 100)}%` }}
                  />
                );
              })}
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Green: good (&lt;20ms), Yellow: ok (&lt;33ms), Red: dropped
            (&gt;33ms)
          </div>
        </div>
      )}

      {/* Allocation History */}
      {allocationHistory.length > 3 && (
        <div className="space-y-2">
          <h4 className="text-white font-bold text-xs">Allocation Rate</h4>
          <div className="h-6 bg-gray-800 rounded relative overflow-hidden">
            <div className="flex h-full items-end">
              {allocationHistory.slice(-10).map((alloc, index) => {
                const height = (alloc.rate / 5) * 100; // Normalize to 5MB/s
                const color =
                  alloc.rate > 3
                    ? "bg-red-500"
                    : alloc.rate > 1
                    ? "bg-yellow-500"
                    : "bg-green-500";
                return (
                  <div
                    key={index}
                    className={`${color} w-2 mx-px`}
                    style={{ height: `${Math.min(height, 100)}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed top-4 right-4 z-[10000] font-mono text-xs">
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-black/80 text-white px-3 py-1 rounded border border-white/20 mb-2 hover:bg-black/90"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isExpanded ? "Hide" : "Show"} Performance
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-black/90 text-white p-4 rounded border border-white/20 backdrop-blur-sm max-w-sm"
          >
            {/* Tabs */}
            <div className="flex space-x-1 mb-4">
              {[
                { id: "overview", label: "Overview" },
                { id: "gc", label: "GC" },
                { id: "memory", label: "Memory" },
                { id: "detailed", label: "Details" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && renderOverviewTab()}
            {activeTab === "gc" && renderGCTab()}
            {activeTab === "memory" && renderMemoryTab()}
            {activeTab === "detailed" && renderDetailedTab()}

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="text-red-400 font-bold mb-1 text-xs">
                  ⚠️ Issues
                </h4>
                <div className="space-y-1 max-h-16 overflow-y-auto">
                  {warnings.map((warning, index) => (
                    <div key={index} className="text-red-300 text-xs">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Status */}
            <div className="mt-4 p-2 rounded text-center text-xs font-bold">
              {warnings.length === 0 ? (
                <span className="text-green-400">✅ Performance OK</span>
              ) : warnings.some(
                  (w) => w.includes("GC") || w.includes("memoria")
                ) ? (
                <span className="text-red-400">🔥 Memory/GC Issues</span>
              ) : warnings.length <= 2 ? (
                <span className="text-yellow-400">⚠️ Minor Issues</span>
              ) : (
                <span className="text-red-400">🔥 Performance Issues</span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  console.clear();
                  console.log("🧹 Console cleared");
                }}
                className="bg-purple-600 px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
              >
                Clear Console
              </button>
              <button
                onClick={() => {
                  console.log("📊 Performance Metrics:", {
                    ...metrics,
                    gcStats: getGCStats(),
                    memoryHistory: memoryHistory.slice(-5),
                    warnings,
                  });
                }}
                className="bg-green-600 px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
              >
                Log Stats
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-xs text-gray-400">
              <details>
                <summary className="cursor-pointer hover:text-gray-300">
                  GC Monitoring Tips
                </summary>
                <div className="mt-2 space-y-1 text-xs">
                  <div>
                    • Abre Chrome con --js-flags="--expose-gc" para manual GC
                  </div>
                  <div>• GC frecuente indica memory leaks</div>
                  <div>• Frame drops pueden ser causados por GC pauses</div>
                  <div>• Allocation rate alta predice GC futuro</div>
                  <div>• Memory pressure crítica fuerza GC agresivo</div>
                </div>
              </details>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
