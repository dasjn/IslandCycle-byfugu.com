import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

// Mapeo de números a videos/imágenes para la escena 1
export const MEDIA_MAP = {
  1: { type: "video", src: "Clouds_v02.mp4" },
  2: { type: "video", src: "Rain_v01.mp4" },
  3: { type: "video", src: "Ground_v01.mp4" },
  4: { type: "video", src: "Sea_v01.mp4" },
  5: { type: "video", src: "Evaporation_v01.mp4" },
};

export const DEFAULT_IMAGE = "BG_v03.png";

// Cache global para texturas optimizado
export const textureCache = new Map();
export const videoCache = new Map();

// Pool de geometrías reutilizables
export const geometryPool = new Map();

// Configuración común de texturas optimizada
export const configureTexture = (texture, gl) => {
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

// Función optimizada para obtener geometría del pool
export const getGeometry = (width, height) => {
  const key = `${width.toFixed(2)}_${height.toFixed(2)}`;
  if (!geometryPool.has(key)) {
    geometryPool.set(key, new THREE.PlaneGeometry(width, height));
  }
  return geometryPool.get(key);
};

// Función para calcular dimensiones tipo "cover"
export const calculateCoverDimensions = (
  contentWidth,
  contentHeight,
  containerWidth,
  containerHeight
) => {
  const contentAspect = contentWidth / contentHeight;
  const containerAspect = containerWidth / containerHeight;

  let width, height;

  if (contentAspect > containerAspect) {
    height = containerHeight;
    width = height * contentAspect;
  } else {
    width = containerWidth;
    height = width / contentAspect;
  }

  return { width, height };
};

// Función para calcular dimensiones cover con margen para parallax
export const calculateCoverDimensionsWithParallaxMargin = (
  contentWidth,
  contentHeight,
  containerWidth,
  containerHeight,
  parallaxFactor = 0
) => {
  const baseDimensions = calculateCoverDimensions(
    contentWidth,
    contentHeight,
    containerWidth,
    containerHeight
  );

  const marginX = parallaxFactor * containerWidth * 2;
  const marginY = parallaxFactor * containerHeight * 2;

  return {
    width: baseDimensions.width + marginX,
    height: baseDimensions.height + marginY,
  };
};

// Función optimizada para cargar texturas con cache mejorado y assets precargados
export function loadImageTexture(imagePath, gl, getPreloadedAsset) {
  const preloadedImage =
    getPreloadedAsset && getPreloadedAsset("images", imagePath);

  if (preloadedImage) {
    const texture = new THREE.Texture(preloadedImage);
    configureTexture(texture, gl);
    texture.needsUpdate = true;
    textureCache.set(imagePath, texture);
    return texture;
  }

  if (textureCache.has(imagePath)) {
    return textureCache.get(imagePath);
  }

  const loader = new THREE.TextureLoader();
  const texture = loader.load(imagePath);
  configureTexture(texture, gl);

  textureCache.set(imagePath, texture);
  return texture;
}

// Función corregida para crear un video fresco desde uno precargado
export function createFreshVideoFromPreloaded(preloadedVideo, gl) {
  const freshVideo = document.createElement("video");

  freshVideo.src = preloadedVideo.src;
  freshVideo.crossOrigin = "anonymous";
  freshVideo.loop = true;
  freshVideo.muted = true;
  freshVideo.playsInline = true;
  freshVideo.preload = "metadata";

  return new Promise((resolve, reject) => {
    const onCanPlay = () => {
      freshVideo.removeEventListener("canplay", onCanPlay);
      freshVideo.removeEventListener("error", onError);

      const texture = new THREE.VideoTexture(freshVideo);
      configureTexture(texture, gl);
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;

      freshVideo.play().catch(console.error);

      const result = {
        texture,
        video: freshVideo,
        width: freshVideo.videoWidth || preloadedVideo.videoWidth || 1920,
        height: freshVideo.videoHeight || preloadedVideo.videoHeight || 1080,
      };

      resolve(result);
    };

    const onError = (e) => {
      freshVideo.removeEventListener("canplay", onCanPlay);
      freshVideo.removeEventListener("error", onError);
      reject(e);
    };

    freshVideo.addEventListener("canplay", onCanPlay);
    freshVideo.addEventListener("error", onError);

    freshVideo.load();
  });
}

// Función optimizada para videos con cache, reutilización y assets precargados
export function createVideoTexture(videoSrc, gl, getPreloadedAsset) {
  const preloadedVideo =
    getPreloadedAsset && getPreloadedAsset("videos", videoSrc);

  if (preloadedVideo) {
    return createFreshVideoFromPreloaded(preloadedVideo, gl);
  }

  if (videoCache.has(videoSrc)) {
    const cachedVideo = videoCache.get(videoSrc);
    if (!cachedVideo.video.ended && cachedVideo.video.readyState >= 2) {
      return Promise.resolve(cachedVideo);
    }
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    Object.assign(video, {
      src: videoSrc,
      crossOrigin: "anonymous",
      loop: true,
      muted: true,
      playsInline: true,
      preload: "metadata",
    });

    const onLoadedMetadata = () => {
      const texture = new THREE.VideoTexture(video);
      configureTexture(texture, gl);
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;

      video.play().catch(console.error);

      const result = {
        texture,
        video,
        width: video.videoWidth,
        height: video.videoHeight,
      };

      videoCache.set(videoSrc, result);

      setTimeout(() => {
        if (videoCache.has(videoSrc) && video.paused) {
          videoCache.delete(videoSrc);
        }
      }, 300000);

      resolve(result);
    };

    const onError = (e) => {
      console.error("Error loading video:", e);
      reject(e);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.load();
  });
}

// 🌫️ FUNCIÓN PARA CREAR VIDEO DE HUMO - PERFECTA
export function createSmokeVideoTexture(gl, getPreloadedAsset) {
  const smokeSrc = "Smoke_v02.mp4";

  return createVideoTexture(smokeSrc, gl, getPreloadedAsset).catch((error) => {
    console.warn("No se pudo cargar video de humo:", error);
    return null;
  });
}

// Material optimizado con instancia única
export const TransitionMaterial = shaderMaterial(
  {
    uTexture1: null,
    uTexture2: null,
    uProgress: 0,
    uTime: 0,
  },
  vertexShader,
  fragmentShader
);
