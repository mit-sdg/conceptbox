import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const backend = "http://localhost:3000";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    headers: { "Referrer-Policy": "no-referrer" },
    proxy: { "/api": backend },
  },
});
