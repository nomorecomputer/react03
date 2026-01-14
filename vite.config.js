import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "process";

// https://vite.dev/config/
export default defineConfig({
  // server: { open: true },
  base: process.env.NODE_ENV === "production" ? "/react03/" : "/",
  plugins: [react()],
});
