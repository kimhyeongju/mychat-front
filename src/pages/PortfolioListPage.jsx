import { Link } from 'react-router-dom';
import { PORTFOLIOS, slideUrl } from '../data/portfolios';

export default function PortfolioListPage() {
  return (
    <main className='page page--wide'>
      <div className='page__header'>
        <h1 className='page__title'>포트폴리오</h1>
        <Link className='btn-ghost btn-sm' to='/'>
          홈으로
        </Link>
      </div>

      <p className='muted' style={{ marginBottom: 24 }}>
        지금까지 진행한 프로젝트들입니다. 카드를 누르면 슬라이드를 넘겨볼 수
        있어요.
      </p>

      <div className='portfolio-grid'>
        {PORTFOLIOS.map((p) => (
          <Link
            key={p.slug}
            className='portfolio-card'
            to={`/portfolio/${p.slug}`}
          >
            <div className='portfolio-card__cover'>
              <img
                src={slideUrl(p.slug, 1)}
                alt={`${p.title} 표지`}
                loading='lazy'
                decoding='async'
                draggable={false}
              />
            </div>

            <div className='portfolio-card__body'>
              <div className='portfolio-card__head'>
                <span className='portfolio-card__emoji' aria-hidden='true'>
                  {p.emoji}
                </span>
                <strong className='portfolio-card__title'>{p.title}</strong>
                <span className='portfolio-card__count'>{p.count}쪽</span>
              </div>
              <p className='portfolio-card__desc'>{p.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
