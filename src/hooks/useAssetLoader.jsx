// src/hooks/useAssetLoader.jsx
import { useState, useEffect, useCallback } from "react";

// Lista de todos los assets que necesitamos precargar
const ASSETS_TO_PRELOAD = {
  videos: [
    "Clouds_v02.mp4",
    "Rain_v01.mp4",
    "Ground_v01.mp4",
    "Sea_v01.mp4",
    "Evaporation_v01.mp4",
    "Smoke_v02.mp4",
  ],
  images: [
    "TheIslandCycle_All_v05.webp",
    "BG_v03.png",
    "Clouds_v01.webp",
    "Island_v04.webp",
    "Rain_v01.webp",
  ],
};

// CONFIGURACIÓN: Tiempo mínimo que se mostrará la pantalla de carga (en milisegundos)
const MINIMUM_LOADING_TIME = 3000;

export const useAssetLoader = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedAssets, setLoadedAssets] = useState({
    videos: new Map(),
    images: new Map(),
  });

  // Función para cargar una imagen
  const loadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ src, element: img });
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }, []);

  // Función para cargar un video
  const loadVideo = useCallback((src) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");

      const onLoadedData = () => {
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("error", onError);
        resolve({ src, element: video });
      };

      const onError = () => {
        video.removeEventListener("loadeddata", onLoadedData);
        video.removeEventListener("error", onError);
        reject(new Error(`Failed to load video: ${src}`));
      };

      video.addEventListener("loadeddata", onLoadedData);
      video.addEventListener("error", onError);

      // Configurar el video para precarga
      video.crossOrigin = "anonymous";
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      video.src = src;
      video.load();
    });
  }, []);

  // Función principal de precarga
  const preloadAssets = useCallback(async () => {
    // MARCAR EL TIEMPO DE INICIO
    const startTime = Date.now();

    try {
      const totalAssets =
        ASSETS_TO_PRELOAD.videos.length + ASSETS_TO_PRELOAD.images.length;
      let loadedCount = 0;

      const updateProgress = () => {
        loadedCount++;
        const progress = Math.round((loadedCount / totalAssets) * 100);
        setLoadingProgress(progress);
      };

      // Crear arrays de promesas para cada tipo de asset
      const videoPromises = ASSETS_TO_PRELOAD.videos.map(async (videoSrc) => {
        try {
          const result = await loadVideo(videoSrc);
          setLoadedAssets((prev) => ({
            ...prev,
            videos: new Map(prev.videos.set(videoSrc, result.element)),
          }));
          updateProgress();
          return result;
        } catch (error) {
          console.warn(`Video ${videoSrc} failed to load:`, error);
          updateProgress(); // Aún contamos como "procesado"
          return null;
        }
      });

      const imagePromises = ASSETS_TO_PRELOAD.images.map(async (imageSrc) => {
        try {
          const result = await loadImage(imageSrc);
          setLoadedAssets((prev) => ({
            ...prev,
            images: new Map(prev.images.set(imageSrc, result.element)),
          }));
          updateProgress();
          return result;
        } catch (error) {
          console.warn(`Image ${imageSrc} failed to load:`, error);
          updateProgress(); // Aún contamos como "procesado"
          return null;
        }
      });

      // Esperar a que todos los assets se carguen (o fallen)
      await Promise.allSettled([...videoPromises, ...imagePromises]);

      // CALCULAR TIEMPO TRANSCURRIDO Y ESPERAR SI ES NECESARIO
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);

      if (remainingTime > 0) {
        // Si no ha pasado el tiempo mínimo, esperar el tiempo restante
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      } else {
        // Si ya pasó el tiempo mínimo, pequeña pausa para que se vea el 100%
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error during asset preloading:", error);

      // Incluso si hay error, respetar el tiempo mínimo
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setIsLoading(false);
    }
  }, [loadImage, loadVideo]);

  // Iniciar la precarga cuando el hook se monta
  useEffect(() => {
    preloadAssets();
  }, [preloadAssets]);

  // Función para obtener un asset precargado
  const getPreloadedAsset = useCallback(
    (type, src) => {
      return loadedAssets[type].get(src) || null;
    },
    [loadedAssets]
  );

  return {
    isLoading,
    loadingProgress,
    loadedAssets,
    getPreloadedAsset,
  };
};
