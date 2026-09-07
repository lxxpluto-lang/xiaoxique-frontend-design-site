import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages publishes this project under /xiaoxique-rehab-prototype/.
  // Relative H5 assets keep the same build usable at that sub-path and locally.
  base: './',
  plugins: [uni()],
  server: {
    fs: {
      allow: [".."],
    },
  },
});
