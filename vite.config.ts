import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const fromRoot = (p: string) => path.resolve(rootDir, p);

export default {
  resolve: {
    alias: {
      "@": fromRoot("./src"),
      "@components": fromRoot("./src/shared/ui"),
      "@pages": fromRoot("./src/pages"),
      "@layouts": fromRoot("./src/shared/layouts"),
      "@hooks": fromRoot("./src/shared/hooks"),
      "@styles": fromRoot("./src/styles"),
      "@assets": fromRoot("./src/assets"),
      "@utils": fromRoot("./src/shared/utils"),
      "@lib": fromRoot("./src/shared/lib"),
      "@store": fromRoot("./src/shared/store"),
      "@types": fromRoot("./src/shared/types"),
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    open: false
  },
  preview: {
    host: "0.0.0.0",
    port: 4173
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1200,
    target: "es2017"
  }
};
