import { useWatchlist } from '../context/WatchlistContext';

/** 관심 종목 토글 ★. 채워져 있으면 담긴 상태. */
export default function StarButton({ symbol, name, className = '' }) {
  const { isWatched, toggle } = useWatchlist();
  const on = isWatched(symbol);
  return (
    <button
      type='button'
      className={`star-btn ${on ? 'is-on' : ''} ${className}`}
      aria-pressed={on}
      aria-label={on ? `${symbol} 관심 종목에서 빼기` : `${symbol} 관심 종목에 담기`}
      title={on ? '관심 종목에서 빼기' : '관심 종목에 담기'}
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
