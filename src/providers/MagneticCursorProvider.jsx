import { useMemo, useState, useCallback } from "react";
import { MagneticCursorContext } from "../context/MagneticCursorContext";
import { useMagneticCursor } from "../hooks/useGlobalMouse";

export function MagneticCursorProvider({ children }) {
  // ✅ USA EL MOUSE GLOBAL - Sin listeners propios
  const { mousePosition } = useMagneticCursor();
  const [hoveredElement, setHoveredElement] = useState(null);

  // Función optimizada para set hoveredElement
  const setHoveredElementOptimized = useCallback((element) => {
    setHoveredElement(element);
  }, []);

  // Context value memoizado
  const value = useMemo(
    () => ({
      mousePosition,
      hoveredElement,
      setHoveredElement: setHoveredElementOptimized,
    }),
    [mousePosition, hoveredElement, setHoveredElementOptimized]
  );

  return (
    <MagneticCursorContext.Provider value={value}>
      {children}
    </MagneticCursorContext.Provider>
  );
}
