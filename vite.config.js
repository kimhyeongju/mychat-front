import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // sockjs-client가 Node.js의 전역 변수(global)를 참조하는데,
  // Vite는 브라우저 번들러라 이를 기본 제공하지 않아 브라우저의 window로 대체해준다.
  define: {
    global: 'window',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true, // CORS 우회
      },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true, // CORS 우회 + WebSocket 지원
      },
    },
  },
});
