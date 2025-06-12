import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { useDevice } from "../hooks/useDevice";
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";
import { useParallaxMouse } from "../hooks/useGlobalMouse";

// Mapeo de números a videos/imágenes para la escena 1
const MEDIA_MAP = {
  1: { type: "video", src: "Clouds_v02.mp4" },
  2: { type: "video", src: "Rain_v01.mp4" },
  3: { type: "video", src: "Ground_v01.mp4" },
  4: { type: "video", src: "Sea_v01.mp4" },
  5: { type: "video", src: "Evaporation_v01.mp4" },
};

const DEFAULT_IMAGE = "BG_v03.png";

// Cache global para texturas optimizado
const textureCache = new Map();
const videoCache = new Map();

// Pool de geometrías reutilizables
const geometryPool = new Map();

// Configuración común de texturas optimizada
const configureTexture = (texture, gl) => {
  // Fix for Three.js r152+: Use colorSpace instead of encoding
  texture.colorSpace = THREE.NoColorSpace;
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

// Función optimizada para cargar texturas con cache mejorado y assets precargados
function loadImageTexture(imagePath, gl, getPreloadedAsset) {
  // Primero intentar obtener la imagen precargada
  const preloadedImage =
    getPreloadedAsset && getPreloadedAsset("images", imagePath);

  if (preloadedImage) {
    // Usar la imagen ya precargada
    const texture = new THREE.Texture(preloadedImage);
    configureTexture(texture, gl);
    texture.needsUpdate = true;
    textureCache.set(imagePath, texture);
    return texture;
  }

  // Fallback al método original si no hay asset precargado
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
function createFreshVideoFromPreloaded(preloadedVideo, videoSrc, gl) {
  // CREAR UN NUEVO ELEMENTO VIDEO - NO REUTILIZAR EL PRECARGADO
  const freshVideo = document.createElement("video");

  // Copiar las propiedades básicas
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

      // Crear la textura con el video fresco
      const texture = new THREE.VideoTexture(freshVideo);
      configureTexture(texture, gl);
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;

      // Intentar reproducir
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

    // Iniciar la carga
    freshVideo.load();
  });
}

