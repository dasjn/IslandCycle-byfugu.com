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

// Cache global para texturas
const textureCache = new Map();

// Configuración común de texturas
const configureTexture = (texture, gl) => {
  texture.encoding = THREE.sRGBEncoding;
  texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
};

// Función para calcular dimensiones tipo "cover"
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
    // El contenido es más ancho, ajustar por altura
    height = containerHeight;
    width = height * contentAspect;
  } else {
    // El contenido es más alto, ajustar por anchura
    width = containerWidth;
    height = width / contentAspect;
  }

  return { width, height };
};

// Función para calcular dimensiones cover con margen para parallax
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

  // Calcular el margen extra necesario para el parallax
  // El parallax va de -1 a 1, por lo que el movimiento máximo es ±parallaxFactor * viewport
  const marginX = parallaxFactor * containerWidth * 2; // *2 porque puede moverse en ambas direcciones
  const marginY = parallaxFactor * containerHeight * 2;

  return {
    width: baseDimensions.width + marginX,
    height: baseDimensions.height + marginY,
  };
};

// Función optimizada para cargar texturas con cache
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

// Función optimizada para videos con preservación durante resize
function createVideoTexture(videoSrc, gl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    Object.assign(video, {
      src: videoSrc,
      crossOrigin: "anonymous",
      loop: true,
      muted: true,
      playsInline: true,
      preload: "metadata", // Cargar metadata para obtener dimensiones
    });

    const onLoadedMetadata = () => {
      const texture = new THREE.VideoTexture(video);
      configureTexture(texture, gl);
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;

      // Asegurar que el video se reproduzca
      video.play().catch(console.error);

      resolve({
        texture,
        video,
        width: video.videoWidth,
        height: video.videoHeight,
      });
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

// Función para detectar dispositivos táctiles
const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
};

// Hook de parallax optimizado con detección de touch
function useParallax() {
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const isTouch = useMemo(() => isTouchDevice(), []);

  useEffect(() => {
    // Si es touch device, no activar parallax
    if (isTouch) return;

    const handleMouseMove = (e) => {
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = -((e.clientY / window.innerHeight) * 2 - 1);
      targetPosition.current = { x: normalizedX, y: normalizedY };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isTouch]);

  const updateParallax = useCallback(() => {
    // Si es touch device, mantener posición estática
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

  const { updateParallax, isTouch } = useParallax();

  // Función para preservar el estado del video durante resize
  const preserveVideoState = useCallback((video) => {
    if (!video) return null;

    return {
      currentTime: video.currentTime,
      paused: video.paused,
      playbackRate: video.playbackRate,
    };
  }, []);

  // Función para restaurar el estado del video después del resize
  const restoreVideoState = useCallback((video, state) => {
    if (!video || !state) return;

    video.currentTime = state.currentTime;
    video.playbackRate = state.playbackRate;

    if (!state.paused) {
      video.play().catch(console.error);
    }
  }, []);

  // Cleanup de video optimizado
  const cleanupVideo = useCallback(() => {
    if (currentVideoRef.current) {
      currentVideoRef.current.pause();
      currentVideoRef.current.src = "";
      currentVideoRef.current = null;
    }
  }, []);

  // Texturas del parallax memoizadas con dimensiones
  const parallaxTextures = useMemo(() => {
    // Para dispositivos touch, solo cargar una imagen estática
    if (isTouch) {
      const staticTexture = loadImageTexture("BG_v02.png", gl);
      const getTextureDimensions = (texture) => {
        if (texture.image) {
          return { width: texture.image.width, height: texture.image.height };
        }
        return { width: 2500, height: 2500 }; // Dimensiones por defecto para v02
      };

      // Agregar listener para cuando la textura se cargue
      if (!staticTexture.image) {
        staticTexture.onLoad = () => {
          setDisplayedNumber((prev) => prev);
        };
      }

      return {
        static: {
          texture: staticTexture,
          ...getTextureDimensions(staticTexture),
        },
      };
    }

    // Para dispositivos no-touch, cargar todas las capas del parallax
    const textures = {
      bg: loadImageTexture("BG_v03.png", gl),
      clouds: loadImageTexture("Clouds_v01.png", gl),
      island: loadImageTexture("Island_v03.png", gl),
    };

    // Función para obtener dimensiones de textura cuando esté cargada
    const getTextureDimensions = (
      texture,
      defaultSize = { width: 1920, height: 1080 }
    ) => {
      if (texture.image) {
        return { width: texture.image.width, height: texture.image.height };
      }
      return defaultSize;
    };

    // Agregar listener para cuando las texturas se carguen
    Object.values(textures).forEach((texture) => {
      if (!texture.image) {
        texture.onLoad = () => {
          // Forzar re-render cuando las texturas se carguen completamente
          setDisplayedNumber((prev) => prev);
        };
      }
    });

    return {
      bg: {
        texture: textures.bg,
        ...getTextureDimensions(textures.bg, { width: 2500, height: 1080 }),
      },
      clouds: {
        texture: textures.clouds,
        ...getTextureDimensions(textures.clouds, { width: 1920, height: 1080 }),
      },
      island: {
        texture: textures.island,
        ...getTextureDimensions(textures.island, { width: 2500, height: 1080 }),
      },
    };
  }, [gl, isTouch]);

  // Render targets optimizados - solo se recrean si cambia drásticamente el tamaño
  const renderTargets = useMemo(() => {
    const getOptimalResolution = () => {
      const pixelRatio = gl.getPixelRatio();
      const width = Math.floor(size.width * pixelRatio);
      const height = Math.floor(size.height * pixelRatio);
      const maxSize = 2048;
      const scale = Math.min(1, maxSize / Math.max(width, height));

      return {
        width: Math.floor(width * scale),
        height: Math.floor(height * scale),
      };
    };

    // Preservar estado del video antes de recrear render targets
    const videoState = preserveVideoState(currentVideoRef.current);

    const resolution = getOptimalResolution();
    const rtConfig = {
      width: resolution.width,
      height: resolution.height,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      samples: gl.capabilities.isWebGL2 ? 4 : 0,
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

    // Restaurar estado del video después de un breve delay
    if (videoState && currentVideoRef.current) {
      setTimeout(() => {
        restoreVideoState(currentVideoRef.current, videoState);
      }, 50);
    }

    return newRenderTargets;
  }, [size.width, size.height, gl, preserveVideoState, restoreVideoState]);

  // Escenas memoizadas
  const scenes = useMemo(
    () => ({
      scene1: new THREE.Scene(),
      scene2: new THREE.Scene(),
    }),
    []
  );

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

  const material = useMemo(() => new TransitionMaterial(), []);

  // Cargar media optimizado con preservación de estado del video
  useEffect(() => {
    let isCancelled = false;

    const loadMedia = async () => {
      if (!displayedNumber) {
        const defaultTexture = loadImageTexture(DEFAULT_IMAGE, gl);
        if (!isCancelled) {
          setCurrentMedia(defaultTexture);
          setMediaDimensions({ width: 1, height: 1 });
        }
        return;
      }

      const mediaConfig = MEDIA_MAP[displayedNumber];
      if (!mediaConfig) {
        const defaultTexture = loadImageTexture(DEFAULT_IMAGE, gl);
        if (!isCancelled) {
          setCurrentMedia(defaultTexture);
          setMediaDimensions({ width: 1, height: 1 });
        }
        return;
      }

      try {
        const currentVideoState = preserveVideoState(currentVideoRef.current);
        cleanupVideo();

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

            // Si había un video anterior, restaurar algunos aspectos del estado
            if (currentVideoState && !currentVideoState.paused) {
              video.play().catch(console.error);
            }
          }
        } else {
          // Para imágenes, cargar y obtener dimensiones
          const texture = loadImageTexture(mediaConfig.src, gl);
          if (!isCancelled) {
            setCurrentMedia(texture);

            // Intentar obtener dimensiones de la imagen
            if (texture.image) {
              setMediaDimensions({
                width: texture.image.width || 1920,
                height: texture.image.height || 1080,
              });
            } else {
              // Si la imagen no está cargada, usar onLoad
              texture.onLoad = () => {
                if (texture.image && !isCancelled) {
                  setMediaDimensions({
                    width: texture.image.width || 1920,
                    height: texture.image.height || 1080,
                  });
                }
              };
              setMediaDimensions({ width: 1920, height: 1080 }); // Dimensiones por defecto
            }
          }
        }
      } catch (error) {
        console.error("Error cargando media:", error);
        if (!isCancelled) {
          setCurrentMedia(loadImageTexture(DEFAULT_IMAGE, gl));
          setMediaDimensions({ width: 1, height: 1 });
        }
      }
    };

    loadMedia();
    return () => {
      isCancelled = true;
    };
  }, [displayedNumber, gl, cleanupVideo, preserveVideoState]);

  // Configurar escenas optimizado con comportamiento cover
  useEffect(() => {
    const { scene1, scene2 } = scenes;

    // Limpiar escenas
    [scene1, scene2].forEach((scene) => {
      while (scene.children.length > 0) {
        const child = scene.children[0];
        scene.remove(child);
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
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
      const geometry1 = new THREE.PlaneGeometry(
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

    // ESCENA 2: Parallax con comportamiento cover o imagen estática para touch
    if (isTouch) {
      // Para dispositivos touch: una sola imagen estática
      const staticData = parallaxTextures.static;
      const coverDimensions = calculateCoverDimensions(
        staticData.width,
        staticData.height,
        viewport.width,
        viewport.height
      );

      const geometry = new THREE.PlaneGeometry(
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
      // Para touch devices, no necesitamos referencias para parallax
      parallaxPlanesRef.current = {};
    } else {
      // Para dispositivos no-touch: múltiples capas con parallax
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
        // Calcular dimensiones cover con margen para parallax
        const coverDimensions = calculateCoverDimensionsWithParallaxMargin(
          textureData.width,
          textureData.height,
          viewport.width,
          viewport.height,
          parallaxFactor
        );

        const geometry = new THREE.PlaneGeometry(
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

    return () => {
      // Cleanup geometries - ahora cada elemento tiene su propia geometría
      [scene1, scene2].forEach((scene) => {
        scene.children.forEach((child) => {
          if (child.geometry) child.geometry.dispose();
        });
      });
    };
  }, [
    scenes,
    viewport.width,
    viewport.height,
    currentMedia,
    parallaxTextures,
    mediaDimensions,
    isTouch,
  ]);

  // Actualizar displayedNumber
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

    // Actualizar video texture y mantener reproducción
    if (currentVideoRef.current && currentMedia) {
      // Asegurar que el video siga reproduciéndose
      if (
        currentVideoRef.current.paused &&
        currentVideoRef.current.readyState >= 2
      ) {
        currentVideoRef.current.play().catch(console.error);
      }
      currentMedia.needsUpdate = true;
    }

    // Animar progreso
    const targetProgress = isToggled ? 1 : 0;
    progressRef.current += (targetProgress - progressRef.current) * 0.005;

    // Gestionar animación
    const threshold = selectedNumber === null ? 0.3 : 0.3;
    const isCurrentlyAnimating =
      Math.abs(progressRef.current - targetProgress) > threshold;

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

    // Actualizar parallax (solo para dispositivos no-touch)
    const parallaxValues = updateParallax();
    onParallaxUpdate?.({ ...parallaxValues, viewport });

    // Aplicar parallax a planos (solo para dispositivos no-touch)
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

    // Renderizar escenas
    const currentRenderTarget = gl.getRenderTarget();
    const currentClearColor = new THREE.Color();
    gl.getClearColor(currentClearColor);
    const currentClearAlpha = gl.getClearAlpha();

    // Renderizar escena 1
    gl.setRenderTarget(renderTargets.rt1);
    gl.setClearColor("#000000", 1);
    gl.clear(true, true, true);
    gl.render(scenes.scene1, camera);

    // Renderizar escena 2
    gl.setRenderTarget(renderTargets.rt2);
    gl.setClearColor("#000000", 1);
    gl.clear(true, true, true);
    gl.render(scenes.scene2, camera);

    // Restaurar estado
    gl.setRenderTarget(currentRenderTarget);
    gl.setClearColor(currentClearColor, currentClearAlpha);

    // Actualizar material
    Object.assign(material, {
      uTexture1: renderTargets.rt1.texture,
      uTexture2: renderTargets.rt2.texture,
      uProgress: progressRef.current,
      uTime: time,
    });
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
