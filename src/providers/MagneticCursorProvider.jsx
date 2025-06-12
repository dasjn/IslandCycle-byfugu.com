// src/providers/MagneticCursorProvider.jsx - OPTIMIZACIONES AVANZADAS (GRADUALES)

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { MagneticCursorContext } from "../context/MagneticCursorContext";

export function MagneticCursorProvider({ children }) {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [hoveredElement, setHoveredElement] = useState(null);

  // Referencias para optimizaciones
  const lastUpdateTime = useRef(0);
  const rafId = useRef(null);
  const lastPosition = useRef({ x: -100, y: -100 });
  const isPageVisible = useRef(true);

  // OPTIMIZACIÓN 1: Pausar cuando página no está visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;

      // Si se oculta la página, cancelar RAF pendientes
      if (document.hidden && rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    let pendingPosition = null;

    const throttledMouseMove = (event) => {
      // OPTIMIZACIÓN 2: No procesar si página no está visible
      if (!isPageVisible.current) return;

      const now = performance.now();
      const newX = event.clientX;
      const newY = event.clientY;

      // OPTIMIZACIÓN 3: Threshold de distancia (evita micro-movimientos)
      const deltaX = newX - lastPosition.current.x;
      const deltaY = newY - lastPosition.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Si el mouse se movió menos de 0.5px, ignorar
      if (distance < 0.5) return;

      // OPTIMIZACIÓN 4: Throttling adaptativo
      // Más throttling cuando no hay elementos hover
      const throttleTime = hoveredElement ? 4 : 8; // 4ms con hover, 8ms sin hover

      if (now - lastUpdateTime.current < throttleTime) {
        pendingPosition = { x: newX, y: newY };
        return;
      }

      const position = pendingPosition || { x: newX, y: newY };
      pendingPosition = null;

      if (!rafId.current) {
        rafId.current = requestAnimationFrame(() => {
          setMousePosition(position);
          lastPosition.current = position; // OPTIMIZACIÓN 5: Guardar última posición
          lastUpdateTime.current = performance.now();
          rafId.current = null;
        });
      } else {
        pendingPosition = position;
      }
    };

    window.addEventListener("mousemove", throttledMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [hoveredElement]); // OPTIMIZACIÓN 6: Dependencia de hoveredElement para throttling adaptativo

  // OPTIMIZACIÓN 7: Cleanup mejorado de hoveredElement
  const setHoveredElementOptimized = useCallback((element) => {
    setHoveredElement(element);

    // Si no hay elemento hover, podemos ser más agresivos con el throttling
    if (!element) {
      // Opcional: Reducir frecuencia cuando no hay hover
      lastUpdateTime.current = performance.now() + 2; // +2ms de delay extra
    }
  }, []);

  const pauseTracking = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  // OPTIMIZACIÓN 8: Stats para debugging
  const getStats = useCallback(() => {
    return {
      isPageVisible: isPageVisible.current,
      hasPendingRAF: rafId.current !== null,
      lastUpdateTime: lastUpdateTime.current,
      hoveredElement: !!hoveredElement,
    };
  }, [hoveredElement]);

  const value = useMemo(
    () => ({
      mousePosition,
      hoveredElement,
      setHoveredElement: setHoveredElementOptimized,
      pauseTracking,
      getStats, // Para debugging
    }),
    [
      mousePosition,
      hoveredElement,
      setHoveredElementOptimized,
      pauseTracking,
      getStats,
    ]
  );

  return (
    <MagneticCursorContext.Provider value={value}>
      {children}
    </MagneticCursorContext.Provider>
  );
}
