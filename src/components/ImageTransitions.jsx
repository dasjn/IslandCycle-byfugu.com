import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useDevice } from "../hooks/useDevice";
import { useParallaxMouse } from "../hooks/useGlobalMouse";
import {
  calculateCoverDimensions,
  calculateCoverDimensionsWithParallaxMargin,
  createVideoTexture,
  DEFAULT_IMAGE,
  getGeometry,
  loadImageTexture,
  MEDIA_MAP,
  optimizedRenderScenes,
  textureCache,
  TransitionMaterial,
  updateMaterialUniforms,
} from "../utils/helpers";

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
