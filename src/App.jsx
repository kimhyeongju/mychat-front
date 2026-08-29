import { Route, Routes } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';
import ChatRoomPage from './pages/ChatRoomPage';
import DirectMessagesPage from './pages/DirectMessagesPage';
import FindIdPage from './pages/FindIdPage';
import FindPasswordPage from './pages/FindPasswordPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NearbyRoomsPage from './pages/NearbyRoomsPage';
import SignUpPage from './pages/SignUpPage';
import WithdrawPage from './pages/WithdrawPage';

function App() {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/signup' element={<SignUpPage />} />
      <Route path='/find-id' element={<FindIdPage />} />
      <Route path='/find-password' element={<FindPasswordPage />} />
      <Route
        path='/withdraw'
        element={
          <RequireAuth>
            <WithdrawPage />
          </RequireAuth>
        }
      />
      <Route path='/chat/nearby' element={<NearbyRoomsPage />} />
      <Route path='/chat/rooms/:roomId' element={<ChatRoomPage />} />
      <Route
        path='/chat/direct'
        element={
          <RequireAuth>
            <DirectMessagesPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
