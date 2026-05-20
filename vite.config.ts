import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  // host: true → 同时监听 IPv4，避免 Windows 访问 localhost 走 ::1 连不上
  server: { host: true, port: 5183, strictPort: true, open: "/"},
  optimizeDeps: { exclude: ["@consenlabs/tcx-wasm"] },
});
