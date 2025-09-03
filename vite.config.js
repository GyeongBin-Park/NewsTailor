import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // '/api'로 시작하는 요청은 target으로 전달됨
      "/api": {
        target: "https://api.sws.speechify.com", // 실제 API 서버 주소
        changeOrigin: true, // 출처를 변경하여 CORS 문제를 해결
        rewrite: (path) => path.replace(/^\/api/, ""), // '/api' 부분을 제거하고 요청
      },
    },
  },
});
