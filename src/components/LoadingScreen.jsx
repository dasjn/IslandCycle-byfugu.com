// src/components/LoadingScreen.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export default function LoadingScreen({
  isLoading,
  loadingProgress,
  onLoadingComplete,
}) {
  // Llamar onLoadingComplete cuando termine la carga
  useEffect(() => {
    if (!isLoading && onLoadingComplete) {
      onLoadingComplete();
    }
  }, [isLoading, onLoadingComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
          }}
        >
          <div className="relative text-center text-white max-w-md mx-auto px-8">
            {/* Título */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-2xl md:text-3xl font-light tracking-wider mb-2">
                THE ISLAND CYCLE
              </h1>
              <p className="text-xs md:text-sm text-white/70 font-light">or</p>
              <p className="text-sm md:text-base text-white/70 font-light">
                How We Build Coherent Brands
              </p>
            </motion.div>

            {/* Marco decorativo para el progreso */}
            <motion.div
              className="relative mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* Brackets del marco */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Bracket superior izquierdo */}
                <svg
                  className="absolute -top-4 -left-4"
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                >
                  <polyline
                    points="15,1 1,1 1,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>

                {/* Bracket superior derecho */}
                <svg
                  className="absolute -top-4 -right-4"
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  style={{ transform: "rotate(90deg)" }}
                >
                  <polyline
                    points="15,1 1,1 1,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>

                {/* Bracket inferior izquierdo */}
                <svg
                  className="absolute -bottom-4 -left-4"
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  style={{ transform: "rotate(270deg)" }}
                >
                  <polyline
                    points="15,1 1,1 1,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>

                {/* Bracket inferior derecho */}
                <svg
                  className="absolute -bottom-4 -right-4"
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  style={{ transform: "rotate(180deg)" }}
                >
                  <polyline
                    points="15,1 1,1 1,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>
              </div>

              {/* Contenedor de la barra de progreso */}
              <div className="bg-white/10 h-1 w-72 mx-auto rounded-full overflow-hidden relative">
                {/* Barra de progreso animada */}
                <motion.div
                  className="h-full bg-white relative overflow-hidden"
                  initial={{ width: "0%" }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Efecto de brillo en la barra */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Porcentaje de progreso centrado */}
            <motion.div
              className="mb-4 text-sm font-light text-white/60 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {loadingProgress}%
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
