// src/hooks/useGlobalMouse.jsx
import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { GlobalMouseContext } from "../providers/GlobalMouseProvider";

/**
 * Hook para suscribirse a eventos globales de mouse de manera optimizada
 *
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.enabled - Si está activo (default: true)
 * @param {number} options.throttle - Throttling adicional en ms (default: 0)
 * @param {boolean} options.normalized - Si necesita coordenadas normalizadas (default: true)
 * @param {boolean} options.raw - Si necesita coordenadas raw (default: true)
 *
 * @returns {Object} Estado del mouse y funciones de utilidad
 */
export function useGlobalMouse(options = {}) {
  const {
    enabled = true,
    throttle = 0,
    normalized = true,
    raw = true,
  } = options;

  const context = useContext(GlobalMouseContext);
  if (!context) {
    throw new Error("useGlobalMouse must be used within GlobalMouseProvider");
  }

  const { subscribe, getCurrentMouseState } = context;

  // Estado local del mouse
  const [mouseState, setMouseState] = useState(() => getCurrentMouseState());

  // Referencias para throttling local adicional
  const lastUpdateTime = useRef(0);
  const pendingUpdate = useRef(null);

  // Callback con throttling opcional
  const handleMouseUpdate = useCallback(
    (newMouseState) => {
      if (!enabled) return;

      const now = performance.now();

      // Aplicar throttling adicional si se especifica
      if (throttle > 0 && now - lastUpdateTime.current < throttle) {
        // Guardar update pendiente
        pendingUpdate.current = newMouseState;
        return;
      }

      // Filtrar datos según las opciones
      const filteredState = {};

      if (raw) {
        filteredState.x = newMouseState.x;
        filteredState.y = newMouseState.y;
      }

      if (normalized) {
        filteredState.normalizedX = newMouseState.normalizedX;
        filteredState.normalizedY = newMouseState.normalizedY;
      }

      filteredState.isMoving = newMouseState.isMoving;

      setMouseState(filteredState);
      lastUpdateTime.current = now;
      pendingUpdate.current = null;
    },
    [enabled, throttle, raw, normalized]
  );

  // Procesar updates pendientes
  useEffect(() => {
    if (!enabled || throttle === 0) return;

    const interval = setInterval(() => {
      if (pendingUpdate.current) {
        handleMouseUpdate(pendingUpdate.current);
      }
    }, throttle);

    return () => clearInterval(interval);
  }, [enabled, throttle, handleMouseUpdate]);

  // Suscribirse al mouse global
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribe(handleMouseUpdate);
    return unsubscribe;
  }, [enabled, subscribe, handleMouseUpdate]);

  return mouseState;
}

/**
 * Hook específico para parallax (reemplaza useParallax en ImageTransitions)
 */
export function useParallaxMouse(enabled = true) {
  const mouseState = useGlobalMouse({
    enabled,
    throttle: 16, // ~60fps
    normalized: true,
    raw: false,
  });

  // ✅ APLICAR SUAVIZADO SIN RAF - USAR DIRECTAMENTE EL ESTADO
  const smoothPosition = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const rafId = useRef(null); // ✅ TRACKING DE RAF

  useEffect(() => {
    // ✅ LIMPIAR RAF ANTERIOR
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    if (!enabled) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    const lerp = (start, end, factor) => start + (end - start) * factor;
    const smoothFactor = 0.02;

    const animate = () => {
      const targetX = mouseState.normalizedX || 0;
      const targetY = mouseState.normalizedY || 0;

      smoothPosition.current.x = lerp(
        smoothPosition.current.x,
        targetX,
        smoothFactor
      );
      smoothPosition.current.y = lerp(
        smoothPosition.current.y,
        targetY,
        smoothFactor
      );

      setPosition({ ...smoothPosition.current });

      // ✅ CONTINUAR SOLO SI HAY DIFERENCIA SIGNIFICATIVA
      const diffX = Math.abs(smoothPosition.current.x - targetX);
      const diffY = Math.abs(smoothPosition.current.y - targetY);

      if ((diffX > 0.001 || diffY > 0.001) && enabled) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        rafId.current = null; // ✅ MARCAR COMO TERMINADO
      }
    };

    // ✅ INICIAR ANIMACIÓN SOLO SI ES NECESARIO
    if (
      mouseState.isMoving ||
      Math.abs(smoothPosition.current.x) > 0.001 ||
      Math.abs(smoothPosition.current.y) > 0.001
    ) {
      rafId.current = requestAnimationFrame(animate);
    }

    // ✅ CLEANUP OBLIGATORIO
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [
    enabled,
    mouseState.normalizedX,
    mouseState.normalizedY,
    mouseState.isMoving,
  ]);

  // ✅ CLEANUP AL DESMONTAR
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, []);

  return position;
}

/**
 * Hook específico para cursor magnético (reemplaza MagneticCursorProvider)
 */
export function useMagneticCursor() {
  const mouseState = useGlobalMouse({
    enabled: true,
    throttle: 4, // Más responsive para cursor
    raw: true,
    normalized: false,
  });

  const [hoveredElement, setHoveredElement] = useState(null);

  return {
    mousePosition: {
      x: mouseState.x || -100,
      y: mouseState.y || -100,
    },
    hoveredElement,
    setHoveredElement,
  };
}
