import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import RequireAuth from './components/RequireAuth';
import BoardListPage from './pages/BoardListPage';
import FindIdPage from './pages/FindIdPage';
import FindPasswordPage from './pages/FindPasswordPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PostDetailPage from './pages/PostDetailPage';
import PostFormPage from './pages/PostFormPage';
import PostListPage from './pages/PostListPage';
import ProfileEditPage from './pages/ProfileEditPage';
import SignUpPage from './pages/SignUpPage';
import WithdrawPage from './pages/WithdrawPage';

function App() {
  return (
    <Routes>
      {/* 헤더가 있는 일반 페이지 */}
      <Route element={<AppLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/boards' element={<BoardListPage />} />
        <Route path='/boards/:slug' element={<PostListPage />} />
        <Route
          path='/boards/:slug/posts/:postId'
          element={<PostDetailPage />}
        />
        <Route
          path='/profile'
          element={
            <RequireAuth>
              <ProfileEditPage />
            </RequireAuth>
          }
        />
        <Route
          path='/withdraw'
          element={
            <RequireAuth>
              <WithdrawPage />
            </RequireAuth>
          }
        />
        <Route
          path='/boards/:slug/write'
          element={
            <RequireAuth>
              <PostFormPage />
            </RequireAuth>
          }
        />
        <Route
          path='/boards/:slug/posts/:postId/edit'
          element={
            <RequireAuth>
              <PostFormPage />
            </RequireAuth>
          }
        />
      </Route>

      {/* AuthLayout을 쓰는 인증 화면 (헤더 없음) */}
      <Route path='/login' element={<LoginPage />} />
      <Route path='/signup' element={<SignUpPage />} />
      <Route path='/find-id' element={<FindIdPage />} />
      <Route path='/find-password' element={<FindPasswordPage />} />
    </Routes>
  );
}

export default App;
