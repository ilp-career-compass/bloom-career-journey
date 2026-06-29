// vite.config.ts
import { defineConfig } from "file:///D:/ilp/career_compass/bloom-career-journey/node_modules/vite/dist/node/index.js";
import react from "file:///D:/ilp/career_compass/bloom-career-journey/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///D:/ilp/career_compass/bloom-career-journey/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "D:\\ilp\\career_compass\\bloom-career-journey";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      // Improve HMR stability
      protocol: "ws",
      host: "localhost",
      clientPort: 8080
    },
    watch: {
      // Exclude node_modules and build directories from watching
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/.next/**"],
      // Use polling on Windows if issues persist
      usePolling: false
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Optimize for better performance
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxpbHBcXFxcY2FyZWVyX2NvbXBhc3NcXFxcYmxvb20tY2FyZWVyLWpvdXJuZXlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGlscFxcXFxjYXJlZXJfY29tcGFzc1xcXFxibG9vbS1jYXJlZXItam91cm5leVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovaWxwL2NhcmVlcl9jb21wYXNzL2Jsb29tLWNhcmVlci1qb3VybmV5L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgICBobXI6IHtcbiAgICAgIC8vIEltcHJvdmUgSE1SIHN0YWJpbGl0eVxuICAgICAgcHJvdG9jb2w6ICd3cycsXG4gICAgICBob3N0OiAnbG9jYWxob3N0JyxcbiAgICAgIGNsaWVudFBvcnQ6IDgwODAsXG4gICAgfSxcbiAgICB3YXRjaDoge1xuICAgICAgLy8gRXhjbHVkZSBub2RlX21vZHVsZXMgYW5kIGJ1aWxkIGRpcmVjdG9yaWVzIGZyb20gd2F0Y2hpbmdcbiAgICAgIGlnbm9yZWQ6IFsnKiovbm9kZV9tb2R1bGVzLyoqJywgJyoqLy5naXQvKionLCAnKiovZGlzdC8qKicsICcqKi8ubmV4dC8qKiddLFxuICAgICAgLy8gVXNlIHBvbGxpbmcgb24gV2luZG93cyBpZiBpc3N1ZXMgcGVyc2lzdFxuICAgICAgdXNlUG9sbGluZzogZmFsc2UsXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxuICAgIGNvbXBvbmVudFRhZ2dlcigpLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICAvLyBPcHRpbWl6ZSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1QsU0FBUyxvQkFBb0I7QUFDclYsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQTtBQUFBLE1BRUgsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sWUFBWTtBQUFBLElBQ2Q7QUFBQSxJQUNBLE9BQU87QUFBQTtBQUFBLE1BRUwsU0FBUyxDQUFDLHNCQUFzQixjQUFjLGNBQWMsYUFBYTtBQUFBO0FBQUEsTUFFekUsWUFBWTtBQUFBLElBQ2Q7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUNULGdCQUFnQjtBQUFBLEVBQ2xCLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUFFQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLEVBQ3BEO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
