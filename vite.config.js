import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import glsl from "vite-plugin-glsl";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), glsl(), tailwindcss()],

  // Optimizaciones de build para producción
  build: {
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendors principales para mejor caching
          vendor: ["react", "react-dom"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          animation: ["framer-motion"],
          utils: ["lodash", "lottie-react"],
        },
        // Optimizar nombres de chunks
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    chunkSizeWarningLimit: 1000,
    // Optimizar assets
    assetsInlineLimit: 4096, // Inline assets pequeños
    reportCompressedSize: false, // Acelerar build
    sourcemap: false, // Desactivar sourcemaps en producción para menor tamaño
  },

  // Optimizaciones de dependencias
  optimizeDeps: {
    include: [
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "framer-motion",
      "react",
      "react-dom",
      "lottie-react",
    ],
    exclude: ["vite-plugin-glsl"], // Excluir plugins de desarrollo
  },

  // Configuración del servidor de desarrollo
  server: {
    fs: {
      strict: false,
    },
    // Optimizaciones para desarrollo
    hmr: {
      overlay: false, // Desactivar overlay de errores para mejor rendimiento
    },
    // Pre-transform conocidos imports pesados
    warmup: {
      clientFiles: [
        "./src/components/ImageTransitions.jsx",
        "./src/components/MagneticCursor.jsx",
        "./src/App.jsx",
      ],
    },
  },

  // Configuraciones de rendimiento adicionales
  define: {
    // Optimizar en tiempo de build usando la forma nativa de Vite
    __DEV__: "import.meta.env.DEV",
  },

  // Configuración de CSS
  css: {
    devSourcemap: false, // Desactivar sourcemaps CSS en desarrollo para velocidad
    preprocessorOptions: {
      scss: {
        charset: false, // Optimización menor para SCSS
      },
    },
  },

  // Configuración de workers (para futuras optimizaciones)
  worker: {
    format: "es",
    plugins: () => [react()],
  },

  // Configuraciones de preview
  preview: {
    port: 4173,
    host: true,
  },

  // Configuraciones experimentales para mejor rendimiento
  esbuild: {
    // Optimizaciones de esbuild
    legalComments: "none",
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },

  // Configuraciones de resolución optimizadas
  resolve: {
    // Reducir búsquedas de archivos
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    // Alias para imports más rápidos (opcional)
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
