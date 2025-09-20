import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,  // escucha en todas las interfaces (0.0.0.0)
    port: 5173,  // puerto (puedes cambiarlo si quieres)
  },
});
