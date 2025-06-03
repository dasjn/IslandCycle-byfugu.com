import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useMagneticCursor } from "../hooks/useMagneticCursor";

export default function MagneticElement({
  children,
  onClick,
  className,
  delay = 0,
  as: Component = "button",
  skipInitialAnimation = false,
  onHover,
  onLeave,
  ...props
}) {
  const ref = useRef(null);
  const { setHoveredElement } = useMagneticCursor();
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (ref.current) {
      const { clientX, clientY } = e;
      const { width, height, left, top } = ref.current.getBoundingClientRect();
      const x = clientX - (left + width / 2);
      const y = clientY - (top + height / 2);
      setPosition({ x: x * 0.1, y: y * 0.1 });
    }
  };

  const handleMouseEnter = () => {
    if (ref.current) {
      setHoveredElement(ref.current.getBoundingClientRect());
      if (onHover) onHover();
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setHoveredElement(null);
    if (onLeave) onLeave();
  };

  return (
    <motion.div
      ref={ref}
      as={Component}
      onClick={onClick}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      initial={
        skipInitialAnimation
          ? { scale: 1, opacity: 1 }
          : { scale: 0, opacity: 0 }
      }
      animate={{
        scale: 1,
        opacity: 1,
        x: position.x,
        y: position.y,
      }}
      transition={{
        scale: skipInitialAnimation
          ? { duration: 0 }
          : { delay, duration: 0.3 },
        opacity: skipInitialAnimation
          ? { duration: 0 }
          : { delay, duration: 0.3 },
        x: { type: "spring", stiffness: 150, damping: 15, mass: 0.1 },
        y: { type: "spring", stiffness: 150, damping: 15, mass: 0.1 },
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}

      {/* Brackets en las esquinas */}
      <svg
        className="absolute top-0 left-0 opacity-50 hover:opacity-100 transition-opacity duration-300"
        width="8"
        height="8"
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
        className="absolute top-0 right-0 opacity-50 hover:opacity-100 transition-opacity duration-300"
        width="8"
        height="8"
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
        className="absolute bottom-0 left-0 opacity-50 hover:opacity-100 transition-opacity duration-300"
        width="8"
        height="8"
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
        className="absolute bottom-0 right-0 opacity-50 hover:opacity-100 transition-opacity duration-300"
        width="8"
        height="8"
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
