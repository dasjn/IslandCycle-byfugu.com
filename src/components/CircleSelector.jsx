import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMagneticCursor } from "../hooks/useMagneticCursor";
import { useDevice } from "../hooks/useDevice";
import CircleSvg from "../assets/CircleSvg";

const SVG_DIMENSIONS = {
  width: 1301,
  height: 1081,
};

/**
 * Calcula coordenadas absolutas basadas en porcentajes del SVG
 * @param {number} xPercent - Porcentaje horizontal (0-100)
 * @param {number} yPercent - Porcentaje vertical (0-100)
 * @returns {Object} - Coordenadas {x, y}
 */
function calculateSVGPosition(xPercent, yPercent) {
  return {
    x: (SVG_DIMENSIONS.width * xPercent) / 100,
    y: (SVG_DIMENSIONS.height * yPercent) / 100,
  };
}

/**
 * Calcula coordenadas desde los bordes (útil para right/bottom)
 * @param {Object} options - Opciones de posicionamiento
 * @param {number} options.left - Porcentaje desde la izquierda
 * @param {number} options.right - Porcentaje desde la derecha
 * @param {number} options.top - Porcentaje desde arriba
 * @param {number} options.bottom - Porcentaje desde abajo
 * @returns {Object} - Coordenadas {x, y}
 */
function calculateSVGEdgePosition({ left, right, top, bottom }) {
  let x, y;

  if (left !== undefined) {
    x = (SVG_DIMENSIONS.width * left) / 100;
  } else if (right !== undefined) {
    x = SVG_DIMENSIONS.width - (SVG_DIMENSIONS.width * right) / 100;
  }

  if (top !== undefined) {
    y = (SVG_DIMENSIONS.height * top) / 100;
  } else if (bottom !== undefined) {
    y = SVG_DIMENSIONS.height - (SVG_DIMENSIONS.height * bottom) / 100;
  }

  return { x, y };
}

/**
 * Genera las coordenadas del frame para un número magnético
 * @param {number} centerX - Coordenada X del centro
 * @param {number} centerY - Coordenada Y del centro
 * @param {number} size - Tamaño del frame (default: 31)
 * @returns {Array} - Array de strings con las coordenadas del frame
 */
function generateMagneticNumberFrame(centerX, centerY, size = 31) {
  const halfSize = size / 2;
  const frameOffset = 8.68; // Offset entre las líneas del frame

  return [
    // Línea superior derecha
    `${centerX + halfSize - frameOffset} ${centerY + halfSize} ${
      centerX + halfSize
    } ${centerY + halfSize} ${centerX + halfSize} ${
      centerY + halfSize - frameOffset
    }`,
    // Línea superior izquierda
    `${centerX - halfSize + frameOffset} ${centerY - halfSize} ${
      centerX - halfSize
    } ${centerY - halfSize} ${centerX - halfSize} ${
      centerY - halfSize + frameOffset
    }`,
    // Línea inferior izquierda
    `${centerX - halfSize} ${centerY + halfSize - frameOffset} ${
      centerX - halfSize
    } ${centerY + halfSize} ${centerX - halfSize + frameOffset} ${
      centerY + halfSize
    }`,
    // Línea inferior derecha
    `${centerX + halfSize} ${centerY - halfSize + frameOffset} ${
      centerX + halfSize
    } ${centerY - halfSize} ${centerX + halfSize - frameOffset} ${
      centerY - halfSize
    }`,
  ];
}

/**
 * Genera todas las propiedades necesarias para un MagneticNumber
 * @param {Object} options - Opciones de configuración
 * @param {number} options.number - Número a mostrar
 * @param {string} options.section - Nombre de la sección
 * @param {Object} options.position - Posición {x, y} o porcentajes
 * @param {number} options.frameSize - Tamaño del frame (default: 31)
 * @param {number} options.hitAreaSize - Tamaño del área de hit (default: 42)
 * @returns {Object} - Propiedades para MagneticNumber
 */
