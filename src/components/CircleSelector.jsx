import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMagneticCursor } from "../hooks/useMagneticCursor";
import { useDevice } from "../hooks/useDevice";
import CircleSvg from "../assets/CircleSvg";

const SVG_DIMENSIONS = {
  width: 1301,
  height: 1081,
};

// Datos de las secciones del ciclo
const CYCLE_SECTIONS = {
  cloud: {
    title: "CLOUD",
    subtitle: "THE DIGITAL IDENTITY",
    description: "Online presence: Website + UX",
    transform: "translate(555.24 133.76)",
    subtitleTransform: "translate(578.21 90.91)",
    descTransform: "translate(567.14 151.19)",
    animation: "section-cloud",
    number: 1,
  },
  rain: {
    title: "RAIN",
    subtitle: "WHERE DIGITAL &",
    subtitleLine2: "PHYSICAL MEET",
    description: "The cohesion across channels",
    transform: "translate(173.34 430.43)",
    subtitleTransform: "translate(182.5 380.12)",
    descTransform: "translate(159.46 447.86)",
    animation: "section-rain",
    number: 2,
  },
  evaporation: {
    title: "EVAPORATION",
    subtitle: "MOMENTUM & GROWTH",
    description: "Brand evolution & updates",
    transform: "translate(859.06 430.1)",
    subtitleTransform: "translate(982.36 387.25)",
    descTransform: "translate(989.73 447.52)",
    animation: "section-evaporation",
    number: 5,
  },
  ground: {
    title: "GROUND",
    subtitle: "PHYSICAL IDENTITY",
    description: "Offline touchpoints",
    transform: "translate(264.25 903.9)",
    subtitleTransform: "translate(320.88 861.05)",
    descTransform: "translate(335.14 921.33)",
    animation: "section-ground",
    number: 3,
  },
  sea: {
    title: "SEA",
    subtitle: "STRUCTURE &",
    subtitleLine2: "POSITIONING",
    description: "Who you are and where you stand",
    transform: "translate(861.72 904.25)",
    subtitleTransform: "translate(869.43 853.7)",
    descTransform: "translate(826.68 921.68)",
    animation: "section-sea",
    number: 4,
  },
};

// Datos de los números magnéticos hardcodeados (1-5)
const MAGNETIC_NUMBERS = [
  {
    number: "1",
    section: "cloud",
    framePoints: [
      "597.31 303.68 605.99 303.68 605.99 294.82",
      "583.72 272.72 575.04 272.72 575.04 281.24",
      "575.04 294.82 575.04 303.68 583.72 303.68",
      "605.99 281.24 605.99 272.72 597.31 272.72",
    ],
    textTransform: "translate(584.1 296.94)",
    hitArea: { x: 570, y: 267, width: 41, height: 42 },
  },
  {
    number: "2",
    section: "rain",
    framePoints: [
      "340.09 540.5 348.78 540.5 348.78 531.64",
      "326.51 509.54 317.82 509.54 317.82 518.06",
      "317.82 531.64 317.82 540.5 326.51 540.5",
      "348.78 518.06 348.78 509.54 340.09 509.54",
    ],
    textTransform: "translate(326.06 533.26)",
    hitArea: { x: 312, y: 504, width: 42, height: 42 },
  },
  {
    number: "3",
    section: "ground",
    framePoints: [
      "525.81 799.62 534.5 799.62 534.5 790.76",
      "512.23 768.67 503.54 768.67 503.54 777.18",
      "503.54 790.76 503.54 799.62 512.23 799.62",
      "534.5 777.18 534.5 768.67 525.81 768.67",
    ],
    textTransform: "translate(511.61 792.52)",
    hitArea: { x: 498, y: 763, width: 42, height: 42 },
  },
  {
    number: "4",
    section: "sea",
    framePoints: [
      "725.61 917.94 734.3 917.94 734.3 909.08",
      "712.03 886.99 703.34 886.99 703.34 895.5",
      "703.34 909.08 703.34 917.94 712.03 917.94",
      "734.3 895.5 734.3 886.99 725.61 886.99",
    ],
    textTransform: "translate(711.93 911.51)",
    hitArea: { x: 698, y: 881, width: 42, height: 42 },
  },
  {
    number: "5",
    section: "evaporation",
    framePoints: [
      "1007.63 525.02 1016.32 525.02 1016.32 516.16",
      "994.05 494.07 985.36 494.07 985.36 502.58",
      "985.36 516.16 985.36 525.02 994.05 525.02",
      "1016.32 502.58 1016.32 494.07 1007.63 494.07",
    ],
    textTransform: "translate(993.21 518.59)",
    hitArea: { x: 980, y: 489, width: 42, height: 42 },
  },
];

