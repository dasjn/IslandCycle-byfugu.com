import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Controls from "./components/Controls";
import CircleSelector from "./components/CircleSelector";
import ImageTransitions from "./components/ImageTransitions";

export default function App() {
  const [isToggled, setIsToggled] = useState(false);
  const [parallaxValues, setParallaxValues] = useState(null);

  const handleToggle = () => {
    console.log("Toggle clicked, current state:", isToggled);
    setIsToggled((prev) => !prev);
  };

  const handleParallaxUpdate = (values) => {
    setParallaxValues(values);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        backgroundColor: "#2d3436",
        overflow: "hidden",
      }}
    >
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
          onParallaxUpdate={handleParallaxUpdate}
        />
      </Canvas>

      <Controls isToggled={isToggled} onToggle={handleToggle} />
      <CircleSelector parallaxValues={parallaxValues} isVisible={!isToggled} />
    </div>
  );
}
