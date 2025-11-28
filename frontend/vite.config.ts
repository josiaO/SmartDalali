// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";



// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode
  // The third argument ('') ensures all environment variables, including ones without a VITE_ prefix, are loaded.
  const env = loadEnv(mode, process.cwd(), '');

  // Get the ngrok host from the environment variable (if set)
  const ngrokHost = env.VITE_NGROK_HOST;

  // The HMR configuration (for fast refreshing)
  const hmrConfig = ngrokHost
    ? {
      host: ngrokHost, // Use ngrok host for HMR
      protocol: 'wss', // ngrok tunnels are HTTPS, so HMR must use secure WebSocket (wss)
    }
    : true; // Default to true (Vite handles local HMR)

  return ({
    server: {
      host: "::", // Allows access from any interface (IPv4 or IPv6)
      port: 5173,
      hmr: hmrConfig, // Apply the dynamic HMR host setting
    },
    // Only include react() plugin for a working setup.
    plugins: [react()],
    resolve: {
      alias: {
        // Set up the path alias for easy imports like `@/components/Button`
        "@": path.resolve(__dirname, "./src"),
      },
    },
  });
});