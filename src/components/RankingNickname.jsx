import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startDirect } from '../api/chat';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';

/**
 * 닉네임. 클릭하면 "포트폴리오 보기 / 프로필 보기 / DM 보내기" 메뉴가 열린다.
 * 본인에게는 DM 과 남의 포트폴리오 대신 내 포트폴리오만 나오고, 탈퇴한 사용자는 메뉴 없이 글자만 보여준다.
 * showPortfolio 가 false 면 포트폴리오 항목을 뺀다(이번 주 거래가 없어 보여줄 게 없는 곳 등).
 */
export default function RankingNickname({
  userId,
  nickname,
  withdrawn,
  showPortfolio = true,
}) {
  const { isAuthenticated, user } = useAuth();
  const { t } = useI18n();
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

  if (withdrawn) {
    return <span>{t('inv.withdrawnUser')}</span>;
  }

  const isMe = userId === user?.id;

  const requireLogin = () => {
    window.alert(t('inv.loginRequired'));
    navigate('/login');
  };

  const viewPortfolio = () => {
    setOpen(false);
    if (isMe) {
      navigate('/invest/portfolio');
      return;
    }
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    navigate(`/invest/users/${userId}`);
  };

  const viewProfile = () => {
    setOpen(false);
    navigate(`/invest/users/${userId}/profile`);
  };

  const sendDm = async () => {
    setOpen(false);
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    setBusy(true);
    try {
      const room = await startDirect(userId);
      navigate(`/chat/dm/${room.roomId}`);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy(false);
    }
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
          {showPortfolio && (
            <button type='button' role='menuitem' onClick={viewPortfolio}>
              {isMe ? t('inv.menuMyPortfolio') : t('inv.menuViewPortfolio')}
            </button>
          )}
          <button type='button' role='menuitem' onClick={viewProfile}>
            {t('inv.menuProfile')}
          </button>
          {!isMe && (
            <button type='button' role='menuitem' onClick={sendDm}>
              {t('inv.menuDm')}
            </button>
          )}
        </div>
      )}
    </span>
  );
}
