import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startDirect } from '../api/chat';
import { useAuth } from '../context/AuthContext';

/**
 * 랭킹의 닉네임. 클릭하면 "포트폴리오 보기 / DM 보내기" 메뉴가 열린다.
 * 본인과 탈퇴한 사용자는 메뉴 없이 글자만 보여준다.
 */
export default function RankingNickname({ userId, nickname, withdrawn }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (withdrawn || userId === user?.id) {
    return <span>{nickname}</span>;
  }

  const requireLogin = () => {
    window.alert('로그인 후 이용할 수 있습니다.');
    navigate('/login');
  };

  const viewPortfolio = () => {
    setOpen(false);
    if (!isAuthenticated) return requireLogin();
    navigate(`/invest/users/${userId}`);
    return undefined;
  };

  const sendDm = async () => {
    setOpen(false);
    if (!isAuthenticated) return requireLogin();
    setBusy(true);
    try {
      const room = await startDirect(userId);
      navigate(`/chat/dm/${room.roomId}`);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <span className='nick-menu' ref={ref}>
      <button
        type='button'
        className='nick-menu__trigger'
        aria-haspopup='menu'
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
      >
        {nickname}
      </button>
      {open && (
        <div className='nick-menu__list' role='menu'>
          <button type='button' role='menuitem' onClick={viewPortfolio}>
            포트폴리오 보기
          </button>
          <button type='button' role='menuitem' onClick={sendDm}>
            DM 보내기
          </button>
        </div>
      )}
    </span>
  );
}
