import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchSymbols } from '../api/invest';
import StarButton from './StarButton';

/**
 * 종목 검색창. 입력을 멈추고 300ms 뒤에 검색하고, 결과를 고르면 종목 화면으로 이동한다.
 * 티커를 그대로 입력하고 엔터를 치면 검색 결과와 무관하게 해당 종목으로 간다.
 */
export default function StockSearch({ autoFocus = false }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const boxRef = useRef(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setError('');
      return undefined;
    }

    const timer = setTimeout(() => {
      searchSymbols(q)
        .then((list) => {
          setResults(list);
          setError('');
          setOpen(true);
        })
        .catch((err) => {
          setResults([]);
          setError(err.message);
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const go = (symbol) => {
    setOpen(false);
    setQuery('');
    navigate(`/invest/stocks/${encodeURIComponent(symbol)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    // 검색 결과가 하나뿐이면 그걸로, 아니면 입력값을 티커로 간주한다.
    if (results.length === 1) go(results[0].symbol);
    else go(q);
  };

  return (
    <div className='stock-search' ref={boxRef}>
      <form className='search-bar' onSubmit={handleSubmit}>
        <input
          type='search'
          placeholder='종목명 또는 티커 (예: Apple, AAPL)'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoFocus={autoFocus}
          autoComplete='off'
          spellCheck={false}
        />
        <button type='submit' className='btn btn-ghost'>
          검색
        </button>
      </form>

      {error && <p className='form-msg form-msg--error'>{error}</p>}

      {open && results.length > 0 && (
        <ul className='stock-search__results' role='listbox'>
          {results.map((item) => (
            <li key={item.symbol} className='stock-search__row'>
              <button
                type='button'
                className='stock-search__item'
                onClick={() => go(item.symbol)}
              >
                <span className='stock-search__symbol'>{item.symbol}</span>
                <span className='stock-search__name'>{item.name}</span>
              </button>
              <StarButton symbol={item.symbol} name={item.name} />
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && results.length === 0 && !error && (
        <p className='muted stock-search__empty'>
          검색 결과가 없습니다. 티커를 정확히 알면 그대로 입력하고 엔터를 누르세요.
        </p>
      )}
    </div>
  );
}