// Función optimizada para videos con cache, reutilización y assets precargados
function createVideoTexture(videoSrc, gl, getPreloadedAsset) {
  // Primero intentar obtener el video precargado
  const preloadedVideo =
    getPreloadedAsset && getPreloadedAsset("videos", videoSrc);

  if (preloadedVideo) {
    // Crear un video fresco desde el precargado para evitar problemas WebGL
    return createFreshVideoFromPreloaded(preloadedVideo, videoSrc, gl);
  }

  // Fallback al método original si no hay asset precargado
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

/**
 * Renderizar escenas de manera optimizada, evitando operaciones innecesarias
 */
function optimizedRenderScenes(
  gl,
  scenes,
  camera,
  renderTargets,
  cache,
  needsRenderRef
) {
  // ✅ GUARDAR ESTADO ACTUAL UNA SOLA VEZ
  const currentRenderTarget = gl.getRenderTarget();
  const currentClearAlpha = gl.getClearAlpha();

  // ✅ REUTILIZAR COLOR OBJECT EN LUGAR DE CREAR NUEVO
  gl.getClearColor(cache.clearColor);

  // ✅ RENDERIZAR SIEMPRE POR AHORA - REMOVER OPTIMIZACIÓN AGRESIVA
  // TODO: Optimizar después de confirmar que funciona

  // RENDERIZAR RT1
  gl.setRenderTarget(renderTargets.rt1);
  gl.setClearColor("#000000", 1);
  gl.clear(true, true, true);
  gl.render(scenes.scene1, camera);

  // RENDERIZAR RT2
  gl.setRenderTarget(renderTargets.rt2);
  gl.setClearColor("#000000", 1);
  gl.clear(true, true, true);
  gl.render(scenes.scene2, camera);

  // ✅ RESTAURAR ESTADO UNA SOLA VEZ
  gl.setRenderTarget(currentRenderTarget);
  gl.setClearColor(cache.clearColor, currentClearAlpha);
}

/**
 * Actualizar uniforms solo si los valores cambiaron
 */
function updateMaterialUniforms(
  material,
  renderTargets,
  progress,
  time,
  cache
) {
  const uniforms = material.uniforms;
  const lastValues = cache.lastUniforms;

  // ✅ ACTUALIZAR TEXTURAS SIEMPRE POR AHORA - REMOVER OPTIMIZACIÓN AGRESIVA
  uniforms.uTexture1.value = renderTargets.rt1.texture;
  uniforms.uTexture2.value = renderTargets.rt2.texture;

  // ✅ ACTUALIZAR PROGRESS SOLO SI CAMBIÓ SIGNIFICATIVAMENTE
  if (Math.abs(lastValues.uProgress - progress) > 0.001) {
    uniforms.uProgress.value = progress;
    lastValues.uProgress = progress;
  }

  // ✅ ACTUALIZAR TIEMPO SIEMPRE (pero sin crear objetos nuevos)
  uniforms.uTime.value = time;
  lastValues.uTime = time;
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
  getPreloadedAsset, // Nueva prop para assets precargados
}) {
  // Usar el hook del provider para obtener información del dispositivo
  const { isTouch, isMobile, isTablet, deviceType } = useDevice();

  const [displayedNumber, setDisplayedNumber] = useState(null);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false); // NUEVO: Estado para verificar si el video está listo
  const [mediaDimensions, setMediaDimensions] = useState({
    width: 1,
    height: 1,
  });
  const { gl, viewport, size } = useThree();

  const renderCache = useMemo(() => {
    return {
      // Color object reutilizable para evitar new THREE.Color() cada frame
      clearColor: new THREE.Color(),

      // Cache para valores de uniforms previos (evitar asignaciones innecesarias)
      lastUniforms: {
        uProgress: -1,
        uTime: -1,
        uTexture1: null,
        uTexture2: null,
      },

      // Referencias de render targets para comparar cambios
      lastRenderTargets: {
        rt1: null,
        rt2: null,
      },
    };
  }, []);

  // Referencias optimizadas
  const meshRef = useRef();
  const wasAnimatingRef = useRef(false);
  const currentVideoRef = useRef(null);
  const parallaxPlanesRef = useRef({});
  const progressRef = useRef(0);
  const renderTargetsRef = useRef(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });
  const needsRender = useRef(true);

  const parallaxValues = useParallaxMouse(!isTouch);

  // Cleanup de video mejorado
  const cleanupVideo = useCallback(() => {
    if (currentVideoRef.current) {
      const video = currentVideoRef.current;

      // Pausar y limpiar el video completamente
      try {
        video.pause();
        video.removeAttribute("src");
        video.load(); // Esto fuerza a limpiar el buffer
      } catch (error) {
        console.warn("Error cleaning up video:", error);
      }

      currentVideoRef.current = null;
    }
    setIsVideoReady(false); // NUEVO: Resetear estado de video
  }, []);

  // Texturas del parallax memoizadas (optimizado para evitar recreaciones y usar assets precargados)
  const parallaxTextures = useMemo(() => {
    if (isTouch) {
      const staticTexture = loadImageTexture(
        "TheIslandCycle_All_v04.png",
        gl,
        getPreloadedAsset
      );
      return {
        static: {
          texture: staticTexture,
          width: 2500,
          height: 1800,
        },
      };
    }

    const textures = {
      bg: {
        texture: loadImageTexture("BG_v03.png", gl, getPreloadedAsset),
        width: 2500,
        height: 1080,
      },
      clouds: {
        texture: loadImageTexture("Clouds_v01.webp", gl, getPreloadedAsset),
        width: 1920,
        height: 1080,
      },
      rain: {
        texture: loadImageTexture("Rain_v01.webp", gl, getPreloadedAsset),
        width: 1920,
        height: 1080,
      },
      island: {
        texture: loadImageTexture("Island_v03.webp", gl, getPreloadedAsset),
        width: 2500,
        height: 1080,
      },
    };

    return textures;
  }, [gl, isTouch, getPreloadedAsset]);

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

      // Ajustar resolución máxima según el tipo de dispositivo
      let maxSize = 1536; // Default para desktop
      if (isMobile) {
        maxSize = 1024; // Menor resolución para móviles
      } else if (isTablet) {
        maxSize = 1280; // Resolución intermedia para tablets
      }

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
      colorSpace: THREE.NoColorSpace, // Fix for Three.js r152+
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
  }, [size.width, size.height, gl, isMobile, isTablet]);

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

  // Cargar media optimizado con cache mejorado y assets precargados
  useEffect(() => {
    let isCancelled = false;

    const loadMedia = async () => {
      if (!displayedNumber) {
        const defaultTexture = loadImageTexture(
          DEFAULT_IMAGE,
          gl,
          getPreloadedAsset
        );
        if (!isCancelled) {
          setCurrentMedia(defaultTexture);
          setMediaDimensions({ width: 1920, height: 1080 });
          setIsVideoReady(true); // Las imágenes están siempre listas
        }
        return;
      }

      const mediaConfig = MEDIA_MAP[displayedNumber];
      if (!mediaConfig) {
        const defaultTexture = loadImageTexture(
          DEFAULT_IMAGE,
          gl,
          getPreloadedAsset
        );
        if (!isCancelled) {
          setCurrentMedia(defaultTexture);
          setMediaDimensions({ width: 1920, height: 1080 });
          setIsVideoReady(true); // Las imágenes están siempre listas
        }
        return;
      }

      try {
        // Siempre limpiar el video anterior antes de cargar uno nuevo
        cleanupVideo();

        if (mediaConfig.type === "video") {
          const { texture, video, width, height } = await createVideoTexture(
            mediaConfig.src,
            gl,
            getPreloadedAsset
          );
          if (!isCancelled) {
            currentVideoRef.current = video;
            setCurrentMedia(texture);
            setMediaDimensions({
              width: width || 1920,
              height: height || 1080,
            });

            // NUEVO: Verificar que el video esté realmente listo
            const checkVideoReady = () => {
              if (video.readyState >= 2 && video.videoWidth > 0) {
                setIsVideoReady(true);
              } else {
                // Esperar un poco más si no está listo
                setTimeout(checkVideoReady, 50);
              }
            };
            checkVideoReady();
          }
        } else {
          const texture = loadImageTexture(
            mediaConfig.src,
            gl,
            getPreloadedAsset
          );
          if (!isCancelled) {
            setCurrentMedia(texture);
            setMediaDimensions({ width: 1920, height: 1080 });
            setIsVideoReady(true); // Las imágenes están siempre listas
          }
        }
      } catch (error) {
        console.error("Error cargando media:", error);
        if (!isCancelled) {
          setCurrentMedia(
            loadImageTexture(DEFAULT_IMAGE, gl, getPreloadedAsset)
          );
          setMediaDimensions({ width: 1920, height: 1080 });
          setIsVideoReady(true); // Fallback siempre listo
        }
      }
    };

    loadMedia();
    return () => {
      isCancelled = true;
    };
  }, [displayedNumber, gl, cleanupVideo, getPreloadedAsset]);

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

    // ESCENA 1: Media con comportamiento cover - SOLO SI ESTÁ LISTO
    if (currentMedia && isVideoReady) {
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
          textureData: parallaxTextures.rain,
          z: -0.05,
          ref: "rain",
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
    isVideoReady, // NUEVO: Dependencia del estado de video listo
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

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // ✅ ACTUALIZAR VIDEO TEXTURE CON VALIDACIÓN MEJORADA
    if (currentVideoRef.current && currentMedia && isVideoReady) {
      const video = currentVideoRef.current;
      if (video.readyState >= 2 && !video.ended && video.videoWidth > 0) {
        if (video.paused) {
          video.play().catch(() => {});
        }
        currentMedia.needsUpdate = true;
      }
    }

    // ✅ VERIFICAR SI DEBEMOS ANIMAR (sin cambios)
    const shouldAnimate = !isToggled || (isToggled && isVideoReady);

    if (shouldAnimate) {
      const targetProgress = isToggled ? 1 : 0;
      const progressDiff = targetProgress - progressRef.current;
      const transitionSpeed = isTouch ? 0.015 : 0.005;
      progressRef.current += progressDiff * transitionSpeed;
    }

    // ✅ GESTIÓN DE ANIMACIÓN (sin cambios)
    const threshold = selectedNumber === null ? 0.3 : 0.3;
    const progressDiff = (isToggled ? 1 : 0) - progressRef.current;
    const isCurrentlyAnimating = Math.abs(progressDiff) > threshold;

    if (wasAnimatingRef.current !== isCurrentlyAnimating) {
      wasAnimatingRef.current = isCurrentlyAnimating;
      onAnimationChange?.(isCurrentlyAnimating);
    }

    // ✅ CAMBIAR displayedNumber (sin cambios)
    if (
      selectedNumber === null &&
      displayedNumber !== null &&
      Math.abs(progressRef.current) < 0.05
    ) {
      setDisplayedNumber(null);
    }

    // ✅ PARALLAX APLICADO A PLANOS (sin cambios - ya optimizado)
    if (!isTouch) {
      const parallaxFactors = {
        bg: 0.01,
        clouds: 0.02,
        rain: 0.02,
        island: 0.05,
      };
      Object.entries(parallaxFactors).forEach(([ref, factor]) => {
        const plane = parallaxPlanesRef.current[ref];
        if (plane) {
          plane.position.x = parallaxValues.x * factor * viewport.width;
          plane.position.y = parallaxValues.y * factor * viewport.height;
        }
      });
    }

    // 🚀 OPTIMIZACIÓN CRÍTICA: RENDERIZAR ESCENAS CON CACHE
    optimizedRenderScenes(
      gl,
      scenes,
      camera,
      renderTargets,
      renderCache,
      needsRender
    );

    // 🚀 OPTIMIZACIÓN CRÍTICA: ACTUALIZAR UNIFORMS SOLO SI CAMBIARON
    updateMaterialUniforms(
      material,
      renderTargets,
      progressRef.current,
      time,
      renderCache
    );
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
