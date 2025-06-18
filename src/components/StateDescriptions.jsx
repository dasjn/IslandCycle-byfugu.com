import { motion, AnimatePresence } from "framer-motion";
import CubesSvg from "../assets/CubesSvg";
import NumberFrame from "./NumberFrame";

// Datos de cada estado/elemento
const STATE_DATA = {
  1: {
    category: "THE DIGITAL IDENTITY",
    title: "CLOUD",
    subtitle: "Online presence: Website + UX",
    description: "Online experiences that actually feels like you.",
    longDescription:
      "We design and build digital experiences that express your brand with great precision. Websites, UI systems, UX flows... everything aligned to your personality and goals.",
    deliverables: "Fully designed + developed website, ready to launch.",
    number: "1",
  },
  2: {
    category: "WHERE DIGITAL & PHYSICAL MEET",
    title: "RAIN",
    subtitle: "The cohesion across channels",
    description: "Consistency builds trust across every touchpoint.",
    longDescription:
      "We connect your online presence with your real-world identity. Whether it's packaging, signage, or social content, we ensure it all speaks the same language.",
    deliverables: "Cross-platform branding guide, aligned examples & mocks.",
    number: "2",
  },
  3: {
    category: "PHYSICAL IDENTITY",
    title: "GROUND",
    subtitle: "Offline touchpoints",
    description: "Make your brand tangible, memorable, and clear.",
    longDescription:
      "From packaging and print to in-store materials and more, we create physical brand assets that reinforce your presence wherever people encounter you.",
    deliverables: "Brand Asset Suite, Print-Ready Files, Style Manual.",
    number: "3",
  },
  4: {
    category: "STRUCTURE & POSITIONING",
    title: "SEA",
    subtitle: "Who you are and where you stand",
    description: "Before you say anything, we make you know who you are.",
    longDescription:
      "We help you define your positioning, voice, values, and unique difference — so that everything else flows from a clear, compelling foundation.",
    deliverables: "Strategic Brand Platform + Voice & Messaging Guide.",
    number: "4",
  },
  5: {
    category: "MOMENTUM & GROWTH",
    title: "EVAPORATION",
    subtitle: "Brand evolution & updates",
    description: "Brands that thrive never stand still.",
    longDescription:
      "We work with you to evolve your brand over time: refreshing your presence, optimizing touchpoints, and building long-term relevance.",
    deliverables: "Strategic plans, visual updates, and micro-initiatives.",
    number: "5",
  },
  6: {
    category: "FUGU ISLAND PARTNER",
    title: "EVOLUTION",
    subtitle: "Long-term brand alignment program.",
    description: "Clarity is built over time, and we help you protect it.",
    longDescription:
      "We stay by your side after launch, ensuring your brand evolves without losing focus. From updates to big decisions, we keep your identity consistent.",
    deliverables:
      "Audits, reviews, refinements, priority access. Always consistent. Always evolving.",
    number: "6",
  },
};

export default function StateDescriptions({ selectedNumber, isAnimating }) {
  return (
    <AnimatePresence mode="wait">
      {selectedNumber && !isAnimating && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[6] transition-none will-change-transform w-screen h-screen flex items-center justify-center"
          key={selectedNumber}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <div className="max-w-screen sm:max-w-4xl mx-auto px-8 text-center text-white -mt-14 sm:mt-0 flex flex-col items-center gap-12 sm:gap-16">
            {/* Elementos geométricos decorativos */}
            <div className="flex justify-center scale-60 -mb-14 sm:mb-0 sm:scale-100">
              {selectedNumber < 6 ? (
                <CubesSvg selectedNumber={selectedNumber} />
              ) : (
                <motion.img
                  initial={{
                    opacity: 0,
                    scale: 1.3,
                    rotateZ: -90,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotateZ: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.7,
                    rotateZ: 90,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.15, // Delay escalonado para que aparezcan uno tras otro
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="w-50"
                  src="/Sticker_v01.webp"
                />
              )}
            </div>

            <div>
              {/* Categoría */}
              <motion.div
                className="text-sm md:text-xl font-normal tracking-wider"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                {STATE_DATA[selectedNumber].category}
                {STATE_DATA[selectedNumber].categoryLine2 && (
                  <>
                    <br />
                    {STATE_DATA[selectedNumber].categoryLine2}
                  </>
                )}
              </motion.div>

              {/* Título principal */}
              <motion.h2
                className="break-words font-bold"
                style={{
                  fontSize: "clamp(2rem, 8vw, 4rem)",
                  letterSpacing: "clamp(0.3rem, 1.5vw, 1.125rem)",
                  marginRight: "clamp(-0.3rem, -1.5vw, -1.125rem)",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  delay: 0.4,
                  duration: 0.8,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                {STATE_DATA[selectedNumber].title}
              </motion.h2>

              {/* Subtítulo */}
              <motion.p
                className="text-sm md:text-xl font-normal tracking-wider"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                {STATE_DATA[selectedNumber].subtitle}
              </motion.p>
            </div>

            <div className="relative max-w-screen text-left flex flex-col gap-4 p-4">
              {/* Marco decorativo del cuadro de texto */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Bracket superior izquierdo */}
                <svg
                  className="absolute top-0 left-0"
                  width="24"
                  height="24"
                  viewBox="0 0 16 16"
                >
                  <polyline
                    points="15,1 1,1 1,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.8"
                  />
                </svg>

                {/* Bracket superior derecho */}
                <svg
                  className="absolute top-0 right-0"
                  width="24"
                  height="24"
                  viewBox="0 0 16 16"
                  style={{ transform: "rotate(90deg)" }}
                >
                  <polyline
                    points="15,1 1,1 1,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.8"
                  />
                </svg>

                {/* Bracket inferior izquierdo */}
                <svg
                  className="absolute bottom-0 left-0"
                  width="24"
                  height="24"
                  viewBox="0 0 16 16"
                  style={{ transform: "rotate(270deg)" }}
                >
                  <polyline
                    points="15,1 1,1 1,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.8"
                  />
                </svg>

                {/* Bracket inferior derecho */}
                <svg
                  className="absolute bottom-0 right-0"
                  width="24"
                  height="24"
                  viewBox="0 0 16 16"
                  style={{ transform: "rotate(180deg)" }}
                >
                  <polyline
                    points="15,1 1,1 1,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.8"
                  />
                </svg>
              </div>

              {/* Número con marco posicionado relativamente al cuadro de texto */}
              <motion.div
                className="absolute -top-10 left-0 lg:-top-16 lg:-left-16 z-10"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <NumberFrame>{STATE_DATA[selectedNumber].number}</NumberFrame>
              </motion.div>

              {/* Descripción corta */}
              <motion.h2
                className="text-sm md:text-xl font-bold leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                {STATE_DATA[selectedNumber].description}
              </motion.h2>

              {/* Descripción larga */}
              <motion.p
                className="text-sm md:text-xl font-normal max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                {STATE_DATA[selectedNumber].longDescription}
              </motion.p>

              {/* Deliverables */}
              <motion.div
                className="text-sm md:text-xl font-normal flex items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <span>
                  <span className="mr-2">→</span>
                  Deliverable examples:{" "}
                  {STATE_DATA[selectedNumber].deliverables}
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
