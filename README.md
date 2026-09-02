# mychat-front

React(Vite) 기반 프론트엔드. 초기 단계는 백엔드 `/api/hello` 응답을 화면에 표시하는 헬스체크 페이지입니다.
이후 무료 라이선스 템플릿을 적용하고 실제 채팅 UI(WebSocket/STOMP 연동)로 교체할 예정입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

- 기본적으로 `http://localhost:8080`(백엔드 local 프로필)로 API 요청
- 다른 주소를 쓰려면 `.env.development.local` 파일에 `VITE_API_BASE_URL` 재정의

## 빌드

```bash
npm run build   # dist/ 생성
npm run preview # 빌드 결과 로컬 확인
```

## Docker

```bash
docker build -t mychat-front --build-arg VITE_API_BASE_URL=https://api.yourdomain.com .
docker run -p 8080:80 mychat-front
```

## CI/CD

`.github/workflows/frontend-ci-cd.yml`

1. `build` — `npm ci` + `npm run build`
2. `docker-build-push` — Nginx 기반 이미지 빌드 후 Docker Hub push
3. `deploy` — self-hosted runner(미니PC)에서 pull & 재기동 (러너 등록 후 활성화)

### 필요한 GitHub Secrets / Variables

- Secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- Variables: `VITE_API_BASE_URL` (예: `https://api.yourdomain.com`)

## mini PC TEST...(dummy)
