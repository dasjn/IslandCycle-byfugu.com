import {
  BRACKET_SVG_SIZE,
  CURSOR_SIZE,
  MAGNETIC_PADDING,
} from "../constants/MagneticCursorConstants";
import { useMagneticCursor } from "../hooks/useMagneticCursor";
import { motion } from "framer-motion";

export default function MagneticCursor() {
  const { mousePosition, hoveredElement } = useMagneticCursor();

  // Calcular el centro del elemento magnetizado
  const getElementCenter = () => {
    if (!hoveredElement) return { x: 0, y: 0 };
    return {
      x: hoveredElement.left + hoveredElement.width / 2,
      y: hoveredElement.top + hoveredElement.height / 2,
    };
  };

  // Calcular offset sutil del mouse
  const getMouseOffset = () => {
    if (!hoveredElement) return { x: 0, y: 0 };
    const center = getElementCenter();
    const offsetX = (mousePosition.x - center.x) * 0.15; // Factor de 0.15 para movimiento sutil
    const offsetY = (mousePosition.y - center.y) * 0.15;
    return { x: offsetX, y: offsetY };
  };

  const mouseOffset = getMouseOffset();

  const cursorVariants = {
    default: {
      x: mousePosition.x - CURSOR_SIZE / 2,
      y: mousePosition.y - CURSOR_SIZE / 2,
      width: CURSOR_SIZE,
      height: CURSOR_SIZE,
      rotate: 360,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 700, damping: 30, mass: 0.15 },
        y: { type: "spring", stiffness: 700, damping: 30, mass: 0.15 },
        width: { type: "spring", stiffness: 700, damping: 30, mass: 0.15 },
        height: { type: "spring", stiffness: 700, damping: 30, mass: 0.15 },
        rotate: { repeat: Infinity, duration: 5, ease: "linear" },
      },
    },
    magnetized: {
      x: hoveredElement
        ? hoveredElement.left - MAGNETIC_PADDING + mouseOffset.x
        : mousePosition.x - CURSOR_SIZE / 2,
      y: hoveredElement
        ? hoveredElement.top - MAGNETIC_PADDING + mouseOffset.y
        : mousePosition.y - CURSOR_SIZE / 2,
      width: hoveredElement
        ? hoveredElement.width + MAGNETIC_PADDING * 2
        : CURSOR_SIZE,
      height: hoveredElement
        ? hoveredElement.height + MAGNETIC_PADDING * 2
        : CURSOR_SIZE,
      rotate: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 25, mass: 0.2 },
        y: { type: "spring", stiffness: 300, damping: 25, mass: 0.2 },
        width: { type: "spring", stiffness: 200, damping: 20, mass: 0.2 },
        height: { type: "spring", stiffness: 200, damping: 20, mass: 0.2 },
        rotate: { duration: 0.1, ease: "easeOut" },
      },
    },
  };

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] border-none border-white/30 rounded-full"
      variants={cursorVariants}
      animate={hoveredElement ? "magnetized" : "default"}
      style={{
        mixBlendMode: "difference",
      }}
    >
      {/* Brackets en las esquinas */}
      <svg
        className="absolute top-0 left-0"
        width={BRACKET_SVG_SIZE}
        height={BRACKET_SVG_SIZE}
        viewBox="0 0 16 16"
      >
        <polyline
          points="15,1 1,1 1,15"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <svg
        className="absolute top-0 right-0"
        width={BRACKET_SVG_SIZE}
        height={BRACKET_SVG_SIZE}
        viewBox="0 0 16 16"
        style={{ transform: "rotate(90deg)" }}
      >
        <polyline
          points="15,1 1,1 1,15"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0"
        width={BRACKET_SVG_SIZE}
        height={BRACKET_SVG_SIZE}
        viewBox="0 0 16 16"
        style={{ transform: "rotate(270deg)" }}
      >
        <polyline
          points="15,1 1,1 1,15"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <svg
        className="absolute bottom-0 right-0"
        width={BRACKET_SVG_SIZE}
        height={BRACKET_SVG_SIZE}
        viewBox="0 0 16 16"
        style={{ transform: "rotate(180deg)" }}
      >
        <polyline
          points="15,1 1,1 1,15"
          fill="none"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    </motion.div>
  );
}
