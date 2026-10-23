import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { findPortfolio, slideUrl } from '../data/portfolios';

// 다음 몇 장을 미리 받아둘지. 2장이면 빠르게 넘겨도 흰 화면이 거의 안 보인다.
const PRELOAD_AHEAD = 2;
// 스와이프로 인정할 최소 이동 거리(px). 너무 작으면 탭이 스와이프로 오인된다.
const SWIPE_THRESHOLD = 50;

export default function PortfolioViewerPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const portfolio = findPortfolio(slug);
  const total = portfolio?.count ?? 0;

  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState(false);

  const touchStartX = useRef(null);

  // 주소창으로 다른 포트폴리오에 바로 들어오거나, 뷰어 안에서 slug가 바뀌는 경우.
  useEffect(() => {
    setPage(1);
  }, [slug]);

  const prev = useCallback(() => setPage((p) => Math.max(p - 1, 1)), []);
  const next = useCallback(
    () => setPage((p) => Math.min(p + 1, total || 1)),
    [total],
  );

  // 키보드 조작.
  // setPage에 함수를 넘기므로 page를 의존성에 넣지 않아도 stale closure가 생기지 않는다.
  useEffect(() => {
    if (!total) return undefined;

    const onKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'Escape') navigate('/portfolio');
      else return;
      e.preventDefault();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total, prev, next, navigate]);

  // 다음 장 미리 받기. new Image()만 만들어두면 브라우저 캐시에 들어간다.
  useEffect(() => {
    if (!portfolio) return;
    for (let i = 1; i <= PRELOAD_AHEAD; i += 1) {
      const n = page + i;
      if (n > total) break;
      const img = new Image();
      img.src = slideUrl(portfolio.slug, n);
    }
  }, [portfolio, page, total]);

  // 장이 바뀌면 로딩 표시를 다시 켠다.
  useEffect(() => {
    setLoaded(false);
  }, [page]);

  if (!portfolio) {
    return (
      <main className='page page--wide'>
        <div className='empty'>
          <p className='muted'>존재하지 않는 포트폴리오입니다.</p>
          <Link className='btn-ghost btn-sm' to='/portfolio'>
            목록으로
          </Link>
        </div>
      </main>
    );
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) next();
    else prev();
  };

  return (
    <main className='viewer'>
      <header className='viewer__bar'>
        <Link className='btn-ghost btn-sm' to='/portfolio'>
          ← 목록
        </Link>

        <div className='viewer__heading'>
          <span className='viewer__emoji' aria-hidden='true'>
            {portfolio.emoji}
          </span>
          <strong className='viewer__title'>{portfolio.title}</strong>
        </div>

        <span className='viewer__counter'>
          {page} / {total}
        </span>
      </header>

      <div
        className='viewer__stage'
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type='button'
          className='viewer__nav viewer__nav--prev'
          onClick={prev}
          disabled={page === 1}
          aria-label='이전 장'
        >
          ‹
        </button>

        <img
          // key를 주면 장이 바뀔 때 img가 새로 마운트되어
          // 이전 이미지가 남아 있다가 교체되는 깜빡임이 없다.
          key={page}
          className={`viewer__slide${loaded ? ' is-loaded' : ''}`}
          src={slideUrl(portfolio.slug, page)}
          alt={`${portfolio.title} ${page}쪽`}
          onLoad={() => setLoaded(true)}
          decoding='async'
          draggable={false}
        />

        <button
          type='button'
          className='viewer__nav viewer__nav--next'
          onClick={next}
          disabled={page === total}
          aria-label='다음 장'
        >
          ›
        </button>
      </div>

      <footer className='viewer__footer'>
        <input
          className='viewer__range'
          type='range'
          min={1}
          max={total}
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          aria-label='슬라이드 이동'
        />
        <span className='viewer__hint'>← → 키로도 넘길 수 있어요</span>
      </footer>
    </main>
  );
}
