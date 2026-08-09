import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/mint/",
  build: {
    outDir: "../mint",
    emptyOutDir: true,
    sourcemap: false,
  },
});
