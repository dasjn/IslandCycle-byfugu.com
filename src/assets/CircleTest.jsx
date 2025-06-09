// Opción 1: Estilos inline con objetos JavaScript
export default function CircleTest() {
  const styles = {
    s0: {
      fill: "none",
      stroke: "#ffffff",
      strokeMiterlimit: 10,
    },
    t1: {
      fontSize: "24px",
      fill: "#ffffff",
      fontWeight: 700,
      fontFamily: '"Chivo-Bold", "Chivo"',
    },
  };

  return (
    <svg
      version="1.2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1920 1080"
      width="1920"
      height="1080"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        color: "white",
      }}
    >
      <title>Proyecto nuevo</title>
      <g id="Layer 1">
        <path
          id="Forma 1"
          fillRule="evenodd"
          style={styles.s0}
          d="m960 1024c-267.7 0-484-216.3-484-484 0-267.7 216.3-484 484-484 267.7 0 484 216.3 484 484 0 267.7-216.3 484-484 484z"
        />
        <text
          id="AGUA"
          style={{
            transform: "matrix(5.692,0,0,5.692,363,411.939)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            AGUA
          </tspan>
        </text>
        <text
          id="AGUA-copy"
          style={{
            transform: "matrix(5.692,0,0,5.692,1193,428.939)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            AGUA
          </tspan>
        </text>
        <text
          id="Agüitaa-rica-salada"
          style={{
            transform: "matrix(1.478,0,0,1.478,383,310.565)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            Agüitaa rica salada
          </tspan>
        </text>
        <text
          id="Agüitaa-rica-salada-copy"
          style={{
            transform: "matrix(1.478,0,0,1.478,1234,319.565)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            Agüitaa rica salada
          </tspan>
        </text>
        <text
          id="Agüitaa-rica-salada-copy-2"
          style={{
            transform: "matrix(1.478,0,0,1.478,768,179.565)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            Agüitaa rica salada
          </tspan>
        </text>
        <text
          id="Agüitaa-rica-salada-copy-3"
          style={{
            transform: "matrix(1.478,0,0,1.478,440,817.565)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            Agüitaa rica salada
          </tspan>
        </text>
        <text
          id="Agüitaa-rica-salada-copy-4"
          style={{
            transform: "matrix(1.478,0,0,1.478,1168,830.565)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            Agüitaa rica salada
          </tspan>
        </text>
        <text
          id="AGUA-copy-2"
          style={{
            transform: "matrix(5.692,0,0,5.692,428,932.939)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            AGUA
          </tspan>
        </text>
        <text
          id="AGUA-top"
          style={{
            transform: "matrix(5.692,0,0,5.692,738,125.939)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            AGUA
          </tspan>
        </text>
        <text
          id="AGUA-copy-3"
          style={{
            transform: "matrix(5.692,0,0,5.692,1137,937.939)",
            ...styles.t1,
          }}
        >
          <tspan x="0" y="0">
            AGUA
          </tspan>
        </text>
      </g>
    </svg>
  );
}
