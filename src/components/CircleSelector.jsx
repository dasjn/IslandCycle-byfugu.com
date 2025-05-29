import { motion, AnimatePresence } from "framer-motion";

export default function CircleSelector({
  parallaxValues,
  isVisible,
  onNumberClick,
}) {
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
            duration: 0.4,
            ease: [0.25, 0.1, 0.25, 1], // Bezier suave
          }}
        >
          {/* Central circle */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full border border-white/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          />

          {/* CLOUD - Top */}
          <motion.div
            className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center text-white pointer-events-none"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="text-[10px] font-light tracking-[3px] mb-2 opacity-70 uppercase">
              THE DIGITAL IDENTITY
            </div>
            <div className="text-[48px] font-light tracking-[12px] leading-none">
              CLOUD
            </div>
          </motion.div>

          {/* Number 1 - Clickable */}
          <motion.button
            onClick={() => handleNumberClick(1)}
            className="absolute top-[28%] left-1/2 -translate-x-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:border-white hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            1
          </motion.button>

          {/* RAIN - Left */}
          <motion.div
            className="absolute top-[40%] left-[28%] -translate-y-1/2 text-left text-white pointer-events-none"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <div className="text-[9px] font-light tracking-[2px] mb-[2px] opacity-60 uppercase">
              WHERE DIGITAL &
            </div>
            <div className="text-[9px] font-light tracking-[2px] mb-[10px] opacity-60 uppercase">
              PHYSICAL MEET
            </div>
            <div className="text-[40px] font-light tracking-[8px] leading-none mb-[6px]">
              RAIN
            </div>
            <div className="text-[9px] opacity-50 font-light">
              The cohesion across channels
            </div>
          </motion.div>

          {/* Number 2 - Clickable */}
          <motion.button
            onClick={() => handleNumberClick(2)}
            className="absolute top-[48%] left-[30%] -translate-y-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:border-white hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            2
          </motion.button>

          {/* EVAPORATION - Right */}
          <motion.div
            className="absolute top-[40%] right-[28%] -translate-y-1/2 text-right text-white pointer-events-none"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <div className="text-[9px] font-light tracking-[2px] mb-[10px] opacity-60 uppercase">
              MOMENTUM & GROWTH
            </div>
            <div className="text-[28px] font-light tracking-[4px] leading-none mb-[6px]">
              EVAPORATION
            </div>
            <div className="text-[9px] opacity-50 font-light">
              Brand evolution & updates
            </div>
          </motion.div>

          {/* Number 5 - Clickable */}
          <motion.button
            onClick={() => handleNumberClick(5)}
            className="absolute top-[48%] right-[30%] -translate-y-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:border-white hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            5
          </motion.button>

          {/* GROUND - Bottom Left */}
          <motion.div
            className="absolute bottom-[15%] left-[38%] -translate-x-1/2 text-center text-white pointer-events-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="text-[9px] font-light tracking-[2px] mb-[10px] opacity-60 uppercase">
              PHYSICAL IDENTITY
            </div>
            <div className="text-[40px] font-light tracking-[8px] leading-none mb-[6px]">
              GROUND
            </div>
            <div className="text-[9px] opacity-50 font-light">
              Offline touchpoints
            </div>
          </motion.div>

          {/* Number 3 - Clickable */}
          <motion.button
            onClick={() => handleNumberClick(3)}
            className="absolute bottom-[12%] left-[25%] -translate-x-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:border-white hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            3
          </motion.button>

          {/* SEA - Bottom Right */}
          <motion.div
            className="absolute bottom-[15%] right-[38%] translate-x-1/2 text-center text-white pointer-events-none"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <div className="text-[9px] font-light tracking-[2px] mb-[2px] opacity-60 uppercase">
              STRUCTURE &
            </div>
            <div className="text-[9px] font-light tracking-[2px] mb-[10px] opacity-60 uppercase">
              POSITIONING
            </div>
            <div className="text-[40px] font-light tracking-[8px] leading-none mb-[6px]">
              SEA
            </div>
            <div className="text-[9px] opacity-50 font-light">
              Who you are and where you stand
            </div>
          </motion.div>

          {/* Number 4 - Clickable */}
          <motion.button
            onClick={() => handleNumberClick(4)}
            className="absolute bottom-[12%] right-[25%] translate-x-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light cursor-pointer hover:border-white hover:text-white hover:bg-white/10 transition-all duration-300 pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            4
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
