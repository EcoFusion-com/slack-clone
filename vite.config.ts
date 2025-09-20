import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: parseInt(process.env.VITE_FRONTEND_PORT || '5173'),
    allowedHosts: process.env.NODE_ENV === 'development' ? 
      (process.env.VITE_ALLOWED_HOSTS?.split(',') || [
        "localhost",
        "127.0.0.1",
        ".ngrok.io",
        ".ngrok-free.app"
      ]) : [],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
