import { useEffect, useState } from "react";
import { MagneticCursorContext } from "../context/MagneticCursorContext";

export function MagneticCursorProvider({ children }) {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [hoveredElement, setHoveredElement] = useState(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const value = {
    mousePosition,
    hoveredElement,
    setHoveredElement,
  };

  return (
    <MagneticCursorContext.Provider value={value}>
      {children}
    </MagneticCursorContext.Provider>
  );
}
