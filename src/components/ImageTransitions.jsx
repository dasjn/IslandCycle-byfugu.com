import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useDevice } from "../hooks/useDevice";
import { useParallaxMouse } from "../hooks/useGlobalMouse";
import {
  calculateCoverDimensions,
  calculateCoverDimensionsWithParallaxMargin,
  createBlackTexture,
  createSmokeVideoTexture,
  createVideoTexture,
  getGeometry,
  loadImageTexture,
  MEDIA_MAP,
  textureCache,
  TransitionMaterial,
} from "../utils/helpers";

export default function ImageTransitions({
  isToggled,
  selectedNumber,
  onParallaxUpdate,
  onAnimationChange,
  getPreloadedAsset,
  debugMode = false,
}) {
  const DEFAULT_IMAGE = null;
  const { isTouch, isMobile, isTablet } = useDevice();
  const [displayedNumber, setDisplayedNumber] = useState(null);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [mediaDimensions, setMediaDimensions] = useState({
    width: 1,
    height: 1,
  });
  const [smokeVideoData, setSmokeVideoData] = useState(null);
  const { gl, viewport, size } = useThree();

  // Referencias optimizadas
  const meshRef = useRef();
  const wasAnimatingRef = useRef(false);
  const currentVideoRef = useRef(null);
  const parallaxPlanesRef = useRef({});
  const progressRef = useRef(0);
  const renderTargetsRef = useRef(null);
  const lastSizeRef = useRef({ width: 0, height: 0 });

  // 🚀 PARALLAX EXACTO DE LA VERSIÓN QUE FUNCIONA
  const lastParallaxValues = useRef({ x: 0, y: 0 });
  const lastRenderTime = useRef(0);
  const needsParallaxUpdate = useRef(false);
  const needsSceneRender = useRef(true);

  const parallaxValues = useParallaxMouse(!isTouch && !debugMode);

  // 🚀 THROTTLING INTELIGENTE DEL PARALLAX (EXACTO DE TU VERSIÓN)
  useEffect(() => {
    if (isTouch) return;

    const deltaX = Math.abs(parallaxValues.x - lastParallaxValues.current.x);
    const deltaY = Math.abs(parallaxValues.y - lastParallaxValues.current.y);

    // Solo actualizar si el cambio es significativo
    if (deltaX > 0.001 || deltaY > 0.001) {
      needsParallaxUpdate.current = true;
      needsSceneRender.current = true;
      lastParallaxValues.current = { ...parallaxValues };
    }
  }, [parallaxValues.x, parallaxValues.y, isTouch, parallaxValues]); // ✅ DEPENDENCY ARRAY EXACTO

  // Cleanup de video mejorado
  const cleanupVideo = useCallback(() => {
    if (currentVideoRef.current) {
      const video = currentVideoRef.current;
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
      } catch (error) {
        console.warn("Error cleaning up video:", error);
      }
      currentVideoRef.current = null;
    }
    setIsVideoReady(false);
  }, []);

  // Texturas del parallax memoizadas
  const parallaxTextures = useMemo(() => {
    if (isTouch) {
      const staticTexture = loadImageTexture(
        "TheIslandCycle_All_v05.webp",
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
        texture: loadImageTexture("Island_v04.webp", gl, getPreloadedAsset),
        width: 1920,
        height: 1080,
      },
    };

    return textures;
  }, [gl, isTouch, getPreloadedAsset]);

  // Cargar video de humo
  useEffect(() => {
    let isCancelled = false;

    const loadSmokeVideo = async () => {
      console.log("🔄 Iniciando carga de video de humo...");

      const smokeData = await createSmokeVideoTexture(gl, getPreloadedAsset);

      if (!isCancelled && smokeData) {
        console.log("✅ Video de humo configurado exitosamente");
        setSmokeVideoData(smokeData);
      } else if (!smokeData) {
        console.log("⚠️ No se pudo cargar el video de humo");
      }
    };

    loadSmokeVideo();

    return () => {
      isCancelled = true;
      console.log("🧹 Limpiando carga de video de humo");
    };
  }, [gl, getPreloadedAsset]);

  // Render targets optimizados (EXACTO DE TU VERSIÓN)
  const renderTargets = useMemo(() => {
    const sizeChanged =
      Math.abs(size.width - lastSizeRef.current.width) > 50 ||
      Math.abs(size.height - lastSizeRef.current.height) > 50;

    if (!sizeChanged && renderTargetsRef.current) {
      return renderTargetsRef.current;
    }

    lastSizeRef.current = { width: size.width, height: size.height };

    const getOptimalResolution = () => {
      const pixelRatio = Math.min(gl.getPixelRatio(), 2);
      const width = Math.floor(size.width * pixelRatio);
      const height = Math.floor(size.height * pixelRatio);

      let maxSize = 1536;
      if (isMobile) {
        maxSize = 1024;
      } else if (isTablet) {
        maxSize = 1280;
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
      samples: 0,
      colorSpace: THREE.NoColorSpace,
    };

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
    needsSceneRender.current = true; // Forzar render cuando se recrean los targets

    return newRenderTargets;
  }, [size.width, size.height, gl, isMobile, isTablet]);

  // Escenas memoizadas
  const scenes = useMemo(
    () => ({
      scene1: new THREE.Scene(),
      scene2: new THREE.Scene(),
    }),
    []
  );

  // Camera memoizada
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

  // Material memoizado
  const material = useMemo(() => new TransitionMaterial(), []);

  // Cargar media optimizado
  useEffect(() => {
    let isCancelled = false;

    const loadMedia = async () => {
      if (!displayedNumber) {
        // ✅ Si hay DEFAULT_IMAGE → cargarla, si no → textura negra
        if (DEFAULT_IMAGE) {
          const defaultTexture = loadImageTexture(
            DEFAULT_IMAGE,
            gl,
            getPreloadedAsset
          );
          if (!isCancelled) {
            setCurrentMedia(defaultTexture);
            setMediaDimensions({ width: 1920, height: 1080 });
            setIsVideoReady(true);
            needsSceneRender.current = true;
          }
        } else {
          // Si DEFAULT_IMAGE es null → crear textura negra
          const blackTexture = createBlackTexture(gl);
          if (!isCancelled) {
            setCurrentMedia(blackTexture);
            setMediaDimensions({ width: 1920, height: 1080 });
            setIsVideoReady(true);
            needsSceneRender.current = true;
          }
        }
        return;
      }

      const mediaConfig = MEDIA_MAP[displayedNumber];
      if (!mediaConfig) {
        // ✅ Si hay DEFAULT_IMAGE → cargarla, si no → textura negra
        if (DEFAULT_IMAGE) {
          const defaultTexture = loadImageTexture(
            DEFAULT_IMAGE,
            gl,
            getPreloadedAsset
          );
          if (!isCancelled) {
            setCurrentMedia(defaultTexture);
            setMediaDimensions({ width: 1920, height: 1080 });
            setIsVideoReady(true);
            needsSceneRender.current = true;
          }
        } else {
          // Si DEFAULT_IMAGE es null → crear textura negra
          const blackTexture = createBlackTexture(gl);
          if (!isCancelled) {
            setCurrentMedia(blackTexture);
            setMediaDimensions({ width: 1920, height: 1080 });
            setIsVideoReady(true);
            needsSceneRender.current = true;
          }
        }
        return;
      }

      try {
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

            const checkVideoReady = () => {
              if (video.readyState >= 2 && video.videoWidth > 0) {
                setIsVideoReady(true);
                needsSceneRender.current = true;
              } else {
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
            setIsVideoReady(true);
            needsSceneRender.current = true;
          }
        }
      } catch (error) {
        console.error("Error cargando media:", error);
        if (!isCancelled) {
          // ✅ En caso de error: Si hay DEFAULT_IMAGE → cargarla, si no → textura negra
          if (DEFAULT_IMAGE) {
            setCurrentMedia(
              loadImageTexture(DEFAULT_IMAGE, gl, getPreloadedAsset)
            );
            setMediaDimensions({ width: 1920, height: 1080 });
            setIsVideoReady(true);
            needsSceneRender.current = true;
          } else {
            // Si DEFAULT_IMAGE es null → crear textura negra
            const blackTexture = createBlackTexture(gl);
            setCurrentMedia(blackTexture);
            setMediaDimensions({ width: 1920, height: 1080 });
            setIsVideoReady(true);
            needsSceneRender.current = true;
          }
        }
      }
    };

    loadMedia();
    return () => {
      isCancelled = true;
    };
  }, [displayedNumber, gl, cleanupVideo, getPreloadedAsset]);

  // Configurar escenas optimizado
  useEffect(() => {
    const { scene1, scene2 } = scenes;

    [scene1, scene2].forEach((scene) => {
      while (scene.children.length > 0) {
        const child = scene.children[0];
        scene.remove(child);
        if (
          child.material &&
          !textureCache.has(child.material.map?.image?.src)
        ) {
          child.material.dispose();
        }
      }
    });

    const coverDimensions = calculateCoverDimensions(
      mediaDimensions.width,
      mediaDimensions.height,
      viewport.width,
      viewport.height
    );

    // ESCENA 1: Media
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
      // Plano estático para touch
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

      // Video de humo encima del plano estático (para touch)
      if (smokeVideoData && smokeVideoData.texture) {
        console.log(
          "🌫️ Añadiendo video de humo encima del plano estático (móvil)"
        );

        const smokeCoverDimensions = calculateCoverDimensions(
          smokeVideoData.width,
          smokeVideoData.height,
          viewport.width,
          viewport.height
        );

        const smokeGeometry = getGeometry(
          smokeCoverDimensions.width,
          smokeCoverDimensions.height
        );

        const smokeMaterial = new THREE.MeshBasicMaterial({
          map: smokeVideoData.texture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          opacity: 0.5,
        });

        const smokePlane = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smokePlane.position.z = 0.1;
        scene2.add(smokePlane);

        parallaxPlanesRef.current = { smoke: smokePlane };
      } else {
        parallaxPlanesRef.current = {};
      }
    } else {
      // Capas de parallax para desktop (EXACTO DE TU VERSIÓN)
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
          parallaxFactor: 0.15,
        },
      ];

      // Añadir video de humo como capa de parallax
      if (smokeVideoData && smokeVideoData.texture) {
        console.log("🌫️ Añadiendo capa de humo al parallax");

        parallaxLayers.push({
          textureData: {
            texture: smokeVideoData.texture,
            width: smokeVideoData.width,
            height: smokeVideoData.height,
          },
          z: 0.2,
          ref: "smoke",
          parallaxFactor: 0.025,
          blendMode: THREE.AdditiveBlending,
          opacity: 0.7,
          transparent: true,
        });
      }

      parallaxLayers.forEach(
        ({
          textureData,
          z,
          ref,
          parallaxFactor,
          blendMode = THREE.NormalBlending,
          opacity = 1,
          transparent = true,
        }) => {
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
            transparent,
            opacity,
            blending: blendMode,
          });

          const plane = new THREE.Mesh(geometry, material);
          plane.position.z = z;
          scene2.add(plane);
          parallaxPlanesRef.current[ref] = plane;
        }
      );
    }

    needsSceneRender.current = true;
  }, [
    scenes,
    viewport.width,
    viewport.height,
    currentMedia,
    parallaxTextures,
    mediaDimensions,
    isTouch,
    isVideoReady,
    smokeVideoData, // ✅ Solo añado esto para el humo
  ]);

  useEffect(() => {
    if (selectedNumber !== null) {
      setDisplayedNumber(selectedNumber);
    }
  }, [selectedNumber]);

  useEffect(() => {
    return () => {
      cleanupVideo();

      if (smokeVideoData && smokeVideoData.video) {
        try {
          const smokeVideo = smokeVideoData.video;
          smokeVideo.pause();
          smokeVideo.removeAttribute("src");
          smokeVideo.load();
        } catch (error) {
          console.warn("Error limpiando video de humo:", error);
        }
      }

      if (renderTargetsRef.current) {
        renderTargetsRef.current.rt1.dispose();
        renderTargetsRef.current.rt2.dispose();
      }
    };
  }, [cleanupVideo, smokeVideoData]);

  // 🚀 RENDERIZADO OPTIMIZADO CONDICIONAL (EXACTO DE TU VERSIÓN)
  const renderScenesOptimized = useCallback(
    (gl, scenes, camera, renderTargets) => {
      const currentRenderTarget = gl.getRenderTarget();
      const currentClearAlpha = gl.getClearAlpha();
      const clearColor = new THREE.Color();
      gl.getClearColor(clearColor);

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

      gl.setRenderTarget(currentRenderTarget);
      gl.setClearColor(clearColor, currentClearAlpha);
    },
    []
  );

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const now = performance.now();

    // ✅ ACTUALIZAR VIDEO TEXTURE PRINCIPAL
    if (currentVideoRef.current && currentMedia && isVideoReady) {
      const video = currentVideoRef.current;
      if (video.readyState >= 2 && !video.ended && video.videoWidth > 0) {
        if (video.paused) {
          video.play().catch(() => {});
        }
        currentMedia.needsUpdate = true;
        // ✅ PEQUEÑA OPTIMIZACIÓN: Solo forzar render cuando video realmente se actualiza
        needsSceneRender.current = true;
      }
    }

    // ✅ ACTUALIZAR VIDEO DE HUMO
    if (smokeVideoData && smokeVideoData.video && smokeVideoData.texture) {
      const smokeVideo = smokeVideoData.video;

      if (
        smokeVideo.readyState >= 2 &&
        !smokeVideo.ended &&
        smokeVideo.videoWidth > 0
      ) {
        if (smokeVideo.paused) {
          smokeVideo.play().catch(() => {});
        }
        // ✅ CAMBIO CLAVE: Actualizar SIEMPRE, no depender del mouse
        smokeVideoData.texture.needsUpdate = true;
        needsSceneRender.current = true;
      }
    }

    // ✅ ANIMACIÓN DE PROGRESO (EXACTO DE TU VERSIÓN)
    const shouldAnimate = !isToggled || (isToggled && isVideoReady);
    let progressChanged = false;

    if (shouldAnimate) {
      const targetProgress = isToggled ? 1 : 0;
      const progressDiff = targetProgress - progressRef.current;
      const transitionSpeed = isTouch ? 0.015 : 0.005;
      const newProgress = progressRef.current + progressDiff * transitionSpeed;

      if (Math.abs(newProgress - progressRef.current) > 0.001) {
        progressRef.current = newProgress;
        progressChanged = true;
        needsSceneRender.current = true;
      }
    }

    // ✅ GESTIÓN DE ANIMACIÓN (EXACTO DE TU VERSIÓN)
    const threshold = 0.3;
    const progressDiff = (isToggled ? 1 : 0) - progressRef.current;
    const isCurrentlyAnimating = Math.abs(progressDiff) > threshold;

    if (wasAnimatingRef.current !== isCurrentlyAnimating) {
      wasAnimatingRef.current = isCurrentlyAnimating;
      onAnimationChange?.(isCurrentlyAnimating);
    }

    if (
      selectedNumber === null &&
      displayedNumber !== null &&
      Math.abs(progressRef.current) < 0.05
    ) {
      setDisplayedNumber(null);
    }

    // 🚀 PARALLAX OPTIMIZADO - SOLO ACTUALIZAR SI ES NECESARIO (EXACTO DE TU VERSIÓN)
    if (!isTouch && needsParallaxUpdate.current) {
      const parallaxFactors = {
        bg: 0.01,
        clouds: 0.02,
        rain: 0.02,
        island: 0.03,
        smoke: 0.025, // ✅ Solo añado el factor de humo
      };

      Object.entries(parallaxFactors).forEach(([ref, factor]) => {
        const plane = parallaxPlanesRef.current[ref];
        if (plane) {
          plane.position.x =
            lastParallaxValues.current.x * factor * viewport.width;
          plane.position.y =
            lastParallaxValues.current.y * factor * viewport.height;
        }
      });

      needsParallaxUpdate.current = false;
    }

    // 🚀 RENDERIZADO CONDICIONAL - SOLO CUANDO SEA NECESARIO (EXACTO DE TU VERSIÓN)
    const shouldRender =
      needsSceneRender.current ||
      progressChanged ||
      isCurrentlyAnimating ||
      now - lastRenderTime.current > 100; // Forzar render cada 100ms mínimo

    if (shouldRender) {
      renderScenesOptimized(gl, scenes, camera, renderTargets);
      lastRenderTime.current = now;
      needsSceneRender.current = false;
    }

    // ✅ ACTUALIZAR UNIFORMS DEL MATERIAL
    const uniforms = material.uniforms;
    uniforms.uTexture1.value = renderTargets.rt1.texture;
    uniforms.uTexture2.value = renderTargets.rt2.texture;
    uniforms.uProgress.value = progressRef.current;
    uniforms.uTime.value = time;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
