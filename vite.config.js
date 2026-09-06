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
    // ngrok/Cloudflare Tunnel로 터널링해서 접속할 때, Vite가 알 수 없는 호스트명 요청을 기본 차단하는 걸 허용.
    // 둘 다 매 실행마다 서브도메인이 바뀌므로 와일드카드로 전체 허용.
    allowedHosts: ['.trycloudflare.com'],
  },
});
