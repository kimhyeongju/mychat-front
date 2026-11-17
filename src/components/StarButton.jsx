import { useI18n } from '../context/LanguageContext';
import { useWatchlist } from '../context/WatchlistContext';

/** 관심 종목 토글 ★. 채워져 있으면 담긴 상태. */
export default function StarButton({ symbol, name, className = '' }) {
  const { isWatched, toggle } = useWatchlist();
  const { t } = useI18n();
  const on = isWatched(symbol);
  return (
    <button
      type='button'
      className={`star-btn ${on ? 'is-on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={t(on ? 'inv.starRemove' : 'inv.starAdd', { symbol })}
      title={t(on ? 'inv.starRemoveTitle' : 'inv.starAddTitle')}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(symbol, name);
      }}
    >
      {on ? '★' : '☆'}
    </button>
  );
}
