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

function loadImageTexture(imagePath) {
  const loader = new THREE.TextureLoader();
  const texture = loader.load(imagePath);

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  return texture;
}

function createVideoTexture(videoSrc) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = videoSrc;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true; // Necesario para autoplay en navegadores modernos
    video.playsInline = true;

    video.addEventListener("loadeddata", () => {
      const texture = new THREE.VideoTexture(video);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      texture.generateMipmaps = false;

      // Iniciar reproducción
      video.play().catch(console.error);

      resolve({ texture, video });
    });

    video.addEventListener("error", (e) => {
      console.error("Error loading video:", e);
      reject(e);
    });

    video.load();
  });
}

function useParallax() {
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const normalizedX = (clientX / innerWidth) * 2 - 1;
      const normalizedY = -((clientY / innerHeight) * 2 - 1);

      targetPosition.current = { x: normalizedX, y: normalizedY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const updateParallax = () => {
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
  };

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
  const meshRef = useRef();
  const wasAnimatingRef = useRef(false);
  const previousProgressRef = useRef(0);
  const { updateParallax } = useParallax();

  // Referencias para los planos de parallax
  const plane2Ref = useRef();
  const plane3Ref = useRef();
  const plane4Ref = useRef();

  // Referencia para almacenar el video actual
  const currentVideoRef = useRef(null);

  // Crear render targets con calidad mejorada
  const [renderTargets, setRenderTargets] = useState(null);

  // Función para configurar texturas de manera consistente
  const configureTexture = useCallback(
    (texture) => {
      texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
      return texture;
    },
    [gl]
  );

  // Memoizar las texturas del parallax que nunca cambian
  const parallaxTextures = useMemo(
    () => ({
      bg: configureTexture(loadImageTexture("BG_v01.png")),
      clouds: configureTexture(loadImageTexture("Clouds_v01.png")),
      island: configureTexture(loadImageTexture("Island_v01.png")),
    }),
    [configureTexture]
  );

  // Cargar media (video o imagen) según el número seleccionado
  useEffect(() => {
    let isCancelled = false;

    const loadMedia = async () => {
      if (displayedNumber && MEDIA_MAP[displayedNumber]) {
        const mediaConfig = MEDIA_MAP[displayedNumber];

        try {
          // Limpiar video anterior si existe
          if (currentVideoRef.current) {
            currentVideoRef.current.pause();
            currentVideoRef.current.src = "";
            currentVideoRef.current = null;
          }

          if (mediaConfig.type === "video") {
            console.log("Cargando video:", mediaConfig.src);
            const { texture, video } = await createVideoTexture(
              mediaConfig.src
            );

            if (!isCancelled) {
              currentVideoRef.current = video;
              setCurrentMedia(configureTexture(texture));
            }
          } else if (mediaConfig.type === "image") {
            console.log("Cargando imagen:", mediaConfig.src);
            const texture = loadImageTexture(mediaConfig.src);

            if (!isCancelled) {
              setCurrentMedia(configureTexture(texture));
            }
          }
        } catch (error) {
          console.error("Error cargando media:", error);
          // Fallback a una imagen por defecto
          if (!isCancelled) {
            const fallbackTexture = loadImageTexture("cloud.jpg");
            setCurrentMedia(configureTexture(fallbackTexture));
          }
        }
      } else {
        // Sin número seleccionado, usar imagen por defecto
        const defaultTexture = loadImageTexture("cloud.jpg");
        setCurrentMedia(configureTexture(defaultTexture));
      }
    };

    loadMedia();

    return () => {
      isCancelled = true;
    };
  }, [displayedNumber, configureTexture]);

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      if (currentVideoRef.current) {
        currentVideoRef.current.pause();
        currentVideoRef.current.src = "";
        currentVideoRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
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

    rt1.texture.generateMipmaps = false;
    rt2.texture.generateMipmaps = false;
    rt1.texture.flipY = false;
    rt2.texture.flipY = false;

    setRenderTargets({ rt1, rt2 });

    return () => {
      rt1.dispose();
      rt2.dispose();
    };
  }, [size.width, size.height, gl]);

  // Escenas y cámaras
  const scene1 = useMemo(() => new THREE.Scene(), []);
  const scene2 = useMemo(() => new THREE.Scene(), []);

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

  useEffect(() => {
    camera.left = -viewport.width / 2;
    camera.right = viewport.width / 2;
    camera.top = viewport.height / 2;
    camera.bottom = -viewport.height / 2;
    camera.updateProjectionMatrix();
  }, [camera, viewport.width, viewport.height]);

  const material = useMemo(() => new TransitionMaterial(), []);
  const progress = useRef(0);
  const targetProgress = isToggled ? 1 : 0;

  // Crear contenido de las escenas
  useEffect(() => {
    // Limpiar escenas anteriores
    while (scene1.children.length > 0) {
      scene1.remove(scene1.children[0]);
    }
    while (scene2.children.length > 0) {
      scene2.remove(scene2.children[0]);
    }

    const planeWidth = viewport.width;
    const planeHeight = viewport.height;

    // ESCENA 1: Media (video o imagen) según el número mostrado
    if (currentMedia) {
      const planeGeometry1 = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const planeMaterial1 = new THREE.MeshBasicMaterial({
        map: currentMedia,
        transparent: false,
      });
      const plane1 = new THREE.Mesh(planeGeometry1, planeMaterial1);
      scene1.add(plane1);
    }

    // ESCENA 2: Parallax (mismo código que antes)
    const planeGeometry2 = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const planeMaterial2 = new THREE.MeshBasicMaterial({
      map: parallaxTextures.bg,
      transparent: true,
    });
    const plane2 = new THREE.Mesh(planeGeometry2, planeMaterial2);
    plane2.position.z = -0.1;
    scene2.add(plane2);
    plane2Ref.current = plane2;

    const planeGeometry3 = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const planeMaterial3 = new THREE.MeshBasicMaterial({
      map: parallaxTextures.clouds,
      transparent: true,
    });
    const plane3 = new THREE.Mesh(planeGeometry3, planeMaterial3);
    plane3.position.z = 0;
    scene2.add(plane3);
    plane3Ref.current = plane3;

    const planeGeometry4 = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const planeMaterial4 = new THREE.MeshBasicMaterial({
      map: parallaxTextures.island,
      transparent: true,
    });
    const plane4 = new THREE.Mesh(planeGeometry4, planeMaterial4);
    plane4.position.z = 0.1;
    scene2.add(plane4);
    plane4Ref.current = plane4;
  }, [
    scene1,
    scene2,
    viewport.width,
    viewport.height,
    currentMedia,
    parallaxTextures,
  ]);

  // Actualizar displayedNumber cuando selectedNumber cambia de null a número
  useEffect(() => {
    if (selectedNumber !== null) {
      setDisplayedNumber(selectedNumber);
    }
  }, [selectedNumber]);

  useFrame((state) => {
    if (!renderTargets) return;

    const time = state.clock.elapsedTime;

    // Actualizar textura de video si existe
    if (currentVideoRef.current && currentMedia) {
      currentMedia.needsUpdate = true;
    }

    // Animar progreso de transición
    const speed = 0.005;
    progress.current += (targetProgress - progress.current) * speed;

    let isCurrentlyAnimating;

    if (selectedNumber === null) {
      isCurrentlyAnimating = Math.abs(progress.current - targetProgress) > 0.3;
    } else {
      isCurrentlyAnimating = Math.abs(progress.current - targetProgress) > 0.1;
    }

    if (wasAnimatingRef.current !== isCurrentlyAnimating) {
      wasAnimatingRef.current = isCurrentlyAnimating;
      if (onAnimationChange) {
        onAnimationChange(isCurrentlyAnimating);
      }
    }

    // Manejar el cambio de displayedNumber al volver al parallax
    if (selectedNumber === null && displayedNumber !== null) {
      if (Math.abs(progress.current - 0) < 0.05) {
        setDisplayedNumber(null);
      }
    }

    // Actualizar el parallax
    const parallaxValues = updateParallax();

    if (onParallaxUpdate) {
      onParallaxUpdate({
        ...parallaxValues,
        viewport,
      });
    }

    // Aplicar parallax a los planos de la ESCENA 2
    if (plane2Ref.current) {
      plane2Ref.current.position.x = parallaxValues.x * 0.01 * viewport.width;
      plane2Ref.current.position.y = parallaxValues.y * 0.01 * viewport.height;
    }

    if (plane3Ref.current) {
      plane3Ref.current.position.x = parallaxValues.x * 0.02 * viewport.width;
      plane3Ref.current.position.y = parallaxValues.y * 0.02 * viewport.height;
    }

    if (plane4Ref.current) {
      plane4Ref.current.position.x = parallaxValues.x * 0.05 * viewport.width;
      plane4Ref.current.position.y = parallaxValues.y * 0.05 * viewport.height;
    }

    const currentRenderTarget = gl.getRenderTarget();
    const currentClearColor = new THREE.Color();
    gl.getClearColor(currentClearColor);
    const currentClearAlpha = gl.getClearAlpha();

    // Renderizar escena 1 (video/imagen) en rt1
    gl.setRenderTarget(renderTargets.rt1);
    gl.setClearColor("#000000", 1);
    gl.clear(true, true, true);
    gl.render(scene1, camera);

    // Renderizar escena 2 (parallax) en rt2
    gl.setRenderTarget(renderTargets.rt2);
    gl.setClearColor("#000000", 1);
    gl.clear(true, true, true);
    gl.render(scene2, camera);

    // Restaurar configuraciones anteriores
    gl.setRenderTarget(currentRenderTarget);
    gl.setClearColor(currentClearColor, currentClearAlpha);

    // Actualizar material de transición
    material.uTexture1 = renderTargets.rt1.texture;
    material.uTexture2 = renderTargets.rt2.texture;
    material.uProgress = progress.current;
    material.uTime = time;
  });

  if (!renderTargets) return null;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
