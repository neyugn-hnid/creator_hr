import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    reactRouter(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    host: "0.0.0.0",
    hmr: process.env.DISABLE_HMR !== "true",
    watch: process.env.DISABLE_HMR === "true" ? null : {},
  },
  ssr: {
    // These packages must be resolved by Node.js natively (CJS), not bundled by Vite
    external: ["@prisma/client", "@prisma/adapter-pg", "pg", "googleapis", "google-auth-library", "react-is"],
    noExternal: [],
  },
});
