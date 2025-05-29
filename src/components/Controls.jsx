export default function Controls({ isToggled, onToggle }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.95)",
          padding: "15px",
          borderRadius: "12px",
          fontWeight: "bold",
          fontSize: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {isToggled
          ? "☁️ Escena con Parallax (Nubes + Montañas + Isla)"
          : "🏔️ Escena Simple (Paisaje de Montaña)"}
      </div>

      <button
        onClick={onToggle}
        style={{
          padding: "15px 25px",
          fontSize: "16px",
          background: isToggled
            ? "linear-gradient(135deg, #fdcb6e, #e17055)"
            : "linear-gradient(135deg, #74b9ff, #0984e3)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "bold",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-3px) scale(1.02)";
          e.target.style.boxShadow = "0 12px 32px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0px) scale(1)";
          e.target.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
        }}
      >
        {isToggled ? "← Ver Escena Simple" : "Ver Parallax →"}
      </button>

      <div
        style={{
          background: "rgba(255,255,255,0.85)",
          padding: "12px",
          borderRadius: "8px",
          fontSize: "13px",
          lineHeight: "1.4",
          backdropFilter: "blur(5px)",
        }}
      >
        <strong>✨ Parallax Activado</strong>
        <br />
        • Fondo: 1% de intensidad
        <br />
        • Medio: 2% de intensidad
        <br />
        • Frente: 5% de intensidad
        <br />
        • Capa HTML: 2% (igual que nubes)
        <br />
        • Movimiento suavizado
        <br />• Sigue el cursor del mouse
      </div>
    </div>
  );
}
