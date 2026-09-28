import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function AppHeader() {
  const { user, isAuthenticated, markLoggedOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // 메뉴 바깥 클릭 / ESC로 닫는다.
  useEffect(() => {
    if (!menuOpen) return;

    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onEscape = (e) => e.key === 'Escape' && setMenuOpen(false);

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    markLoggedOut();
    navigate('/login');
  };

  return (
    <header className='app-header'>
      <Link to='/' className='app-header__logo'>
        <span aria-hidden='true'>🎠</span> khj playground
      </Link>

      <nav className='app-header__nav'>
        <ThemeToggle floating={false} />

        {isAuthenticated ? (
          <>
            <div className='user-menu' ref={menuRef}>
              <button
                type='button'
                className='user-menu__trigger'
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup='menu'
              >
                {user?.nickname}
                <span className='user-menu__caret' aria-hidden='true'>
                  ▾
                </span>
              </button>

              {menuOpen && (
                <div className='user-menu__dropdown' role='menu'>
                  <Link
                    to='/profile'
                    role='menuitem'
                    onClick={() => setMenuOpen(false)}
                  >
                    회원정보 수정
                  </Link>
                  <Link
                    to='/withdraw'
                    role='menuitem'
                    className='user-menu__danger'
                    onClick={() => setMenuOpen(false)}
                  >
                    회원 탈퇴
                  </Link>
                </div>
              )}
            </div>

            <button
              type='button'
              className='btn btn-ghost'
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link to='/login' className='btn btn-ghost'>
              로그인
            </Link>
            <Link to='/signup' className='btn btn-solid'>
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
