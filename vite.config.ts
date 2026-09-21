import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { sites } from "./build/sites-vite-plugin";

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    ...(isCodexSeatbeltSandbox ? { watch: { useFsEvents: false, usePolling: true } } : {}),
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/auth": { target: "http://localhost:3001", changeOrigin: true },
      "/health": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  plugins: [react(), sites()],
});
