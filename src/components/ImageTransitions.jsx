import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

// Mapeo de números a videos/imágenes para la escena 1
const MEDIA_MAP = {
  1: { type: "image", src: "cloud.jpg" },
  2: { type: "video", src: "Rain_v01.mp4" },
  3: { type: "image", src: "ground.jpg" },
  4: { type: "video", src: "Sea_v01.mp4" },
  5: { type: "image", src: "evaporation.jpg" },
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

// Función optimizada para videos
function createVideoTexture(videoSrc, gl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    Object.assign(video, {
      src: videoSrc,
      crossOrigin: "anonymous",
      loop: true,
      muted: true,
      playsInline: true,
    });

    const onLoadedData = () => {
      const texture = new THREE.VideoTexture(video);
      configureTexture(texture, gl);
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;

      video.play().catch(console.error);
      resolve({ texture, video });
    };

    const onError = (e) => {
      console.error("Error loading video:", e);
      reject(e);
    };

    video.addEventListener("loadeddata", onLoadedData, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.load();
  });
}

// Hook de parallax optimizado
function useParallax() {
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = -((e.clientY / window.innerHeight) * 2 - 1);
      targetPosition.current = { x: normalizedX, y: normalizedY };
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const updateParallax = useCallback(() => {
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
  }, []);

  return { updateParallax };
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
  const { gl, viewport, size } = useThree();

  // Referencias optimizadas
  const meshRef = useRef();
  const wasAnimatingRef = useRef(false);
  const currentVideoRef = useRef(null);
  const parallaxPlanesRef = useRef({});
  const progressRef = useRef(0);

  const { updateParallax } = useParallax();

  // Cleanup de video optimizado
  const cleanupVideo = useCallback(() => {
    if (currentVideoRef.current) {
      currentVideoRef.current.pause();
      currentVideoRef.current.src = "";
      currentVideoRef.current = null;
    }
  }, []);

  // Texturas del parallax memoizadas
  const parallaxTextures = useMemo(
    () => ({
      bg: loadImageTexture("BG_v01.png", gl),
      clouds: loadImageTexture("Clouds_v01.png", gl),
      island: loadImageTexture("Island_v01.png", gl),
    }),
    [gl]
  );

  // Render targets optimizados
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

    return { rt1, rt2 };
  }, [size.width, size.height, gl]);

  // Escenas y cámara memoizadas
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

  // Cargar media optimizado
  useEffect(() => {
    let isCancelled = false;

    const loadMedia = async () => {
      if (!displayedNumber) {
        setCurrentMedia(loadImageTexture(DEFAULT_IMAGE, gl));
        return;
      }

      const mediaConfig = MEDIA_MAP[displayedNumber];
      if (!mediaConfig) {
        setCurrentMedia(loadImageTexture(DEFAULT_IMAGE, gl));
        return;
      }

      try {
        cleanupVideo();

        if (mediaConfig.type === "video") {
          const { texture, video } = await createVideoTexture(
            mediaConfig.src,
            gl
          );
          if (!isCancelled) {
            currentVideoRef.current = video;
            setCurrentMedia(texture);
          }
        } else {
          if (!isCancelled) {
            setCurrentMedia(loadImageTexture(mediaConfig.src, gl));
          }
        }
      } catch (error) {
        console.error("Error cargando media:", error);
        if (!isCancelled) {
          setCurrentMedia(loadImageTexture(DEFAULT_IMAGE, gl));
        }
      }
    };

    loadMedia();
    return () => {
      isCancelled = true;
    };
  }, [displayedNumber, gl, cleanupVideo]);

  // Configurar escenas optimizado
  useEffect(() => {
    const { scene1, scene2 } = scenes;

    // Limpiar escenas
    [scene1, scene2].forEach((scene) => {
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    });

    const planeWidth = viewport.width;
    const planeHeight = viewport.height;
    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);

    // ESCENA 1: Media
    if (currentMedia) {
      const material1 = new THREE.MeshBasicMaterial({
        map: currentMedia,
        transparent: false,
      });
      scene1.add(new THREE.Mesh(geometry, material1));
    }

    // ESCENA 2: Parallax
    const parallaxLayers = [
      { texture: parallaxTextures.bg, z: -0.1, ref: "bg" },
      { texture: parallaxTextures.clouds, z: 0, ref: "clouds" },
      { texture: parallaxTextures.island, z: 0.1, ref: "island" },
    ];

    parallaxLayers.forEach(({ texture, z, ref }) => {
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const plane = new THREE.Mesh(geometry.clone(), material);
      plane.position.z = z;
      scene2.add(plane);
      parallaxPlanesRef.current[ref] = plane;
    });

    return () => {
      geometry.dispose();
    };
  }, [scenes, viewport.width, viewport.height, currentMedia, parallaxTextures]);

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
      renderTargets.rt1.dispose();
      renderTargets.rt2.dispose();
    };
  }, [cleanupVideo, renderTargets]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Actualizar video texture
    if (currentVideoRef.current && currentMedia) {
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

    // Actualizar parallax
    const parallaxValues = updateParallax();
    onParallaxUpdate?.({ ...parallaxValues, viewport });

    // Aplicar parallax a planos
    const parallaxFactors = { bg: 0.01, clouds: 0.02, island: 0.05 };
    Object.entries(parallaxFactors).forEach(([ref, factor]) => {
      const plane = parallaxPlanesRef.current[ref];
      if (plane) {
        plane.position.x = parallaxValues.x * factor * viewport.width;
        plane.position.y = parallaxValues.y * factor * viewport.height;
      }
    });

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
