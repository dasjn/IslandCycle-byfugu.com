// src/components/PerformanceOverlay.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  usePerformanceMonitor,
  useMemoryLeakDetector,
} from "../hooks/usePerformanceMonitor";

export default function PerformanceOverlay({ enabled = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { metrics, warnings, startRenderMeasure, endRenderMeasure } =
    usePerformanceMonitor(enabled);
  const { leaks, clearLeaks } = useMemoryLeakDetector();

  if (!enabled) return null;

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.danger) return "text-red-500";
    if (value >= thresholds.warning) return "text-yellow-500";
    return "text-green-500";
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

  return (
    <div className="fixed top-4 right-4 z-[10000] font-mono text-xs">
      {/* Toggle button */}
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
            {/* Core Metrics */}
            <div className="space-y-2 mb-4">
              <h3 className="text-white font-bold mb-2">Performance Metrics</h3>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`${fpsColor}`}>FPS: {metrics.fps}</div>
                <div className={`${frameTimeColor}`}>
                  Frame: {metrics.frameTime}ms
                </div>
                <div className={`${memoryColor}`}>
                  Memory: {metrics.memoryUsed}MB
                </div>
                <div className="text-white">Total: {metrics.memoryTotal}MB</div>
                <div className="text-white">Render: {metrics.renderTime}ms</div>
                <div className="text-white">RAF: {metrics.animationFrames}</div>
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mb-4">
                <h4 className="text-red-400 font-bold mb-1">⚠️ Warnings</h4>
                <div className="space-y-1">
                  {warnings.map((warning, index) => (
                    <div key={index} className="text-red-300 text-xs">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memory Leaks */}
            {leaks.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-orange-400 font-bold">🔥 Memory Leaks</h4>
                  <button
                    onClick={clearLeaks}
                    className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-20 overflow-y-auto space-y-1">
                  {leaks.slice(-3).map((leak, index) => (
                    <div key={index} className="text-orange-300 text-xs">
                      +{leak.memoryIncrease}MB
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <h4 className="text-white font-bold">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    // Forzar garbage collection si está disponible
                    if (window.gc) {
                      window.gc();
                      console.log("🗑️ Garbage collection forzado");
                    } else {
                      console.log(
                        '⚠️ GC no disponible. Abre Chrome con --js-flags="--expose-gc"'
                      );
                    }
                  }}
                  className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  Force GC
                </button>
                <button
                  onClick={() => {
                    // Limpiar console
                    console.clear();
                    console.log("🧹 Console limpiado");
                  }}
                  className="bg-purple-600 px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                >
                  Clear Console
                </button>
              </div>
            </div>

            {/* Performance Tips */}
            <div className="mt-4 text-xs text-gray-300">
              <details>
                <summary className="cursor-pointer text-white hover:text-gray-300">
                  Performance Tips
                </summary>
                <div className="mt-2 space-y-1">
                  <div>• FPS objetivo: 60fps (16.67ms/frame)</div>
                  <div>• Memoria: Mantener bajo 100MB</div>
                  <div>• RAF activos: Minimizar animaciones</div>
                  <div>• Usar Chrome DevTools para análisis detallado</div>
                  <div>• El cursor se ralentiza cuando FPS &lt; 30</div>
                </div>
              </details>
            </div>

            {/* Quick Performance Status */}
            <div className="mt-4 p-2 rounded text-center text-sm font-bold">
              {warnings.length === 0 ? (
                <span className="text-green-400">✅ Rendimiento OK</span>
              ) : warnings.length <= 2 ? (
                <span className="text-yellow-400">⚠️ Rendimiento Moderado</span>
              ) : (
                <span className="text-red-400">
                  🔥 Problemas de Rendimiento
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
