import { useI18n } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ floating = true }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const label = theme === 'dark' ? t('theme.toLight') : t('theme.toDark');

  return (
    <button
      type='button'
      className={`theme-toggle ${floating ? 'theme-toggle--floating' : ''}`}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
