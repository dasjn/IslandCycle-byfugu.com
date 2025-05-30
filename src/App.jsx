import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import CircleSelector from "./components/CircleSelector";
import ImageTransitions from "./components/ImageTransitions";
import BackButton from "./components/BackButton";
import { MagneticCursorProvider } from "./providers/MagneticCursorProvider";
import MagneticCursor from "./components/MagneticCursor";

export default function App() {
  // Estado principal: null = parallax view, number = specific image view
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [parallaxValues, setParallaxValues] = useState(null);

  const handleAnimationChange = (animating) => {
    setIsAnimating(animating);
  };

  const handleNumberClick = (number) => {
    console.log("Number clicked:", number);
    setSelectedNumber(number);
  };

  const handleBackClick = () => {
    console.log("Back clicked, returning to parallax");
    setSelectedNumber(null);
  };

  const handleParallaxUpdate = (values) => {
    setParallaxValues(values);
  };

  // isToggled = true cuando hay un número seleccionado (muestra imagen específica)
  // isToggled = false cuando selectedNumber es null (muestra parallax + CircleSelector)
  const isToggled = selectedNumber !== null;

  return (
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
          }}
          dpr={[1, 2]} // Device pixel ratio adaptativo
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

        {/* BackButton visible en la vista de imagen específica (cuando SÍ hay número seleccionado) */}
        <BackButton isVisible={isToggled} onBackClick={handleBackClick} />
      </div>
    </MagneticCursorProvider>
  );
}
