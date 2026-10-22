import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  // Root HTML entry point
  root: ".",

  build: {
    // Output directory for production builds
    outDir: "dist",
    emptyOutDir: true,

    // Tauri expects a specific target for the Webview
    target: ["es2021", "chrome105", "safari13"],

    // Don't minify Rust-side debug builds
    minify: process.env.TAURI_DEBUG ? false : "esbuild",

    // Produce source maps in debug mode
    sourcemap: !!process.env.TAURI_DEBUG,
  },

  // Tauri expects a fixed dev server port
  server: {
    port: 1420,
    strictPort: true,
    // Allow Tauri CLI to use the server
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  // Resolve path aliases (optional, but handy for larger apps)
  resolve: {
    alias: {
      "@": "/src",
    },
  },

  // Prevent Vite from obscuring Rust errors
  clearScreen: false,

  // Env variables exposed to the frontend must start with VITE_
  envPrefix: ["VITE_", "TAURI_"],
});
