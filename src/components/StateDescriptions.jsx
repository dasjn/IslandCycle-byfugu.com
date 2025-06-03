import { motion, AnimatePresence } from "framer-motion";

// Datos de cada estado/elemento
const STATE_DATA = {
  1: {
    category: "THE DIGITAL IDENTITY",
    title: "CLOUD",
    subtitle: "Online presence: Website + UX",
    description: "Online experiences that actually feels like you.",
    longDescription:
      "We design and build digital experiences that express your brand with great precision. Websites, UI systems, UX flows... everything aligned to your personality and goals.",
    deliverables:
      "→ Deliverable examples: Fully designed + developed website, ready to launch.",
    number: "1",
  },
  2: {
    category: "WHERE DIGITAL & PHYSICAL MEET",
    title: "RAIN",
    subtitle: "The cohesion across channels",
    description: "Consistency builds trust across every touchpoint.",
    longDescription:
      "We connect your online presence with your real-world identity. Whether it's packaging, signage, or social content, we ensure it all speaks the same language.",
    deliverables:
      "→ Deliverable examples: Cross-platform branding guide, aligned examples & mocks.",
    number: "2",
  },
  3: {
    category: "PHYSICAL IDENTITY",
    title: "GROUND",
    subtitle: "Offline touchpoints",
    description: "Make your brand tangible, memorable, and clear.",
    longDescription:
      "From packaging and print to in-store materials and more, we create physical brand assets that reinforce your presence wherever people encounter you.",
    deliverables:
      "→ Deliverable examples: Brand Asset Suite, Print-Ready Files, Style Manual.",
    number: "3",
  },
  4: {
    category: "STRUCTURE &",
    categoryLine2: "POSITIONING",
    title: "SEA",
    subtitle: "Who you are and where you stand",
    description: "Before you say anything, we make you know who you are.",
    longDescription:
      "We help you define your positioning, voice, values, and unique difference — so that everything else flows from a clear, compelling foundation.",
    deliverables:
      "→ Deliverable examples: Strategic Brand Platform + Voice & Messaging Guide.",
    number: "4",
  },
  5: {
    category: "MOMENTUM & GROWTH",
    title: "EVAPORATION",
    subtitle: "Brand evolution & updates",
    description: "Brands that thrive never stand still.",
    longDescription:
      "We work with you to evolve your brand over time: refreshing your presence, optimizing touchpoints, and building long-term relevance.",
    deliverables:
      "→ Deliverable examples: Strategic plans, visual updates, and micro-initiatives.",
    number: "5",
  },
};

export default function StateDescriptions({ selectedNumber, isAnimating }) {
  return (
    <AnimatePresence mode="wait">
      {selectedNumber && !isAnimating && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[6] transition-none will-change-transform w-screen h-screen flex items-center justify-center"
          key={selectedNumber} // Clave única para cada estado
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          <div className="max-w-4xl mx-auto px-8 text-center text-white">
            {/* Elementos geométricos decorativos */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="flex gap-3">
                <div className="w-6 h-4 bg-white transform -rotate-12"></div>
                <div className="w-4 h-4 bg-white"></div>
                <div className="w-6 h-4 bg-white transform rotate-12"></div>
                <div className="w-5 h-4 bg-white transform -rotate-6"></div>
                <div className="w-4 h-4 bg-white transform rotate-6"></div>
              </div>
            </motion.div>

            {/* Categoría */}
            <motion.div
              className="text-sm font-thin tracking-wider mb-2"
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
            <motion.h1
              className="text-5xl md:text-6xl font-bold tracking-wider mb-2"
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
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              className="text-md font-extralight mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {STATE_DATA[selectedNumber].subtitle}
            </motion.p>

            {/* Número */}
            <motion.div
              className="inline-flex items-center justify-center w-12 h-12 border border-white/30 text-lg font-light mb-8"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {STATE_DATA[selectedNumber].number}
            </motion.div>

            {/* Descripción corta */}
            <motion.h2
              className="text-xl md:text-2xl font-normal mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              {STATE_DATA[selectedNumber].description}
            </motion.h2>

            {/* Descripción larga */}
            <motion.p
              className="text-base md:text-lg font-light leading-relaxed mb-8 text-white/90 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {STATE_DATA[selectedNumber].longDescription}
            </motion.p>

            {/* Deliverables */}
            <motion.div
              className="flex items-center justify-center text-sm font-light text-white/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <span className="mr-2">→</span>
              <span>
                <strong>Deliverable examples:</strong>{" "}
                {STATE_DATA[selectedNumber].deliverables}
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
