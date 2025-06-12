// src/providers/GlobalMouseProvider.jsx
import { createContext, useCallback, useRef, useEffect, useMemo } from "react";

// Contexto global para mouse
export const GlobalMouseContext = createContext();

export function GlobalMouseProvider({ children }) {
  // Referencias optimizadas
  const lastUpdateTime = useRef(0);
  const rafId = useRef(null);
  const isPageVisible = useRef(true);
  const subscribers = useRef(new Set());

  // Estado actual del mouse (solo actualizado via RAF)
  const mouseState = useRef({
    x: -100,
    y: -100,
    normalizedX: 0,
    normalizedY: 0,
    isMoving: false,
  });

  // Optimización: Pausar cuando página no está visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;
      if (document.hidden && rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Función para notificar a todos los suscriptores
  const notifySubscribers = useCallback((mouseData) => {
    subscribers.current.forEach((callback) => {
      try {
        callback(mouseData);
      } catch (error) {
        console.warn("Error in mouse subscriber:", error);
      }
    });
  }, []);

  // ÚNICO listener de mousemove optimizado
  const handleGlobalMouseMove = useCallback(
    (event) => {
      // Verificar si página está visible
      if (!isPageVisible.current) return;

      const now = performance.now();

      // Throttling inteligente: más frecuente si hay suscriptores activos
      const throttleTime = subscribers.current.size > 0 ? 8 : 16;

      if (now - lastUpdateTime.current < throttleTime) {
        return; // Skip this event
      }

      // ✅ CANCELAR RAF ANTERIOR OBLIGATORIAMENTE
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      // Programar actualización en el siguiente frame
      rafId.current = requestAnimationFrame(() => {
        // ✅ VERIFICAR QUE EL RAF NO FUE CANCELADO
        if (rafId.current === null) return;

        const x = event.clientX;
        const y = event.clientY;

        // Calcular coordenadas normalizadas UNA SOLA VEZ
        const normalizedX = (x / window.innerWidth) * 2 - 1;
        const normalizedY = -((y / window.innerHeight) * 2 - 1);

        // Actualizar estado
        mouseState.current = {
          x,
          y,
          normalizedX,
          normalizedY,
          isMoving: true,
        };

        // Notificar a todos los suscriptores
        notifySubscribers({
          x,
          y,
          normalizedX,
          normalizedY,
          isMoving: true,
        });

        lastUpdateTime.current = performance.now();
        rafId.current = null; // ✅ MARCAR COMO COMPLETADO
      });
    },
    [notifySubscribers]
  );

  // Suscribirse a actualizaciones de mouse
  const subscribe = useCallback((callback) => {
    subscribers.current.add(callback);

    // Enviar estado actual inmediatamente
    callback(mouseState.current);

    // Retornar función de cleanup
    return () => {
      subscribers.current.delete(callback);
    };
  }, []);

  // Obtener estado actual del mouse
  const getCurrentMouseState = useCallback(() => {
    return mouseState.current;
  }, []);

  // Configurar listener global
  useEffect(() => {
    window.addEventListener("mousemove", handleGlobalMouseMove, {
      passive: true,
      capture: false,
    });

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleGlobalMouseMove]);

  // Manejar cuando el mouse sale de la ventana
  useEffect(() => {
    const handleMouseLeave = () => {
      mouseState.current = {
        ...mouseState.current,
        isMoving: false,
      };

      notifySubscribers({
        ...mouseState.current,
        isMoving: false,
      });
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [notifySubscribers]);

  // Context value memoizado
  const contextValue = useMemo(
    () => ({
      subscribe,
      getCurrentMouseState,
      // Stats para debugging
      getStats: () => ({
        subscriberCount: subscribers.current.size,
        isPageVisible: isPageVisible.current,
        hasPendingRAF: rafId.current !== null,
      }),
    }),
    [subscribe, getCurrentMouseState]
  );

  return (
    <GlobalMouseContext.Provider value={contextValue}>
      {children}
    </GlobalMouseContext.Provider>
  );
}