function calculateSVGPosition(xPercent, yPercent) {
  return {
    x: (SVG_DIMENSIONS.width * xPercent) / 100,
    y: (SVG_DIMENSIONS.height * yPercent) / 100,
  };
}

function calculateSVGEdgePosition({ left, right, top, bottom }) {
  let x, y;
  if (left !== undefined) x = (SVG_DIMENSIONS.width * left) / 100;
  else if (right !== undefined)
    x = SVG_DIMENSIONS.width - (SVG_DIMENSIONS.width * right) / 100;
  if (top !== undefined) y = (SVG_DIMENSIONS.height * top) / 100;
  else if (bottom !== undefined)
    y = SVG_DIMENSIONS.height - (SVG_DIMENSIONS.height * bottom) / 100;
  return { x, y };
}

function generateMagneticNumberFrame(centerX, centerY, size = 31) {
  const halfSize = size / 2;
  const frameOffset = 8.68;
  return [
    `${centerX + halfSize - frameOffset} ${centerY + halfSize} ${
      centerX + halfSize
    } ${centerY + halfSize} ${centerX + halfSize} ${
      centerY + halfSize - frameOffset
    }`,
    `${centerX - halfSize + frameOffset} ${centerY - halfSize} ${
      centerX - halfSize
    } ${centerY - halfSize} ${centerX - halfSize} ${
      centerY - halfSize + frameOffset
    }`,
    `${centerX - halfSize} ${centerY + halfSize - frameOffset} ${
      centerX - halfSize
    } ${centerY + halfSize} ${centerX - halfSize + frameOffset} ${
      centerY + halfSize
    }`,
    `${centerX + halfSize} ${centerY - halfSize + frameOffset} ${
      centerX + halfSize
    } ${centerY - halfSize} ${centerX + halfSize - frameOffset} ${
      centerY - halfSize
    }`,
  ];
}

function createMagneticNumberProps({
  number,
  section,
  position,
  frameSize = 31,
  hitAreaSize = 42,
}) {
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
    textTransform: `translate(${centerX - 7} ${centerY + 8.5})`,
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] transition-none will-change-transform w-screen h-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <InteractiveSVG
            hoveredSection={hoveredSection}
            onSectionHover={setHoveredSection}
            onSectionLeave={() => setHoveredSection(null)}
            onNumberClick={onNumberClick}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MagneticNumber({
  number,
  section,
  framePoints,
  textTransform,
  onClick,
  onHover,
  onLeave,
  delay = 0,
  hitArea,
}) {
  const ref = useRef(null);
  const { setHoveredElement } = useMagneticCursor();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const { isTouch, isMobile, isTablet } = useDevice();

  const scaleFactor = isMobile ? 2.2 : isTablet ? 1.8 : isTouch ? 1.6 : 1;

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
        scale: 1 * scaleFactor,
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
      <rect
        x={hitArea.x}
        y={hitArea.y}
        width={hitArea.width}
        height={hitArea.height}
        fill="transparent"
        style={{ pointerEvents: "all" }}
      />
      {framePoints.map((points, index) => (
        <polyline
          key={index}
          className="cls-6 number-frame"
          points={points}
          style={{ pointerEvents: "none" }}
        />
      ))}
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

// Componente para secciones del ciclo
function CycleSection({
  sectionKey,
  data,
  hoveredSection,
  onSectionHover,
  onSectionLeave,
  onNumberClick,
  isTouch,
}) {
  return (
    <g className={`cycle-section ${data.animation}`} data-section={sectionKey}>
      <text
        className="cls-4"
        transform={data.transform}
        style={isTouch ? { cursor: "pointer", pointerEvents: "all" } : {}}
        onClick={isTouch ? () => onNumberClick(data.number) : undefined}
      >
        <tspan x="0" y="0">
          {data.title}
        </tspan>
      </text>

      {!isTouch && (
        <>
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: hoveredSection === sectionKey ? 1 : 0,
              scale: hoveredSection === sectionKey ? 1 : 0.8,
            }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <text className="cls-5" transform={data.subtitleTransform}>
              <tspan x="0" y="0">
                {data.subtitle}
              </tspan>
              {data.subtitleLine2 && (
                <tspan x={sectionKey === "rain" ? "5.13" : "2.99"} y="11">
                  {data.subtitleLine2}
                </tspan>
              )}
            </text>
          </motion.g>

          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: hoveredSection === sectionKey ? 1 : 0,
              scale: hoveredSection === sectionKey ? 1 : 0.8,
            }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <text className="cls-3" transform={data.descTransform}>
              <tspan x="0" y="0">
                {data.description}
              </tspan>
            </text>
          </motion.g>
        </>
      )}
    </g>
  );
}