function createMagneticNumberProps({
  number,
  section,
  position,
  frameSize = 31,
  hitAreaSize = 42,
}) {
  // Si position tiene porcentajes, calcular coordenadas
  let centerX, centerY;

  if (
    position.left !== undefined ||
    position.right !== undefined ||
    position.top !== undefined ||
    position.bottom !== undefined
  ) {
    const coords = calculateSVGEdgePosition(position);
    centerX = coords.x;
    centerY = coords.y;
  } else if (
    position.xPercent !== undefined ||
    position.yPercent !== undefined
  ) {
    const coords = calculateSVGPosition(position.xPercent, position.yPercent);
    centerX = coords.x;
    centerY = coords.y;
  } else {
    centerX = position.x;
    centerY = position.y;
  }

  const framePoints = generateMagneticNumberFrame(centerX, centerY, frameSize);
  const hitAreaOffset = hitAreaSize / 2;

  return {
    number: number.toString(),
    section,
    framePoints,
    textTransform: `translate(${centerX - 7} ${centerY + 8.5})`, // Ajuste para centrar el texto
    hitArea: {
      x: centerX - hitAreaOffset,
      y: centerY - hitAreaOffset,
      width: hitAreaSize,
      height: hitAreaSize,
    },
  };
}

export default function CircleSelector({
  parallaxValues,
  isVisible,
  onNumberClick,
}) {
  const [hoveredSection, setHoveredSection] = useState(null);

  const handleNumberClick = (number) => {
    if (onNumberClick) {
      onNumberClick(number);
    }
  };

  const handleSectionHover = (section) => {
    setHoveredSection(section);
  };

  const handleSectionLeave = () => {
    setHoveredSection(null);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] transition-none will-change-transform w-screen h-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {/* SVG Completo con Números Magnéticos */}
          <InteractiveSVG
            hoveredSection={hoveredSection}
            onSectionHover={handleSectionHover}
            onSectionLeave={handleSectionLeave}
            onNumberClick={handleNumberClick}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Componente para números magnéticos
function MagneticNumber({
  number,
  section,
  x,
  y,
  framePoints,
  textTransform,
  onClick,
  onHover,
  onLeave,
  delay = 0,
  hitArea, // coordenadas del área de hit: {x, y, width, height}
}) {
  const ref = useRef(null);
  const { setHoveredElement } = useMagneticCursor();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { isTouch, isMobile, isTablet, deviceType } = useDevice();

  // Calcular factor de escala basado en el tipo de dispositivo
  const getScaleFactor = () => {
    if (isMobile) return 2.2; // Más grande para móviles
    if (isTablet) return 1.8; // Escala intermedia para tablets
    if (isTouch) return 1.6; // Escala para otros dispositivos táctiles
    return 1; // Escala normal para desktop
  };

  const scaleFactor = getScaleFactor();

  const handleMouseMove = (e) => {
    if (ref.current) {
      const { clientX, clientY } = e;
      const { width, height, left, top } = ref.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      setPosition({ x: deltaX * 0.1, y: deltaY * 0.1 });
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
    <motion.g
      ref={ref}
      className={`number-group number-${number}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1 * scaleFactor, // Escala basada en el dispositivo
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
      whileHover={{ scale: 1.1 * scaleFactor }}
      whileTap={{ scale: 0.95 }}
      style={{ cursor: "pointer", pointerEvents: "all" }}
    >
      {/* Área invisible para hit detection más amplia */}
      <rect
        x={hitArea.x}
        y={hitArea.y}
        width={hitArea.width}
        height={hitArea.height}
        fill="transparent"
        style={{ pointerEvents: "all" }}
      />

      {/* Frame visible */}
      {framePoints.map((points, index) => (
        <polyline
          key={index}
          className="cls-6 number-frame"
          points={points}
          style={{ pointerEvents: "none" }}
        />
      ))}

      {/* Texto */}
      <text
        className="cls-1"
        transform={textTransform}
        style={{ pointerEvents: "none" }}
      >
        <tspan x="0" y="0">
          {number}
        </tspan>
      </text>
    </motion.g>
  );
}

// Componente SVG Interactivo
function InteractiveSVG({
  hoveredSection,
  onSectionHover,
  onSectionLeave,
  onNumberClick,
}) {
  const { isTouch, isMobile, isTablet } = useDevice();

  const numero6Props = useMemo(() => {
    const getPosition = () => {
      if (isMobile) {
        return { right: 30, bottom: 0 }; // Posición móvil
      }
      if (isTablet) {
        return { right: 30, bottom: 110 }; // Posición tablet
      }
      return { right: 10, bottom: 30 }; // Posición desktop
    };

    return createMagneticNumberProps({
      number: 6,
      section: "custom",
      position: getPosition(),
    });
  }, [isMobile, isTablet]);

  return (
    <div className="absolute inset-0">
      <CircleSvg />
      <svg
        id="interactive-cycle"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1301 1081"
        className="h-svh w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <defs>
          <style>
            {`
              .cls-1 {
                font-family: Archivo-Thin, Archivo;
                font-size: 26px;
                font-weight: 200;
                fill: #fff;
              }

              .cls-2 {
                font-family: Archivo-Regular, Archivo;
                font-size: 20px;
                font-weight: 400;
              }

              .cls-7 {
                font-family: Archivo-Regular, Archivo;
                font-size: 36px;
                font-weight: 400;
              }

              .cls-2, .cls-3, .cls-4, .cls-5 {
                fill: #fff;
              }

              .cls-6 {
                fill: none;
                stroke: #fff;
                stroke-miterlimit: 10;
              }

              .cls-3 {
                font-family: Archivo-Regular, Archivo;
                font-size: 12.1px;
              }

              .cls-4 {
                font-size: 47.94px;
                letter-spacing: 5px;
              }

              .cls-4, .cls-5 {
                font-family: Archivo-Bold, Archivo;
                font-weight: 700;
              }

              .cls-5 {
                font-size: 12.89px;
              }

              .cycle-section {
                pointer-events: none;
              }

              /* Animaciones de entrada para secciones */
              .section-cloud {
                animation: slideInFromTop 0.8s ease-out 0.2s both;
              }
              
              .section-rain {
                animation: slideInFromLeft 0.8s ease-out 0.25s both;
              }
              
              .section-evaporation {
                animation: slideInFromRight 0.8s ease-out 0.25s both;
              }
              
              .section-ground {
                animation: slideInFromBottom 0.8s ease-out 0.3s both;
              }
              
              .section-sea {
                animation: slideInFromBottom 0.8s ease-out 0.35s both;
              }

              @keyframes slideInFromTop {
                from {
                  opacity: 0;
                  transform: translateY(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              @keyframes slideInFromLeft {
                from {
                  opacity: 0;
                  transform: translateX(-30px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }

              @keyframes slideInFromRight {
                from {
                  opacity: 0;
                  transform: translateX(30px);
                }
                to {
                  opacity: 1;
                  transform: translateX(0);
                }
              }

              @keyframes slideInFromBottom {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}
          </style>
        </defs>

        {/* Cloud Section */}
        <g className="cycle-section section-cloud" data-section="cloud">
          <text
            className="cls-4"
            transform="translate(555.24 133.76)"
            style={isTouch ? { cursor: "pointer", pointerEvents: "all" } : {}}
            onClick={isTouch ? () => onNumberClick(1) : undefined}
          >
            <tspan x="0" y="0">
              CLOUD
            </tspan>
          </text>

          {!isTouch && (
            <>
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "cloud" ? 1 : 0,
                  scale: hoveredSection === "cloud" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-5" transform="translate(578.21 90.91)">
                  <tspan x="0" y="0">
                    THE DIGITAL IDENTITY
                  </tspan>
                </text>
              </motion.g>

              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "cloud" ? 1 : 0,
                  scale: hoveredSection === "cloud" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-3" transform="translate(567.14 151.19)">
                  <tspan x="0" y="0">
                    Online presence: Website + UX
                  </tspan>
                </text>
              </motion.g>
            </>
          )}
        </g>

        {/* Rain Section */}
        <g className="cycle-section section-rain" data-section="rain">
          <text
            className="cls-4"
            transform="translate(173.34 430.43)"
            style={isTouch ? { cursor: "pointer", pointerEvents: "all" } : {}}
            onClick={isTouch ? () => onNumberClick(2) : undefined}
          >
            <tspan x="0" y="0">
              RAIN
            </tspan>
          </text>

          {!isTouch && (
            <>
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "rain" ? 1 : 0,
                  scale: hoveredSection === "rain" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-5" transform="translate(182.5 380.12)">
                  <tspan x="0" y="0">
                    WHERE DIGITAL &
                  </tspan>
                  <tspan x="5.13" y="11">
                    PHYSICAL MEET
                  </tspan>
                </text>
              </motion.g>

              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "rain" ? 1 : 0,
                  scale: hoveredSection === "rain" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-3" transform="translate(159.46 447.86)">
                  <tspan x="0" y="0">
                    The cohesion across channels
                  </tspan>
                </text>
              </motion.g>
            </>
          )}
        </g>

        {/* Evaporation Section */}
        <g
          className="cycle-section section-evaporation"
          data-section="evaporation"
        >
          <text
            className="cls-4"
            transform="translate(859.06 430.1)"
            style={isTouch ? { cursor: "pointer", pointerEvents: "all" } : {}}
            onClick={isTouch ? () => onNumberClick(5) : undefined}
          >
            <tspan x="0" y="0">
              EVAPORATION
            </tspan>
          </text>

          {!isTouch && (
            <>
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "evaporation" ? 1 : 0,
                  scale: hoveredSection === "evaporation" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-5" transform="translate(982.36 387.25)">
                  <tspan x="0" y="0">
                    MOMENTUM & GROWTH
                  </tspan>
                </text>
              </motion.g>

              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "evaporation" ? 1 : 0,
                  scale: hoveredSection === "evaporation" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-3" transform="translate(989.73 447.52)">
                  <tspan x="0" y="0">
                    Brand evolution & updates
                  </tspan>
                </text>
              </motion.g>
            </>
          )}
        </g>

        {/* Ground Section */}
        <g className="cycle-section section-ground" data-section="ground">
          <text
            className="cls-4"
            transform="translate(264.25 903.9)"
            style={isTouch ? { cursor: "pointer", pointerEvents: "all" } : {}}
            onClick={isTouch ? () => onNumberClick(3) : undefined}
          >
            <tspan x="0" y="0">
              GROUND
            </tspan>
          </text>

          {!isTouch && (
            <>
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "ground" ? 1 : 0,
                  scale: hoveredSection === "ground" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-5" transform="translate(320.88 861.05)">
                  <tspan x="0" y="0">
                    PHYSICAL IDENTITY
                  </tspan>
                </text>
              </motion.g>

              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "ground" ? 1 : 0,
                  scale: hoveredSection === "ground" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-3" transform="translate(335.14 921.33)">
                  <tspan x="0" y="0">
                    Offline touchpoints
                  </tspan>
                </text>
              </motion.g>
            </>
          )}
        </g>

        {/* Sea Section */}
        <g className="cycle-section section-sea" data-section="sea">
          <text
            className="cls-4"
            transform="translate(861.72 904.25)"
            style={isTouch ? { cursor: "pointer", pointerEvents: "all" } : {}}
            onClick={isTouch ? () => onNumberClick(4) : undefined}
          >
            <tspan x="0" y="0">
              SEA
            </tspan>
          </text>

          {!isTouch && (
            <>
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "sea" ? 1 : 0,
                  scale: hoveredSection === "sea" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-5" transform="translate(869.43 853.7)">
                  <tspan x="0" y="0">
                    STRUCTURE &
                  </tspan>
                  <tspan x="2.99" y="11">
                    POSITIONING
                  </tspan>
                </text>
              </motion.g>

              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: hoveredSection === "sea" ? 1 : 0,
                  scale: hoveredSection === "sea" ? 1 : 0.8,
                }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <text className="cls-3" transform="translate(826.68 921.68)">
                  <tspan x="0" y="0">
                    Who you are and where you stand
                  </tspan>
                </text>
              </motion.g>
            </>
          )}
        </g>

        {/* Números Magnéticos */}

        {/* Número 1 - Cloud */}
        <MagneticNumber
          number="1"
          section="cloud"
          framePoints={[
            "597.31 303.68 605.99 303.68 605.99 294.82",
            "583.72 272.72 575.04 272.72 575.04 281.24",
            "575.04 294.82 575.04 303.68 583.72 303.68",
            "605.99 281.24 605.99 272.72 597.31 272.72",
          ]}
          textTransform="translate(584.1 296.94)"
          hitArea={{ x: 570, y: 267, width: 41, height: 42 }}
          onClick={() => onNumberClick(1)}
          onHover={() => onSectionHover("cloud")}
          onLeave={() => onSectionLeave()}
        />

        {/* Número 2 - Rain */}
        <MagneticNumber
          number="2"
          section="rain"
          framePoints={[
            "340.09 540.5 348.78 540.5 348.78 531.64",
            "326.51 509.54 317.82 509.54 317.82 518.06",
            "317.82 531.64 317.82 540.5 326.51 540.5",
            "348.78 518.06 348.78 509.54 340.09 509.54",
          ]}
          textTransform="translate(326.06 533.26)"
          hitArea={{ x: 312, y: 504, width: 42, height: 42 }}
          onClick={() => onNumberClick(2)}
          onHover={() => onSectionHover("rain")}
          onLeave={() => onSectionLeave()}
        />

        {/* Número 3 - Ground */}
        <MagneticNumber
          number="3"
          section="ground"
          framePoints={[
            "525.81 799.62 534.5 799.62 534.5 790.76",
            "512.23 768.67 503.54 768.67 503.54 777.18",
            "503.54 790.76 503.54 799.62 512.23 799.62",
            "534.5 777.18 534.5 768.67 525.81 768.67",
          ]}
          textTransform="translate(511.61 792.52)"
          hitArea={{ x: 498, y: 763, width: 42, height: 42 }}
          onClick={() => onNumberClick(3)}
          onHover={() => onSectionHover("ground")}
          onLeave={() => onSectionLeave()}
        />

        {/* Número 4 - Sea */}
        <MagneticNumber
          number="4"
          section="sea"
          framePoints={[
            "725.61 917.94 734.3 917.94 734.3 909.08",
            "712.03 886.99 703.34 886.99 703.34 895.5",
            "703.34 909.08 703.34 917.94 712.03 917.94",
            "734.3 895.5 734.3 886.99 725.61 886.99",
          ]}
          textTransform="translate(711.93 911.51)"
          hitArea={{ x: 698, y: 881, width: 42, height: 42 }}
          onClick={() => onNumberClick(4)}
          onHover={() => onSectionHover("sea")}
          onLeave={() => onSectionLeave()}
        />

        {/* Número 5 - Evaporation */}
        <MagneticNumber
          number="5"
          section="evaporation"
          framePoints={[
            "1007.63 525.02 1016.32 525.02 1016.32 516.16",
            "994.05 494.07 985.36 494.07 985.36 502.58",
            "985.36 516.16 985.36 525.02 994.05 525.02",
            "1016.32 502.58 1016.32 494.07 1007.63 494.07",
          ]}
          textTransform="translate(993.21 518.59)"
          hitArea={{ x: 980, y: 489, width: 42, height: 42 }}
          onClick={() => onNumberClick(5)}
          onHover={() => onSectionHover("evaporation")}
          onLeave={() => onSectionLeave()}
        />
        <g className="number-6-group">
          {/* Número 6 magnético */}
          <MagneticNumber
            number={numero6Props.number}
            section={numero6Props.section}
            framePoints={numero6Props.framePoints}
            textTransform={numero6Props.textTransform}
            hitArea={numero6Props.hitArea}
            onClick={() => onNumberClick(6)}
            onHover={() => onSectionHover("custom")}
            onLeave={() => onSectionLeave()}
          />

          {/* Texto justo encima de la pegatina */}
          <text
            className={`${isMobile || isTablet ? "cls-7" : "cls-2"}`}
            x={numero6Props.hitArea.x + numero6Props.hitArea.width + 8 + 100} // Centrado en la imagen
            y={numero6Props.hitArea.y + 8 - 40} // Justo encima de la imagen (no del número)
            textAnchor="middle"
            style={{
              pointerEvents: "none",
              fill: "#fff",
            }}
          >
            ISLAND PARTNER
          </text>

          {/* Imagen al lado del número 6 */}
          <image
            href="/Sticker_v01.webp"
            x={numero6Props.hitArea.x + numero6Props.hitArea.width + 8}
            y={numero6Props.hitArea.y + 8}
            width="200"
            height="200"
            style={{
              pointerEvents: "none",
              opacity: 0.9,
            }}
          />
        </g>
      </svg>
    </div>
  );
}
