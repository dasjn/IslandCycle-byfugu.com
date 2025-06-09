import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMagneticCursor } from "../hooks/useMagneticCursor";

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
  return (
    <div className="absolute inset-0">
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
          <text className="cls-4" transform="translate(555.24 133.76)">
            <tspan x="0" y="0">
              CLOUD
            </tspan>
          </text>

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
        </g>

        {/* Rain Section */}
        <g className="cycle-section section-rain" data-section="rain">
          <text className="cls-4" transform="translate(173.34 430.43)">
            <tspan x="0" y="0">
              RAIN
            </tspan>
          </text>

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
        </g>

        {/* Evaporation Section */}
        <g
          className="cycle-section section-evaporation"
          data-section="evaporation"
        >
          <text className="cls-4" transform="translate(859.06 430.1)">
            <tspan x="0" y="0">
              EVAPORATION
            </tspan>
          </text>

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
        </g>

        {/* Ground Section */}
        <g className="cycle-section section-ground" data-section="ground">
          <text className="cls-4" transform="translate(264.25 903.9)">
            <tspan x="0" y="0">
              GROUND
            </tspan>
          </text>

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
        </g>

        {/* Sea Section */}
        <g className="cycle-section section-sea" data-section="sea">
          <text className="cls-4" transform="translate(861.72 904.25)">
            <tspan x="0" y="0">
              SEA
            </tspan>
          </text>

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
        </g>

        {/* Líneas de conexión */}
        <g>
          <path
            className="cls-6"
            d="M332.58,823.47c-66.99-75.21-107.69-174.33-107.69-282.97,0-22.11,1.69-43.83,4.94-65.04"
          />
          <polygon
            className="cls-2"
            points="333.55 818.28 332.55 818.23 332.35 823.16 327.45 822.6 327.33 823.6 333.3 824.28 333.55 818.28"
          />
        </g>
        <g>
          <path
            className="cls-6"
            d="M820.46,930.82c-52.06,22.7-109.54,35.29-169.96,35.29s-118.63-12.75-170.95-35.73"
          />
          <polygon
            className="cls-2"
            points="815.83 928.26 815.48 929.2 820.09 930.94 818.02 935.41 818.93 935.83 821.45 930.38 815.83 928.26"
          />
        </g>
        <g>
          <path
            className="cls-6"
            d="M1071.46,477.37c3.06,20.6,4.65,41.68,4.65,63.13,0,107.84-40.11,206.31-106.22,281.32"
          />
          <polygon
            className="cls-2"
            points="1067.82 481.19 1068.63 481.78 1071.49 477.75 1075.29 480.9 1075.93 480.12 1071.3 476.3 1067.82 481.19"
          />
        </g>
        <g>
          <path
            className="cls-6"
            d="M767.15,131.08c115.84,32.94,211.55,113.72,264.4,219.63"
          />
          <polygon
            className="cls-2"
            points="769.16 135.95 770.03 135.44 767.51 131.2 771.93 129.01 771.49 128.11 766.11 130.78 769.16 135.95"
          />
        </g>
        <g>
          <path
            className="cls-6"
            d="M273.42,342.96c53.7-102.29,147.79-180.04,261.08-212.06"
          />
          <polygon
            className="cls-2"
            points="278.62 342.06 278.31 341.11 273.63 342.64 272.44 337.85 271.47 338.09 272.91 343.92 278.62 342.06"
          />
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
      </svg>
    </div>
  );
}
