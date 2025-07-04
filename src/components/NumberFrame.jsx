// Componente compartido para el marco decorativo con brackets
export default function NumberFrame({
  children,
  size = "w-8 h-8", // Más grande para dar espacio al hover
  strokeWidth = "1",
  className = "",
}) {
  return (
    <div
      className={`relative ${size} flex items-center justify-center ${className}`}
    >
      {/* Marco decorativo con brackets - posicionados con margen interno */}
      <div className="absolute inset-0">
        {" "}
        {/* inset-2 da margen interno de 8px */}
        {/* Bracket superior izquierdo */}
        <svg
          className="absolute top-0 left-0"
          width="12"
          height="12"
          viewBox="0 0 12 12"
        >
          <polyline
            points="15,1 1,1 1,15"
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth}
          />
        </svg>
        {/* Bracket superior derecho */}
        <svg
          className="absolute top-0 right-0"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{ transform: "rotate(90deg)" }}
        >
          <polyline
            points="15,1 1,1 1,15"
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth}
          />
        </svg>
        {/* Bracket inferior izquierdo */}
        <svg
          className="absolute bottom-0 left-0"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{ transform: "rotate(270deg)" }}
        >
          <polyline
            points="15,1 1,1 1,15"
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth}
          />
        </svg>
        {/* Bracket inferior derecho */}
        <svg
          className="absolute bottom-0 right-0"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          style={{ transform: "rotate(180deg)" }}
        >
          <polyline
            points="15,1 1,1 1,15"
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth}
          />
        </svg>
      </div>

      {/* Contenido (número) */}
      <span className="relative z-10 text-white text-xl font-light">
        {children}
      </span>
    </div>
  );
}
