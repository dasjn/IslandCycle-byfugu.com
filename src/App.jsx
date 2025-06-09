import React, { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import CircleSelector from "./components/CircleSelector";
import ImageTransitions from "./components/ImageTransitions";
import BackButton from "./components/BackButton";
import StateDescriptions from "./components/StateDescriptions";
import { MagneticCursorProvider } from "./providers/MagneticCursorProvider";
import MagneticCursor from "./components/MagneticCursor";
import { DeviceProvider } from "./providers/DeviceProvider";

export default function App() {
  // Estado principal: null = parallax view, number = specific image view
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [parallaxValues, setParallaxValues] = useState(null);

  // Memoizar callbacks para evitar re-renders innecesarios en componentes hijos
  const handleAnimationChange = useCallback((animating) => {
    setIsAnimating(animating);
  }, []);

  const handleNumberClick = useCallback((number) => {
    console.log("Number clicked:", number);
    setSelectedNumber(number);
  }, []);

  const handleBackClick = useCallback(() => {
    console.log("Back clicked, returning to parallax");
    setSelectedNumber(null);
  }, []);

  const handleParallaxUpdate = useCallback((values) => {
    setParallaxValues(values);
  }, []);

  // isToggled = true cuando hay un número seleccionado (muestra imagen específica)
  // isToggled = false cuando selectedNumber es null (muestra parallax + CircleSelector)
  const isToggled = selectedNumber !== null;

  return (
    <DeviceProvider>
      <MagneticCursorProvider>
        <div
          style={{
            width: "100%",
            height: "100vh",
            position: "relative",
            backgroundColor: "#2d3436",
            overflow: "hidden",
          }}
        >
          <MagneticCursor />
          <Canvas
            orthographic
            camera={{ position: [0, 0, 10], zoom: 1 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
              preserveDrawingBuffer: false, // Optimización para mejor rendimiento
              failIfMajorPerformanceCaveat: false, // Compatibilidad mejorada
            }}
            dpr={[1, 2]} // Device pixel ratio adaptativo
            performance={{ min: 0.5 }} // Auto-ajuste de rendimiento
          >
            <ImageTransitions
              isToggled={isToggled}
              selectedNumber={selectedNumber}
              onParallaxUpdate={handleParallaxUpdate}
              onAnimationChange={handleAnimationChange}
            />
          </Canvas>

          {/* CircleSelector visible en la vista parallax (cuando NO hay número seleccionado) */}
          <CircleSelector
            parallaxValues={parallaxValues}
            isVisible={!isToggled && !isAnimating}
            onNumberClick={handleNumberClick}
          />

          {/* StateDescriptions visible en la vista de imagen específica (cuando SÍ hay número seleccionado) */}
          <StateDescriptions
            selectedNumber={selectedNumber}
            isAnimating={isAnimating}
          />

          {/* BackButton visible en la vista de imagen específica (cuando SÍ hay número seleccionado) */}
          <BackButton isVisible={isToggled} onBackClick={handleBackClick} />
        </div>
      </MagneticCursorProvider>
    </DeviceProvider>
  );
}
