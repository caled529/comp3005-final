import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "src/client",
  base: "/app/",
  build: {
    outDir: path.join(import.meta.dirname, "dist/client"),
  },
});
