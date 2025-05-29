import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

// Mapeo de números a imágenes para la escena 1
const IMAGE_MAP = {
  1: "cloud.jpg", // CLOUD
  2: "rain.jpg", // RAIN
  3: "ground.jpg", // GROUND
  4: "sea.jpg", // SEA
  5: "evaporation.jpg", // EVAPORATION
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

function useParallax() {
  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Normalizar las coordenadas del mouse (-1 a 1)
      const normalizedX = (clientX / innerWidth) * 2 - 1;
      const normalizedY = -((clientY / innerHeight) * 2 - 1);

      targetPosition.current = { x: normalizedX, y: normalizedY };
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const updateParallax = () => {
    // Suavizar el movimiento con lerp
    const lerp = (start, end, factor) => start + (end - start) * factor;
    const smoothFactor = 0.02; // Ajusta la suavidad del movimiento

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
  const { gl, viewport, size } = useThree();
  const meshRef = useRef();
  const wasAnimatingRef = useRef(false);
  const previousProgressRef = useRef(0);
  const { updateParallax } = useParallax();

  // Referencias para los planos de parallax
  const plane2Ref = useRef();
  const plane3Ref = useRef();
  const plane4Ref = useRef();

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

  useEffect(() => {
    // Calcular resolución óptima basada en el canvas
    const getOptimalResolution = () => {
      const pixelRatio = gl.getPixelRatio();
      const width = Math.floor(size.width * pixelRatio);
      const height = Math.floor(size.height * pixelRatio);

      // Límite máximo para evitar problemas de rendimiento
      const maxSize = 2048;
      const scale = Math.min(1, maxSize / Math.max(width, height));

      return {
        width: Math.floor(width * scale),
        height: Math.floor(height * scale),
      };
    };

    const resolution = getOptimalResolution();

    // Configuración de render target con calidad óptima
    const rtConfig = {
      width: resolution.width,
      height: resolution.height,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      samples: gl.capabilities.isWebGL2 ? 4 : 0, // MSAA antialiasing
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

    // Configurar las texturas para máxima calidad
    rt1.texture.generateMipmaps = false;
    rt2.texture.generateMipmaps = false;
    rt1.texture.flipY = false;
    rt2.texture.flipY = false;

    setRenderTargets({ rt1, rt2 });

    console.log("Render targets creados con resolución:", resolution);

    // Cleanup
    return () => {
      rt1.dispose();
      rt2.dispose();
    };
  }, [size.width, size.height, gl]);

  // Escenas y cámaras
  const scene1 = useMemo(() => new THREE.Scene(), []);
  const scene2 = useMemo(() => new THREE.Scene(), []);

  // Cámara ortográfica configurada para pantalla completa
  const camera = useMemo(() => {
    const cam = new THREE.OrthographicCamera(
      -viewport.width / 2, // left
      viewport.width / 2, // right
      viewport.height / 2, // top
      -viewport.height / 2, // bottom
      0.1, // near
      1000 // far
    );
    cam.position.z = 1;
    return cam;
  }, [viewport.width, viewport.height]);

  // Actualizar cámara cuando cambie el viewport
  useEffect(() => {
    camera.left = -viewport.width / 2;
    camera.right = viewport.width / 2;
    camera.top = viewport.height / 2;
    camera.bottom = -viewport.height / 2;
    camera.updateProjectionMatrix();
  }, [camera, viewport.width, viewport.height]);

  // Material de transición
  const material = useMemo(() => new TransitionMaterial(), []);

  // Referencias para animación
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

    // Calcular dimensiones para pantalla completa
    const planeWidth = viewport.width;
    const planeHeight = viewport.height;

    // ESCENA 1: Imagen específica según el número mostrado
    let texture1Path = "cloud.jpg";
    if (displayedNumber && IMAGE_MAP[displayedNumber]) {
      texture1Path = IMAGE_MAP[displayedNumber];
    }

    const texture1 = configureTexture(loadImageTexture(texture1Path));
    const planeGeometry1 = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const planeMaterial1 = new THREE.MeshBasicMaterial({
      map: texture1,
      transparent: false,
    });
    const plane1 = new THREE.Mesh(planeGeometry1, planeMaterial1);
    scene1.add(plane1);

    // ESCENA 2: Siempre el parallax (usando texturas memoizadas)
    const planeGeometry2 = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const planeMaterial2 = new THREE.MeshBasicMaterial({
      map: parallaxTextures.bg,
      transparent: true,
    });
    const plane2 = new THREE.Mesh(planeGeometry2, planeMaterial2);
    plane2.position.z = -0.1; // Fondo
    scene2.add(plane2);
    plane2Ref.current = plane2;

    const planeGeometry3 = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const planeMaterial3 = new THREE.MeshBasicMaterial({
      map: parallaxTextures.clouds,
      transparent: true,
    });
    const plane3 = new THREE.Mesh(planeGeometry3, planeMaterial3);
    plane3.position.z = 0; // Medio
    scene2.add(plane3);
    plane3Ref.current = plane3;

    const planeGeometry4 = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const planeMaterial4 = new THREE.MeshBasicMaterial({
      map: parallaxTextures.island,
      transparent: true,
    });
    const plane4 = new THREE.Mesh(planeGeometry4, planeMaterial4);
    plane4.position.z = 0.1; // Frente
    scene2.add(plane4);
    plane4Ref.current = plane4;

    console.log("Escenas actualizadas:");
    console.log("- Escena 1 (imagen específica):", texture1Path);
    console.log("- Escena 2 (parallax): BG + Clouds + Island");
  }, [
    scene1,
    scene2,
    gl,
    viewport.width,
    viewport.height,
    displayedNumber,
    parallaxTextures,
    configureTexture,
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

    // Animar progreso de transición
    const speed = 0.005;
    progress.current += (targetProgress - progress.current) * speed;

    let isCurrentlyAnimating;

    if (selectedNumber === null) {
      // Yendo hacia parallax: usar umbral más estricto para evitar popeo
      isCurrentlyAnimating = Math.abs(progress.current - targetProgress) > 0.3;
    } else {
      // Yendo hacia imagen específica: usar umbral más laxo para respuesta rápida
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

    // Comunicar los valores del parallax al componente padre
    if (onParallaxUpdate) {
      onParallaxUpdate({
        ...parallaxValues,
        viewport,
      });
    }

    // Aplicar diferentes intensidades de parallax a cada plano de la ESCENA 2
    if (plane2Ref.current) {
      // Plano de fondo - movimiento sutil (intensidad 1%)
      plane2Ref.current.position.x = parallaxValues.x * 0.01 * viewport.width;
      plane2Ref.current.position.y = parallaxValues.y * 0.01 * viewport.height;
    }

    if (plane3Ref.current) {
      // Plano medio - movimiento moderado (intensidad 2%)
      plane3Ref.current.position.x = parallaxValues.x * 0.02 * viewport.width;
      plane3Ref.current.position.y = parallaxValues.y * 0.02 * viewport.height;
    }

    if (plane4Ref.current) {
      // Plano frente - movimiento más pronunciado (intensidad 5%)
      plane4Ref.current.position.x = parallaxValues.x * 0.05 * viewport.width;
      plane4Ref.current.position.y = parallaxValues.y * 0.05 * viewport.height;
    }

    const currentRenderTarget = gl.getRenderTarget();
    const currentClearColor = new THREE.Color();
    gl.getClearColor(currentClearColor);
    const currentClearAlpha = gl.getClearAlpha();

    // Renderizar escena 1 (imagen específica) en rt1
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
    // uTexture1 = imagen específica, uTexture2 = parallax
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
