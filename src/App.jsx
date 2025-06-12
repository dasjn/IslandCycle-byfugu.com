// src/App.jsx
import React, { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import CircleSelector from "./components/CircleSelector";
import ImageTransitions from "./components/ImageTransitions";
import BackButton from "./components/BackButton";
import StateDescriptions from "./components/StateDescriptions";
import LoadingScreen from "./components/LoadingScreen";
import { MagneticCursorProvider } from "./providers/MagneticCursorProvider";
import MagneticCursor from "./components/MagneticCursor";
import { DeviceProvider } from "./providers/DeviceProvider";
import { useDevice } from "./hooks/useDevice";
import { useAssetLoader } from "./hooks/useAssetLoader";
import PerformanceOverlay from "./components/PerformanceOverlay";

// Componente interno que usa el hook useDevice
function AppContent() {
  const { isTouch } = useDevice();

  // Hook de precarga de assets
  const { isLoading, loadingProgress, getPreloadedAsset } = useAssetLoader();

  // Estado principal: null = parallax view, number = specific image view
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [parallaxValues, setParallaxValues] = useState(null);
  const [showApp, setShowApp] = useState(false);

  // Memoizar callbacks para evitar re-renders innecesarios en componentes hijos
  const handleAnimationChange = useCallback((animating) => {
    setIsAnimating(animating);
  }, []);

  const handleNumberClick = useCallback((number) => {
    setSelectedNumber(number);
  }, []);

  const handleBackClick = useCallback(() => {
    setSelectedNumber(null);
  }, []);

  const handleParallaxUpdate = useCallback((values) => {
    setParallaxValues(values);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setShowApp(true);
  }, []);

  // isToggled = true cuando hay un número seleccionado (muestra imagen específica)
  // isToggled = false cuando selectedNumber es null (muestra parallax + CircleSelector)
  const isToggled = selectedNumber !== null;

  return (
    <>
      {/* Pantalla de carga */}
      <LoadingScreen
        isLoading={isLoading}
        loadingProgress={loadingProgress}
        onLoadingComplete={handleLoadingComplete}
      />

      {/* Aplicación principal - solo se muestra cuando termina la carga */}
      {showApp && (
        <div
          style={{
            width: "100%",
            height: "100vh",
            position: "relative",
            backgroundColor: "#2d3436",
            overflow: "hidden",
          }}
        >
          <PerformanceOverlay enabled={import.meta.env.DEV} />
          {/* Solo renderizar MagneticCursor en dispositivos NO táctiles */}
          {!isTouch && <MagneticCursor />}

          <Canvas
            orthographic
            camera={{ position: [0, 0, 10], zoom: 1 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
              stencil: false,
              depth: true,
              preserveDrawingBuffer: false,
              failIfMajorPerformanceCaveat: false,
            }}
            dpr={[1, 2]}
            performance={{ min: 0.5 }}
          >
            <ImageTransitions
              isToggled={isToggled}
              selectedNumber={selectedNumber}
              onParallaxUpdate={handleParallaxUpdate}
              onAnimationChange={handleAnimationChange}
              getPreloadedAsset={getPreloadedAsset}
            />
          </Canvas>

          {/* CircleSelector visible en la vista parallax */}
          <CircleSelector
            parallaxValues={parallaxValues}
            isVisible={!isToggled && !isAnimating}
            onNumberClick={handleNumberClick}
          />

          {/* StateDescriptions visible en la vista de imagen específica */}
          <StateDescriptions
            selectedNumber={selectedNumber}
            isAnimating={isAnimating}
          />

          {/* BackButton visible en la vista de imagen específica */}
          <BackButton isVisible={isToggled} onBackClick={handleBackClick} />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <DeviceProvider>
      <MagneticCursorProvider>
        <AppContent />
      </MagneticCursorProvider>
    </DeviceProvider>
  );
}