function InteractiveSVG({
  hoveredSection,
  onSectionHover,
  onSectionLeave,
  onNumberClick,
}) {
  const { isTouch, isMobile, isTablet, isLandscape } = useDevice();

  const numero6Props = useMemo(() => {
    const getPosition = () => {
      if (isLandscape) {
        // Pantalla más ancha que alta (landscape)
        return { right: 10, bottom: 30 };
      } else {
        // Pantalla más alta que ancha (portrait)
        return { right: 30, bottom: 0 };
      }
    };

    return createMagneticNumberProps({
      number: 6,
      section: "evolution",
      position: getPosition(),
    });
  }, [isLandscape]);

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
              .cls-1 { font-family: Archivo-Thin, Archivo; font-size: 26px; font-weight: 200; fill: #fff; }
              .cls-2 { font-family: Archivo-Regular, Archivo; font-size: 20px; font-weight: 400; }
              .cls-7 { font-family: Archivo-Regular, Archivo; font-size: 36px; font-weight: 400; }
              .cls-2, .cls-3, .cls-4, .cls-5 { fill: #fff; }
              .cls-6 { fill: none; stroke: #fff; stroke-miterlimit: 10; }
              .cls-3 { font-family: Archivo-Regular, Archivo; font-size: 12.1px; }
              .cls-4 { font-size: 47.94px; letter-spacing: 5px; }
              .cls-4, .cls-5 { font-family: Archivo-Bold, Archivo; font-weight: 700; }
              .cls-5 { font-size: 12.89px; }
              .cycle-section { pointer-events: none; }
              .section-cloud { animation: slideInFromTop 0.8s ease-out 0.2s both; }
              .section-rain { animation: slideInFromLeft 0.8s ease-out 0.25s both; }
              .section-evaporation { animation: slideInFromRight 0.8s ease-out 0.25s both; }
              .section-ground { animation: slideInFromBottom 0.8s ease-out 0.3s both; }
              .section-sea { animation: slideInFromBottom 0.8s ease-out 0.35s both; }
              @keyframes slideInFromTop { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes slideInFromLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
              @keyframes slideInFromRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
              @keyframes slideInFromBottom { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}
          </style>
        </defs>

        {/* Secciones del ciclo */}
        {Object.entries(CYCLE_SECTIONS).map(([key, data]) => (
          <CycleSection
            key={key}
            sectionKey={key}
            data={data}
            hoveredSection={hoveredSection}
            onSectionHover={onSectionHover}
            onSectionLeave={onSectionLeave}
            onNumberClick={onNumberClick}
            isTouch={isTouch}
          />
        ))}

        {/* Números magnéticos 1-5 */}
        {MAGNETIC_NUMBERS.map((magneticNumber) => (
          <MagneticNumber
            key={magneticNumber.number}
            {...magneticNumber}
            onClick={() => onNumberClick(parseInt(magneticNumber.number))}
            onHover={() => onSectionHover(magneticNumber.section)}
            onLeave={() => onSectionLeave()}
          />
        ))}

        {/* Número 6 con imagen */}
        <g className="number-6-group">
          <MagneticNumber
            number={numero6Props.number}
            section={numero6Props.section}
            framePoints={numero6Props.framePoints}
            textTransform={numero6Props.textTransform}
            hitArea={numero6Props.hitArea}
            onClick={() => onNumberClick(6)}
            onHover={() => onSectionHover("evolution")}
            onLeave={() => onSectionLeave()}
          />

          <text
            className={`${isMobile || isTablet ? "cls-7" : "cls-2"}`}
            x={numero6Props.hitArea.x + numero6Props.hitArea.width + 8 + 100}
            y={numero6Props.hitArea.y + 8 - 40}
            textAnchor="middle"
            style={{ pointerEvents: "none", fill: "#fff" }}
          >
            ISLAND PARTNER
          </text>

          <image
            href="/Sticker_v01.webp"
            x={numero6Props.hitArea.x + numero6Props.hitArea.width + 8}
            y={numero6Props.hitArea.y + 8}
            width="200"
            height="200"
            style={{ pointerEvents: "none", opacity: 0.9 }}
          />
        </g>
      </svg>
    </div>
  );
}
