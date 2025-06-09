import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

// Mapeo de números a videos/imágenes para la escena 1
const MEDIA_MAP = {
  1: { type: "video", src: "Clouds_v01.mp4" },
  2: { type: "video", src: "Rain_v01.mp4" },
  3: { type: "video", src: "Ground_v01.mp4" },
  4: { type: "video", src: "Sea_v01.mp4" },
  5: { type: "video", src: "Evaporation_v01.mp4" },
};

const DEFAULT_IMAGE = "cloud.jpg";

// Cache global para texturas optimizado
const textureCache = new Map();
const videoCache = new Map();

// Pool de geometrías reutilizables
const geometryPool = new Map();

// Configuración común de texturas optimizada
const configureTexture = (texture, gl) => {
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy()); // Reducido de 16 a 4
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

// Función optimizada para obtener geometría del pool
const getGeometry = (width, height) => {
  const key = `${width.toFixed(2)}_${height.toFixed(2)}`;
  if (!geometryPool.has(key)) {
    geometryPool.set(key, new THREE.PlaneGeometry(width, height));
  }
  return geometryPool.get(key);
};

// Función para calcular dimensiones tipo "cover" (sin cambios, ya es eficiente)
const calculateCoverDimensions = (
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

// Función para calcular dimensiones cover con margen para parallax (sin cambios)
const calculateCoverDimensionsWithParallaxMargin = (
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

// Función optimizada para cargar texturas con cache mejorado
function loadImageTexture(imagePath, gl) {
  if (textureCache.has(imagePath)) {
    return textureCache.get(imagePath);
  }

  const loader = new THREE.TextureLoader();
  const texture = loader.load(imagePath);
  configureTexture(texture, gl);

  textureCache.set(imagePath, texture);
  return texture;
}

// Función optimizada para videos con cache y reutilización
function createVideoTexture(videoSrc, gl) {
  // Verificar cache de videos activos
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

      // Cachear el video por un tiempo limitado
      videoCache.set(videoSrc, result);

      // Limpiar cache después de 5 minutos de inactividad
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

// Función para detectar dispositivos táctiles (memoizada)
const isTouchDevice = (() => {
  const result =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;
  return () => result;
})();

// Hook de parallax optimizado con throttling
function useParallax() {
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const isTouch = useMemo(() => isTouchDevice(), []);
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    if (isTouch) return;

    const handleMouseMove = (e) => {
      // Throttling para evitar demasiadas actualizaciones
      const now = Date.now();
      if (now - lastUpdateTime.current < 16) return; // ~60fps
      lastUpdateTime.current = now;

      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = -((e.clientY / window.innerHeight) * 2 - 1);
      targetPosition.current = { x: normalizedX, y: normalizedY };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isTouch]);

  const updateParallax = useCallback(() => {
    if (isTouch) {
      return { x: 0, y: 0 };
    }

    const lerp = (start, end, factor) => start + (end - start) * factor;
    const smoothFactor = 0.02;

    currentPosition.current.x = lerp(
      currentPosition.current.x,
      targetPosition.current.x,
      smoothFactor
    );
    currentPosition.current.y = lerp(
      currentPosition.current.y,
      targetPosition.current.y,
      smoothFactor
    );

    return currentPosition.current;
  }, [isTouch]);

  return { updateParallax, isTouch };
}

// Material optimizado con instancia única
const TransitionMaterial = shaderMaterial(
  {
    uTexture1: null,
    uTexture2: null,
    uProgress: 0,
    uTime: 0,
  },
  vertexShader,
  fragmentShader
);

export default function ImageTransitions({
  isToggled,
  selectedNumber,
  onParallaxUpdate,
  onAnimationChange,
}) {
  const [displayedNumber, setDisplayedNumber] = useState(null);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [mediaDimensions, setMediaDimensions] = useState({
    width: 1,
    height: 1,
  });
  const { gl, viewport, size } = useThree();

  // Referencias optimizadas
  const meshRef = useRef();
  const wasAnimatingRef = useRef(false);
  const currentVideoRef = useRef(null);
  const parallaxPlanesRef = useRef({});
  const progressRef = useRef(0);
  const renderTargetsRef = useRef(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });

  const { updateParallax, isTouch } = useParallax();

  // Cleanup de video optimizado
  const cleanupVideo = useCallback(() => {
    if (currentVideoRef.current) {
      const video = currentVideoRef.current;
      // No pausar inmediatamente, solo cuando realmente se cambie
      if (!videoCache.has(video.src)) {
        video.pause();
        video.src = "";
      }
      currentVideoRef.current = null;
    }
  }, []);

  // Texturas del parallax memoizadas (optimizado para evitar recreaciones)
  const parallaxTextures = useMemo(() => {
    if (isTouch) {
      const staticTexture = loadImageTexture("BG_v02.png", gl);
      return {
        static: {
          texture: staticTexture,
          width: 2500,
          height: 2500,
        },
      };
    }

    const textures = {
      bg: {
        texture: loadImageTexture("BG_v03.png", gl),
        width: 2500,
        height: 1080,
      },
      clouds: {
        texture: loadImageTexture("Clouds_v01.png", gl),
        width: 1920,
        height: 1080,
      },
      island: {
        texture: loadImageTexture("Island_v03.png", gl),
        width: 2500,
        height: 1080,
      },
    };

    return textures;
  }, [gl, isTouch]);

  // Render targets optimizados - solo recrear cuando sea necesario
  const renderTargets = useMemo(() => {
    const sizeChanged =
      Math.abs(size.width - lastSizeRef.current.width) > 50 ||
      Math.abs(size.height - lastSizeRef.current.height) > 50;

    if (!sizeChanged && renderTargetsRef.current) {
      return renderTargetsRef.current;
    }

    lastSizeRef.current = { width: size.width, height: size.height };

    const getOptimalResolution = () => {
      const pixelRatio = Math.min(gl.getPixelRatio(), 2); // Limitar pixel ratio
      const width = Math.floor(size.width * pixelRatio);
      const height = Math.floor(size.height * pixelRatio);
      const maxSize = 1536; // Reducido de 2048 a 1536
      const scale = Math.min(1, maxSize / Math.max(width, height));

      return {
        width: Math.floor(width * scale),
        height: Math.floor(height * scale),
      };
    };

    const resolution = getOptimalResolution();
    const rtConfig = {
      width: resolution.width,
      height: resolution.height,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      samples: 0, // Desactivar MSAA para mejor rendimiento
      encoding: THREE.sRGBEncoding,
    };

    // Limpiar render targets anteriores
    if (renderTargetsRef.current) {
      renderTargetsRef.current.rt1.dispose();
      renderTargetsRef.current.rt2.dispose();
    }

    const rt1 = new THREE.WebGLRenderTarget(
      resolution.width,
      resolution.height,
      rtConfig
    );
    const rt2 = new THREE.WebGLRenderTarget(
      resolution.width,
      resolution.height,
      rtConfig
    );

    [rt1, rt2].forEach((rt) => {
      rt.texture.generateMipmaps = false;
      rt.texture.flipY = false;
    });

    const newRenderTargets = { rt1, rt2 };
    renderTargetsRef.current = newRenderTargets;

    return newRenderTargets;
  }, [size.width, size.height, gl]);

  // Escenas memoizadas (sin cambios, ya es eficiente)
  const scenes = useMemo(
    () => ({
      scene1: new THREE.Scene(),
      scene2: new THREE.Scene(),
    }),
    []
  );

  // Camera memoizada (sin cambios, ya es eficiente)
  const camera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(
      -viewport.width / 2,
      viewport.width / 2,
      viewport.height / 2,
      -viewport.height / 2,
      0.1,
      1000
    );
    cam.position.z = 1;
    return cam;
  }, [viewport.width, viewport.height]);

  // Material memoizado (optimizado)
  const material = useMemo(() => new TransitionMaterial(), []);

  // Cargar media optimizado con cache mejorado
  useEffect(() => {
    let isCancelled = false;

    const loadMedia = async () => {
      if (!displayedNumber) {
        const defaultTexture = loadImageTexture(DEFAULT_IMAGE, gl);
        if (!isCancelled) {
          setCurrentMedia(defaultTexture);
          setMediaDimensions({ width: 1920, height: 1080 });
        }
        return;
      }

      const mediaConfig = MEDIA_MAP[displayedNumber];
      if (!mediaConfig) {
        const defaultTexture = loadImageTexture(DEFAULT_IMAGE, gl);
        if (!isCancelled) {
          setCurrentMedia(defaultTexture);
          setMediaDimensions({ width: 1920, height: 1080 });
        }
        return;
      }

      try {
        // Solo limpiar si realmente cambiamos de video
        if (
          currentVideoRef.current &&
          currentVideoRef.current.src !== mediaConfig.src
        ) {
          cleanupVideo();
        }

        if (mediaConfig.type === "video") {
          const { texture, video, width, height } = await createVideoTexture(
            mediaConfig.src,
            gl
          );
          if (!isCancelled) {
            currentVideoRef.current = video;
            setCurrentMedia(texture);
            setMediaDimensions({
              width: width || 1920,
              height: height || 1080,
            });
          }
        } else {
          const texture = loadImageTexture(mediaConfig.src, gl);
          if (!isCancelled) {
            setCurrentMedia(texture);
            setMediaDimensions({ width: 1920, height: 1080 });
          }
        }
      } catch (error) {
        console.error("Error cargando media:", error);
        if (!isCancelled) {
          setCurrentMedia(loadImageTexture(DEFAULT_IMAGE, gl));
          setMediaDimensions({ width: 1920, height: 1080 });
        }
      }
    };

    loadMedia();
    return () => {
      isCancelled = true;
    };
  }, [displayedNumber, gl, cleanupVideo]);

  // Configurar escenas optimizado con pool de geometrías
  useEffect(() => {
    const { scene1, scene2 } = scenes;

    // Limpiar escenas de manera más eficiente
    [scene1, scene2].forEach((scene) => {
      while (scene.children.length > 0) {
        const child = scene.children[0];
        scene.remove(child);
        // No disponer geometrías del pool
        if (child.material && child.material.map) {
          // No disponer texturas del cache
        }
        if (
          child.material &&
          !textureCache.has(child.material.map?.image?.src)
        ) {
          child.material.dispose();
        }
      }
    });

    // Calcular dimensiones cover para el media principal
    const coverDimensions = calculateCoverDimensions(
      mediaDimensions.width,
      mediaDimensions.height,
      viewport.width,
      viewport.height
    );

    // ESCENA 1: Media con comportamiento cover
    if (currentMedia) {
      const geometry1 = getGeometry(
        coverDimensions.width,
        coverDimensions.height
      );
      const material1 = new THREE.MeshBasicMaterial({
        map: currentMedia,
        transparent: false,
      });
      const mesh1 = new THREE.Mesh(geometry1, material1);
      scene1.add(mesh1);
    }

    // ESCENA 2: Parallax
    if (isTouch) {
      const staticData = parallaxTextures.static;
      const coverDimensions = calculateCoverDimensions(
        staticData.width,
        staticData.height,
        viewport.width,
        viewport.height
      );

      const geometry = getGeometry(
        coverDimensions.width,
        coverDimensions.height
      );
      const material = new THREE.MeshBasicMaterial({
        map: staticData.texture,
        transparent: false,
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.position.z = 0;
      scene2.add(plane);
      parallaxPlanesRef.current = {};
    } else {
      const parallaxLayers = [
        {
          textureData: parallaxTextures.bg,
          z: -0.1,
          ref: "bg",
          parallaxFactor: 0.01,
        },
        {
          textureData: parallaxTextures.clouds,
          z: 0,
          ref: "clouds",
          parallaxFactor: 0.02,
        },
        {
          textureData: parallaxTextures.island,
          z: 0.1,
          ref: "island",
          parallaxFactor: 0.05,
        },
      ];

      parallaxLayers.forEach(({ textureData, z, ref, parallaxFactor }) => {
        const coverDimensions = calculateCoverDimensionsWithParallaxMargin(
          textureData.width,
          textureData.height,
          viewport.width,
          viewport.height,
          parallaxFactor
        );

        const geometry = getGeometry(
          coverDimensions.width,
          coverDimensions.height
        );
        const material = new THREE.MeshBasicMaterial({
          map: textureData.texture,
          transparent: true,
        });
        const plane = new THREE.Mesh(geometry, material);
        plane.position.z = z;
        scene2.add(plane);
        parallaxPlanesRef.current[ref] = plane;
      });
    }
  }, [
    scenes,
    viewport.width,
    viewport.height,
    currentMedia,
    parallaxTextures,
    mediaDimensions,
    isTouch,
  ]);

  // Actualizar displayedNumber (sin cambios)
  useEffect(() => {
    if (selectedNumber !== null) {
      setDisplayedNumber(selectedNumber);
    }
  }, [selectedNumber]);

  // Cleanup general
  useEffect(() => {
    return () => {
      cleanupVideo();
      if (renderTargetsRef.current) {
        renderTargetsRef.current.rt1.dispose();
        renderTargetsRef.current.rt2.dispose();
      }
    };
  }, [cleanupVideo]);

  // useFrame optimizado con menos cálculos por frame
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Actualizar video texture con menos frecuencia
    if (currentVideoRef.current && currentMedia) {
      if (
        currentVideoRef.current.paused &&
        currentVideoRef.current.readyState >= 2
      ) {
        currentVideoRef.current.play().catch(console.error);
      }
      currentMedia.needsUpdate = true;
    }

    // Animar progreso (optimizado)
    const targetProgress = isToggled ? 1 : 0;
    const progressDiff = targetProgress - progressRef.current;
    progressRef.current += progressDiff * 0.005;

    // Gestionar animación
    const threshold = selectedNumber === null ? 0.3 : 0.3;
    const isCurrentlyAnimating = Math.abs(progressDiff) > threshold;

    if (wasAnimatingRef.current !== isCurrentlyAnimating) {
      wasAnimatingRef.current = isCurrentlyAnimating;
      onAnimationChange?.(isCurrentlyAnimating);
    }

    // Cambiar displayedNumber al volver al parallax
    if (
      selectedNumber === null &&
      displayedNumber !== null &&
      Math.abs(progressRef.current) < 0.05
    ) {
      setDisplayedNumber(null);
    }

    // Actualizar parallax (throttled)
    const parallaxValues = updateParallax();
    onParallaxUpdate?.({ ...parallaxValues, viewport });

    // Aplicar parallax a planos (solo si no es touch)
    if (!isTouch) {
      const parallaxFactors = { bg: 0.01, clouds: 0.02, island: 0.05 };
      Object.entries(parallaxFactors).forEach(([ref, factor]) => {
        const plane = parallaxPlanesRef.current[ref];
        if (plane) {
          plane.position.x = parallaxValues.x * factor * viewport.width;
          plane.position.y = parallaxValues.y * factor * viewport.height;
        }
      });
    }

    // Renderizar escenas (optimizado)
    const currentRenderTarget = gl.getRenderTarget();
    const currentClearColor = new THREE.Color();
    gl.getClearColor(currentClearColor);
    const currentClearAlpha = gl.getClearAlpha();

    // Renderizar solo si es necesario
    gl.setRenderTarget(renderTargets.rt1);
    gl.setClearColor("#000000", 1);
    gl.clear(true, true, true);
    gl.render(scenes.scene1, camera);

    gl.setRenderTarget(renderTargets.rt2);
    gl.setClearColor("#000000", 1);
    gl.clear(true, true, true);
    gl.render(scenes.scene2, camera);

    // Restaurar estado
    gl.setRenderTarget(currentRenderTarget);
    gl.setClearColor(currentClearColor, currentClearAlpha);

    // Actualizar material
    material.uniforms.uTexture1.value = renderTargets.rt1.texture;
    material.uniforms.uTexture2.value = renderTargets.rt2.texture;
    material.uniforms.uProgress.value = progressRef.current;
    material.uniforms.uTime.value = time;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
