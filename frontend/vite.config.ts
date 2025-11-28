// vite.config.ts
import { defineConfig, loadEnv } from "vite"; // <--- Import loadEnv
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for the current mode
  const env = loadEnv(mode, process.cwd(), ''); 
  
  // Get the ngrok host from the environment variable (if set)
  const ngrokHost = env.VITE_NGROK_HOST;

  // The HMR configuration (for fast refreshing)
  const hmrConfig = ngrokHost 
    ? {
        host: ngrokHost, // Use ngrok host for HMR
        protocol: 'wss', // ngrok tunnels are HTTPS, so HMR should use secure WebSocket
      }
    : true; // Default to true when running locally

  return ({
    server: {
      host: "::", // Allows access from any interface
      port: 8080,
      hmr: hmrConfig, // Apply the HMR host setting
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  });
});