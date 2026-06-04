import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: process.env.VITE_API_URL
    ? undefined
    : {
        proxy: {
          "/api": "http://localhost:3000",
          "/auth": "http://localhost:3000",
        },
      },
});
