# khj-playground-front

[khj-playground.site](https://khj-playground.site)의 프론트엔드입니다.
한 도메인에서 여러 서비스(채팅 / 게시판 / 모의투자)를 제공하는 단일 SPA입니다.

## 기술 스택

| 분류       | 사용 기술                      |
| ---------- | ------------------------------ |
| 프레임워크 | React 19                       |
| 빌드 도구  | Vite 6                         |
| 라우팅     | React Router 7                 |
| 상태 관리  | Context API (인증, 테마)       |
| 스타일     | 순수 CSS (CSS 변수 기반 테마)  |
| 배포       | Docker (Nginx), GitHub Actions |

상태 관리 라이브러리를 따로 두지 않았습니다. 전역 상태가 인증 정보와 테마뿐이라 Context로 충분합니다.

## 프로젝트 구조

```
src/
├── api/
│   ├── client.js      fetch 래퍼, 토큰 관리, 자동 재발급
│   ├── auth.js        인증 / 프로필 API
│   └── board.js       게시판 API
├── components/
│   ├── AppLayout.jsx      헤더 + Outlet 레이아웃
│   ├── AppHeader.jsx      로고, 테마 토글, 유저 드롭다운
│   ├── AuthLayout.jsx     인증 화면 전용 레이아웃
│   ├── RequireAuth.jsx    인증 필요 라우트 가드
│   ├── CommentSection.jsx
│   └── ThemeToggle.jsx
├── context/
│   ├── AuthContext.jsx    로그인 상태와 회원 정보
│   └── ThemeContext.jsx   다크/라이트 모드
├── pages/
│   ├── HomePage.jsx          4개 서비스 진입 화면
│   ├── BoardListPage.jsx     게시판 목록
│   ├── PostListPage.jsx      글 목록 (페이징, 검색)
│   ├── PostDetailPage.jsx    글 상세 + 댓글 + 첨부
│   ├── PostFormPage.jsx      글 작성 / 수정
│   ├── ProfileEditPage.jsx   회원정보 수정
│   ├── LoginPage.jsx
│   ├── SignUpPage.jsx
│   ├── FindIdPage.jsx
│   ├── FindPasswordPage.jsx
│   └── WithdrawPage.jsx
└── styles/
    ├── auth.css       디자인 토큰(CSS 변수) + 인증 화면
    └── home.css       헤더, 서비스 카드, 게시판
```

## 로컬 실행

### 사전 준비

- Node.js 20 이상
- 백엔드 서버 실행 중 (http://localhost:8080)

```bash
npm install
npm run dev
```

http://localhost:5173 에서 확인할 수 있습니다.

### API 프록시

개발 환경에서도 백엔드와 같은 오리진을 쓰도록 Vite 프록시를 사용합니다.

```js
// vite.config.js
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true },
    '/ws':  { target: 'http://localhost:8080', ws: true, changeOrigin: true },
  },
}
```

덕분에 개발과 운영 모두 CORS 설정이 필요 없고, 환경변수도 비워둡니다.

```
VITE_API_BASE_URL=
```

값이 비어 있으면 `/api/...` 상대 경로로 요청하며, 운영에서는 Cloudflare Tunnel이 경로를 보고 백엔드로 라우팅합니다.

## 주요 설계

### API 클라이언트

`src/api/client.js`가 fetch를 감싸고 세 가지를 처리합니다.

**토큰 자동 재발급** — 401 응답을 받으면 `/api/auth/reissue`로 갱신하고 원래 요청을 한 번 재시도합니다. 여러 요청이 동시에 401을 받아도 재발급은 한 번만 일어나도록 진행 중인 Promise를 공유합니다.

**FormData 지원** — body가 `FormData`면 `Content-Type`을 지정하지 않습니다. 브라우저가 boundary를 포함한 헤더를 직접 설정해야 하므로, 여기서 지정하면 파일 업로드가 깨집니다.

**다운로드** — `apiDownload`가 Blob을 받고 `Content-Disposition` 헤더에서 원본 파일명을 복원합니다. RFC 5987로 인코딩되어 한글 파일명도 유지됩니다.

### 인증 상태

`AuthContext`는 토큰 존재 여부가 아니라 **`/api/auth/me` 호출 성공 여부**로 로그인 상태를 판단합니다. 만료된 토큰이 남아 있어도 비로그인으로 정확히 인식됩니다.

응답 전까지는 `loading` 상태이며, `RequireAuth`가 이를 확인해 새로고침 시 로그인 페이지로 튕기는 문제를 막습니다.

```jsx
if (loading) return null;
if (!isAuthenticated) return <Navigate to='/login' replace />;
```

### 권한 표시

수정·삭제 버튼 노출 여부를 프론트가 판단하지 않고, 서버가 응답에 담아주는 `editable` 플래그를 그대로 사용합니다. 작성자 본인인지 관리자인지에 대한 판정 로직이 한 곳에만 존재하게 됩니다.

```jsx
{
  post.editable && <Link to={`...../edit`}>수정</Link>;
}
```

물론 서버에서도 다시 검증하므로, 이 플래그는 UI 편의를 위한 것입니다.

### 목록 상태를 URL에 보관

글 목록의 페이지 번호와 검색어는 `useSearchParams`로 쿼리스트링에 둡니다. 새로고침해도 유지되고, 글을 읽고 뒤로 가기를 눌렀을 때 보던 위치로 돌아옵니다.

```
/boards/free?page=2&keyword=공지
```

### 테마

`index.html`의 인라인 스크립트가 React보다 먼저 `document.documentElement.dataset.theme`을 설정해 첫 렌더링 시 깜빡임을 막습니다. CSS는 `[data-theme='light']`, `[data-theme='dark']` 선택자로 변수를 재정의합니다.

### 레이아웃 분리

```jsx
<Route element={<AppLayout />}>       {/* 헤더 있음 */}
  <Route path='/' element={<HomePage />} />
  <Route path='/boards' element={<BoardListPage />} />
  ...
</Route>

<Route path='/login' element={<LoginPage />} />   {/* AuthLayout, 헤더 없음 */}
```

페이지마다 헤더를 import하지 않도록 레이아웃 라우트로 묶었습니다.

## 라우트

| 경로                               | 화면                         | 인증 |
| ---------------------------------- | ---------------------------- | ---- |
| `/`                                | 서비스 진입 (4개 카드)       | —    |
| `/boards`                          | 게시판 목록                  | —    |
| `/boards/:slug`                    | 글 목록                      | —    |
| `/boards/:slug/posts/:postId`      | 글 상세                      | —    |
| `/boards/:slug/write`              | 글 작성                      | 필요 |
| `/boards/:slug/posts/:postId/edit` | 글 수정                      | 필요 |
| `/profile`                         | 회원정보 수정                | 필요 |
| `/withdraw`                        | 회원 탈퇴                    | 필요 |
| `/login`, `/signup`                | 로그인, 회원가입             | —    |
| `/find-id`, `/find-password`       | 아이디 찾기, 비밀번호 재설정 | —    |

## 빌드

```bash
npm run build     # dist/ 생성
npm run preview   # 빌드 결과 미리보기
```

개발 서버에서는 통과하지만 프로덕션 빌드에서 깨지는 경우가 있으므로, 배포 전 `npm run build`를 한 번 확인하는 것이 좋습니다.

## 배포

`main` 브랜치 push 시 GitHub Actions가 자동 배포합니다.

```
push → 빌드 → Docker 이미지(Nginx) 빌드/푸시 → self-hosted runner에서 pull & 재기동
```

Nginx는 SPA 라우팅을 위해 `try_files`로 모든 경로를 `index.html`로 넘깁니다. 이게 없으면 `/boards`로 직접 접속하거나 새로고침할 때 404가 납니다.

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 자주 겪는 문제

**로그인은 되는데 새로고침하면 풀림**
`RequireAuth`에서 `loading` 상태를 처리하지 않으면 `/me` 응답 전에 비로그인으로 판단합니다.

**파일 업로드가 400으로 실패**
`FormData` 전송 시 `Content-Type`을 직접 지정하면 boundary가 빠집니다. `client.js`가 이를 처리하므로 별도 헤더를 넘기지 마세요.

**API 요청이 엉뚱한 주소로 나감**
`.env.development` 같은 파일에 `VITE_API_BASE_URL`이 남아 있는지 확인하세요. 비어 있어야 Vite 프록시를 탑니다.

**다크 모드에서 특정 영역만 색이 안 맞음**
`styles/auth.css`에 정의된 CSS 변수(`--surface`, `--text-muted` 등)를 사용했는지 확인하세요. 색상 하드코딩은 테마 전환 시 어긋납니다.
