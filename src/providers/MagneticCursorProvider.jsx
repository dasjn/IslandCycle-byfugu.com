import { useEffect, useState, useCallback, useMemo } from "react";
import { MagneticCursorContext } from "../context/MagneticCursorContext";

export function MagneticCursorProvider({ children }) {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [hoveredElement, setHoveredElement] = useState(null);

  useEffect(() => {
    // Usar requestAnimationFrame para throttling optimizado del mouse tracking
    let rafId = null;
    let pendingPosition = null;

    const throttledMouseMove = (event) => {
      // Guardar la posición más reciente
      pendingPosition = { x: event.clientX, y: event.clientY };

      // Solo programar una actualización si no hay una pendiente
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (pendingPosition) {
            setMousePosition(pendingPosition);
            pendingPosition = null;
          }
          rafId = null;
        });
      }
    };

    // Usar passive: true para mejor rendimiento
    window.addEventListener("mousemove", throttledMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Memoizar el valor del contexto para evitar re-renders innecesarios
  const value = useMemo(
    () => ({
      mousePosition,
      hoveredElement,
      setHoveredElement,
    }),
    [mousePosition, hoveredElement]
  );

  return (
    <MagneticCursorContext.Provider value={value}>
      {children}
    </MagneticCursorContext.Provider>
  );
}
