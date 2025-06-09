import React, { useEffect, useState, useMemo } from "react";
import { DeviceContext } from "../context/DeviceContext";

// Función para detectar dispositivos táctiles
const detectTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
};

// Función para detectar dispositivos móviles
const detectMobileDevice = () => {
  // Detección por User Agent
  const userAgentMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Detección por tamaño de pantalla (móvil típicamente < 768px)
  const screenSizeMobile = window.innerWidth < 768;

  // Detección por orientación (móviles suelen tener portrait por defecto)
  const orientationMobile =
    window.matchMedia("(orientation: portrait)").matches &&
    window.innerWidth < 1024;

  // Detección por densidad de píxeles (móviles suelen tener alta densidad)
  const highDPI = window.devicePixelRatio > 1.5;

  // Combinamos las detecciones para mayor precisión
  return (
    userAgentMobile || (screenSizeMobile && (orientationMobile || highDPI))
  );
};

// Función para detectar tablets específicamente
const detectTabletDevice = () => {
  const userAgentTablet = /iPad|Android.*(?!.*Mobile)|Tablet/i.test(
    navigator.userAgent
  );
  const screenSizeTablet =
    window.innerWidth >= 768 && window.innerWidth <= 1024;
  const touchTablet = detectTouchDevice() && !detectMobileDevice();

  return userAgentTablet || (screenSizeTablet && touchTablet);
};

// Provider del contexto
export const DeviceProvider = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState(() => ({
    isTouch: detectTouchDevice(),
    isMobile: detectMobileDevice(),
    isTablet: detectTabletDevice(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
  }));

  // Función para actualizar información del dispositivo
  const updateDeviceInfo = useMemo(() => {
    let timeoutId;

    return () => {
      // Debounce para evitar demasiadas actualizaciones durante el resize
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDeviceInfo({
          isTouch: detectTouchDevice(),
          isMobile: detectMobileDevice(),
          isTablet: detectTabletDevice(),
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          pixelRatio: window.devicePixelRatio,
        });
      }, 150);
    };
  }, []);

  // Efecto para escuchar cambios de tamaño de ventana y orientación
  useEffect(() => {
    // Eventos para detectar cambios
    const events = ["resize", "orientationchange"];

    events.forEach((event) => {
      window.addEventListener(event, updateDeviceInfo, { passive: true });
    });

    // Media queries para detectar cambios en el tipo de puntero
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const orientationQuery = window.matchMedia("(orientation: portrait)");

    const handleMediaChange = () => updateDeviceInfo();

    // Agregar listeners para media queries (si están disponibles)
    if (pointerQuery.addEventListener) {
      pointerQuery.addEventListener("change", handleMediaChange);
      orientationQuery.addEventListener("change", handleMediaChange);
    } else {
      // Fallback para navegadores más antiguos
      pointerQuery.addListener(handleMediaChange);
      orientationQuery.addListener(handleMediaChange);
    }

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateDeviceInfo);
      });

      if (pointerQuery.removeEventListener) {
        pointerQuery.removeEventListener("change", handleMediaChange);
        orientationQuery.removeEventListener("change", handleMediaChange);
      } else {
        pointerQuery.removeListener(handleMediaChange);
        orientationQuery.removeListener(handleMediaChange);
      }
    };
  }, [updateDeviceInfo]);

  // Valores derivados útiles
  const deviceType = useMemo(() => {
    if (deviceInfo.isMobile) return "mobile";
    if (deviceInfo.isTablet) return "tablet";
    return "desktop";
  }, [deviceInfo.isMobile, deviceInfo.isTablet]);

  const isSmallScreen = useMemo(() => {
    return deviceInfo.screenWidth < 640;
  }, [deviceInfo.screenWidth]);

  const isMediumScreen = useMemo(() => {
    return deviceInfo.screenWidth >= 640 && deviceInfo.screenWidth < 1024;
  }, [deviceInfo.screenWidth]);

  const isLargeScreen = useMemo(() => {
    return deviceInfo.screenWidth >= 1024;
  }, [deviceInfo.screenWidth]);

  // Valor del contexto
  const contextValue = useMemo(
    () => ({
      ...deviceInfo,
      deviceType,
      isSmallScreen,
      isMediumScreen,
      isLargeScreen,
      // Aliases útiles
      isDesktop: deviceType === "desktop",
      isTouchDevice: deviceInfo.isTouch, // Alias para compatibilidad
    }),
    [deviceInfo, deviceType, isSmallScreen, isMediumScreen, isLargeScreen]
  );

  return (
    <DeviceContext.Provider value={contextValue}>
      {children}
    </DeviceContext.Provider>
  );
};
