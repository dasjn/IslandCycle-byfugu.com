import { useEffect } from "react";
import MagneticElement from "./MagneticElement";
import { useMagneticCursor } from "../hooks/useMagneticCursor";

export default function BackButton({ isVisible, onBackClick }) {
  const { setHoveredElement } = useMagneticCursor();

  // Limpiar el estado del cursor cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Cleanup: resetear el cursor cuando el componente se desmonte
      setHoveredElement(null);
    };
  }, [setHoveredElement]);

  // También limpiar cuando isVisible cambie a false
  useEffect(() => {
    if (!isVisible) {
      setHoveredElement(null);
    }
  }, [isVisible, setHoveredElement]);

  if (!isVisible) return null;

  const handleBackClick = () => {
    // Resetear explícitamente el cursor antes de ejecutar el callback
    setHoveredElement(null);
    if (onBackClick) {
      onBackClick();
    }
  };

  return (
    <div className="absolute top-8 left-8 z-[10]">
      <MagneticElement
        onClick={handleBackClick}
        className="group relative flex items-center justify-center px-4 py-2 cursor-pointer"
        skipInitialAnimation={false}
      >
        {/* Marco decorativo con brackets */}
        <div className="absolute inset-0">
          {/* Bracket superior izquierdo */}
          <svg
            className="absolute top-0 left-0"
            width="12"
            height="12"
            viewBox="0 0 16 16"
          >
            <polyline
              points="15,1 1,1 1,15"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* Bracket superior derecho */}
          <svg
            className="absolute top-0 right-0"
            width="12"
            height="12"
            viewBox="0 0 16 16"
            style={{ transform: "rotate(90deg)" }}
          >
            <polyline
              points="15,1 1,1 1,15"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* Bracket inferior izquierdo */}
          <svg
            className="absolute bottom-0 left-0"
            width="12"
            height="12"
            viewBox="0 0 16 16"
            style={{ transform: "rotate(270deg)" }}
          >
            <polyline
              points="15,1 1,1 1,15"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>

          {/* Bracket inferior derecho */}
          <svg
            className="absolute bottom-0 right-0"
            width="12"
            height="12"
            viewBox="0 0 16 16"
            style={{ transform: "rotate(180deg)" }}
          >
            <polyline
              points="15,1 1,1 1,15"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        {/* Contenido del botón */}
        <div className="relative z-10 flex items-center gap-4 text-white">
          {/* Flecha hacia la izquierda */}
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>

          {/* Texto RETURN */}
          <span className="font-light text-2xl tracking-widest">RETURN</span>
        </div>
      </MagneticElement>
    </div>
  );
}
