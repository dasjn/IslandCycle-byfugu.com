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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] transition-none will-change-transform w-screen h-screen font-['Helvetica_Neue',Arial,sans-serif]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {/* Central circle */}
          <CircleSvg />

          {/* CLOUD - Top */}
          <motion.div
            className="absolute top-[7%] left-1/2 -translate-x-1/2 text-center text-white pointer-events-none"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <motion.div
              className="text-xs font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "cloud" ? 1 : 0,
                scale: hoveredSection === "cloud" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              THE DIGITAL IDENTITY
            </motion.div>
            <div className="text-5xl font-semibold">CLOUD</div>
            <motion.div
              className="text-xs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "cloud" ? 1 : 0,
                scale: hoveredSection === "cloud" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Online presence: Website + UX
            </motion.div>
          </motion.div>

          {/* Number 1 - Magnético */}
          <MagneticElement
            onClick={() => handleNumberClick(1)}
            className="absolute top-[16%] left-1/2 -translate-x-1/2 w-6 h-6  flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => setHoveredSection("cloud")}
            onLeave={() => setHoveredSection(null)}
          >
            1
          </MagneticElement>

          {/* RAIN - Left */}
          <motion.div
            className="absolute top-[38%] left-[27%] -translate-y-1/2 text-center text-white pointer-events-none"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.8 }}
          >
            <motion.div
              className="text-xs font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "rain" ? 1 : 0,
                scale: hoveredSection === "rain" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              WHERE DIGITAL &
            </motion.div>
            <motion.div
              className="text-xs font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "rain" ? 1 : 0,
                scale: hoveredSection === "rain" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              PHYSICAL MEET
            </motion.div>
            <div className="text-5xl font-semibold">RAIN</div>
            <motion.div
              className="text-xs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "rain" ? 1 : 0,
                scale: hoveredSection === "rain" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              The cohesion across channels
            </motion.div>
          </motion.div>

          {/* Number 2 - Magnético */}
          <MagneticElement
            onClick={() => handleNumberClick(2)}
            className="absolute top-[46%] left-[34%] -translate-y-1/2 w-6 h-6  flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => setHoveredSection("rain")}
            onLeave={() => setHoveredSection(null)}
          >
            2
          </MagneticElement>

          {/* EVAPORATION - Right */}
          <motion.div
            className="absolute top-[38%] right-[23%] -translate-y-1/2 text-center text-white pointer-events-none"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.8 }}
          >
            <motion.div
              className="text-xs font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "evaporation" ? 1 : 0,
                scale: hoveredSection === "evaporation" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              MOMENTUM & GROWTH
            </motion.div>
            <div className="text-5xl font-semibold">EVAPORATION</div>
            <motion.div
              className="text-xs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "evaporation" ? 1 : 0,
                scale: hoveredSection === "evaporation" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Brand evolution & updates
            </motion.div>
          </motion.div>

          {/* Number 5 - Magnético */}
          <MagneticElement
            onClick={() => handleNumberClick(5)}
            className="absolute top-[45%] right-[35%] -translate-y-1/2 w-6 h-6  flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => setHoveredSection("evaporation")}
            onLeave={() => setHoveredSection(null)}
          >
            5
          </MagneticElement>

          {/* GROUND - Bottom Left */}
          <motion.div
            className="absolute bottom-[14%] left-[38%] -translate-x-1/2 text-center text-white pointer-events-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <motion.div
              className="text-xs font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "ground" ? 1 : 0,
                scale: hoveredSection === "ground" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              PHYSICAL IDENTITY
            </motion.div>
            <div className="text-5xl font-semibold">GROUND</div>
            <motion.div
              className="text-xs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "ground" ? 1 : 0,
                scale: hoveredSection === "ground" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Offline touchpoints
            </motion.div>
          </motion.div>

          {/* Number 3 - Magnético */}
          <MagneticElement
            onClick={() => handleNumberClick(3)}
            className="absolute bottom-[24%] left-[45%] -translate-x-1/2 w-6 h-6 flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => setHoveredSection("ground")}
            onLeave={() => setHoveredSection(null)}
          >
            3
          </MagneticElement>

          {/* SEA - Bottom Right */}
          <motion.div
            className="absolute bottom-[15%] right-[38%] translate-x-1/2 text-center text-white pointer-events-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.8 }}
          >
            <motion.div
              className="text-xs font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "sea" ? 1 : 0,
                scale: hoveredSection === "sea" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              STRUCTURE &
            </motion.div>
            <motion.div
              className="text-xs font-semibold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "sea" ? 1 : 0,
                scale: hoveredSection === "sea" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              POSITIONING
            </motion.div>
            <div className="text-5xl font-semibold">SEA</div>
            <motion.div
              className="text-xs"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: hoveredSection === "sea" ? 1 : 0,
                scale: hoveredSection === "sea" ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              Who you are and where you stand
            </motion.div>
          </motion.div>

          {/* Number 4 - Magnético */}
          <MagneticElement
            onClick={() => handleNumberClick(4)}
            className="absolute bottom-[16%] right-[45%] translate-x-1/2 w-6 h-6 flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            onHover={() => setHoveredSection("sea")}
            onLeave={() => setHoveredSection(null)}
          >
            4
          </MagneticElement>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
