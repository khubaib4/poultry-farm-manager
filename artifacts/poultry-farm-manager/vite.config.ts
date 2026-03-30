import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: resolve(__dirname, "."),
  base: "/poultry-farm-manager/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "5173"),
    allowedHosts: true,
  },
});
