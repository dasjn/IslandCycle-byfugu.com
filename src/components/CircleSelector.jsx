import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MagneticElement from "./MagneticElement";
import CircleSvg from "../assets/CircleSvg";

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
          {/* SVG Base */}
          <CircleSvg />

          {/* SVG Interactivo con Texto */}
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

// Componente SVG Interactivo
function InteractiveSVG({
  hoveredSection,
  onSectionHover,
  onSectionLeave,
  onNumberClick,
}) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        id="interactive-cycle"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1301 1081"
        className="h-svh w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <defs>
          <style>
            {`
              .cycle-text-main {
                fill: #fff;
                font-family: Archivo-Bold, Archivo;
                font-weight: 700;
                font-size: 47.94px;
                letter-spacing: 5px;
              }

              .cycle-text-subtitle {
                fill: #fff;
                font-family: Archivo-Bold, Archivo;
                font-weight: 700;
                font-size: 12.89px;
              }

              .cycle-text-description {
                fill: #fff;
                font-family: Archivo-Regular, Archivo;
                font-size: 12.1px;
              }

              .cycle-section {
                pointer-events: none;
              }

              /* Animaciones de entrada */
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
            className="cycle-text-main"
            transform="translate(555.23 133.76)"
          >
            <tspan x="0" y="0">
              CLOUD
            </tspan>
          </text>

          {/* Subtitle animado */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: hoveredSection === "cloud" ? 1 : 0,
              scale: hoveredSection === "cloud" ? 1 : 0.8,
            }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <text
              className="cycle-text-subtitle"
              transform="translate(578.21 90.91)"
            >
              <tspan x="0" y="0">
                THE DIGITAL IDENTITY
              </tspan>
            </text>
          </motion.g>

          {/* Description animada */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: hoveredSection === "cloud" ? 1 : 0,
              scale: hoveredSection === "cloud" ? 1 : 0.8,
            }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <text
              className="cycle-text-description"
              transform="translate(567.14 151.19)"
            >
              <tspan x="0" y="0">
                Online presence: Website + UX
              </tspan>
            </text>
          </motion.g>
        </g>

        {/* Rain Section */}
        <g className="cycle-section section-rain" data-section="rain">
          <text
            className="cycle-text-main"
            transform="translate(173.34 430.44)"
          >
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
            <text
              className="cycle-text-subtitle"
              transform="translate(182.5 380.12)"
            >
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
            <text
              className="cycle-text-description"
              transform="translate(159.46 447.86)"
            >
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
          <text className="cycle-text-main" transform="translate(859.06 430.1)">
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
            <text
              className="cycle-text-subtitle"
              transform="translate(982.36 387.25)"
            >
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
            <text
              className="cycle-text-description"
              transform="translate(989.73 447.52)"
            >
              <tspan x="0" y="0">
                Brand evolution & updates
              </tspan>
            </text>
          </motion.g>
        </g>

        {/* Ground Section */}
        <g className="cycle-section section-ground" data-section="ground">
          <text className="cycle-text-main" transform="translate(264.25 903.9)">
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
            <text
              className="cycle-text-subtitle"
              transform="translate(320.88 861.05)"
            >
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
            <text
              className="cycle-text-description"
              transform="translate(335.13 921.33)"
            >
              <tspan x="0" y="0">
                Offline touchpoints
              </tspan>
            </text>
          </motion.g>
        </g>

        {/* Sea Section */}
        <g className="cycle-section section-sea" data-section="sea">
          <text
            className="cycle-text-main"
            transform="translate(861.71 904.25)"
          >
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
            <text
              className="cycle-text-subtitle"
              transform="translate(869.43 853.7)"
            >
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
            <text
              className="cycle-text-description"
              transform="translate(826.68 921.68)"
            >
              <tspan x="0" y="0">
                Who you are and where you stand
              </tspan>
            </text>
          </motion.g>
        </g>

        {/* Elementos Magnéticos integrados en SVG */}
        {/* Number 1 - Cloud */}
        <foreignObject x="580" y="200" width="48" height="48">
          <MagneticElement
            onClick={() => onNumberClick(1)}
            className="w-12 h-12 border-dashed border-1 border-[#fff4] flex items-center justify-center text-2xl text-white/80 font-normal cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => onSectionHover("cloud")}
            onLeave={() => onSectionLeave()}
          >
            1
          </MagneticElement>
        </foreignObject>

        {/* Number 2 - Rain */}
        <foreignObject x="300" y="500" width="48" height="48">
          <MagneticElement
            onClick={() => onNumberClick(2)}
            className="w-12 h-12 border-dashed border-1 border-[#fff4] flex items-center justify-center text-2xl text-white/80 font-normal cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => onSectionHover("rain")}
            onLeave={() => onSectionLeave()}
          >
            2
          </MagneticElement>
        </foreignObject>

        {/* Number 3 - Ground */}
        <foreignObject x="490" y="735" width="48" height="48">
          <MagneticElement
            onClick={() => onNumberClick(3)}
            className="w-12 h-12 border-dashed border-1 border-[#fff4] flex items-center justify-center text-2xl text-white/80 font-normal cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => onSectionHover("ground")}
            onLeave={() => onSectionLeave()}
          >
            3
          </MagneticElement>
        </foreignObject>

        {/* Number 4 - Sea */}
        <foreignObject x="690" y="880" width="48" height="48">
          <MagneticElement
            onClick={() => onNumberClick(4)}
            className="w-12 h-12 border-dashed border-1 border-[#fff4] flex items-center justify-center text-2xl text-white/80 font-normal cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => onSectionHover("sea")}
            onLeave={() => onSectionLeave()}
          >
            4
          </MagneticElement>
        </foreignObject>

        {/* Number 5 - Evaporation */}
        <foreignObject x="960" y="480" width="48" height="48">
          <MagneticElement
            onClick={() => onNumberClick(5)}
            className="w-12 h-12 border-dashed border-1 border-[#fff4] flex items-center justify-center text-2xl text-white/80 font-normal cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => onSectionHover("evaporation")}
            onLeave={() => onSectionLeave()}
          >
            5
          </MagneticElement>
        </foreignObject>
      </svg>
    </div>
  );
}
