import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useMagneticCursor } from "../hooks/useMagneticCursor";
import { useGlobalMouse } from "../hooks/useGlobalMouse";

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
  const [isHovered, setIsHovered] = useState(false);

  const mouseState = useGlobalMouse({
    enabled: isHovered, // Solo activo cuando está hovered
    throttle: 8, // Throttling moderado
    raw: true,
    normalized: false,
  });

  useEffect(() => {
    if (!isHovered || !ref.current || !mouseState.isMoving) return;

    const { x: mouseX, y: mouseY } = mouseState;
    const rect = ref.current.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    // Aplicar factor magnético
    setPosition({
      x: deltaX * 0.1,
      y: deltaY * 0.1,
    });
  }, [isHovered, mouseState.x, mouseState.y, mouseState.isMoving, mouseState]);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      setIsHovered(true);
      setHoveredElement(ref.current.getBoundingClientRect());
      if (onHover) onHover();
    }
  }, [setHoveredElement, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setPosition({ x: 0, y: 0 });
    setHoveredElement(null);
    if (onLeave) onLeave();
  }, [setHoveredElement, onLeave]);

  return (
    <motion.div
      ref={ref}
      as={Component}
      onClick={onClick}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
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
      // whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
