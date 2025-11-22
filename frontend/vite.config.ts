import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get backend URL from environment variable or use default for development
  const backendUrl = process.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
  const devPort = parseInt(process.env.VITE_PORT || "5173", 10);

  return {
    server: {
      host: "::",
      port: devPort,
      // Proxy API requests to the backend to avoid CORS during local development
      proxy: {
        // Forward any /api requests to the Django backend
        // In production, set VITE_API_URL to the full backend URL and disable proxy
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
