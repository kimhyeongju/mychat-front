import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ floating = true }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type='button'
      className={`theme-toggle ${floating ? 'theme-toggle--floating' : ''}`}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
