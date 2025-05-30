import { useRef, useState } from "react";
import { useMagneticCursor } from "../hooks/useMagneticCursor";
import { motion } from "framer-motion";

export default function MagneticElement({
  children,
  onClick,
  className,
  delay = 0,
  as: Component = "button",
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
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setHoveredElement(null);
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
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: position.x,
        y: position.y,
      }}
      transition={{
        scale: { delay, duration: 0.3 },
        opacity: { delay, duration: 0.3 },
        x: { type: "spring", stiffness: 150, damping: 15, mass: 0.1 },
        y: { type: "spring", stiffness: 150, damping: 15, mass: 0.1 },
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
