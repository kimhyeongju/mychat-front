import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

const SERVICES = [
  {
    key: 'chat',
    label: '채팅',
    emoji: '💬',
    description: '가볍게 떠드는 공간',
    to: '/chat',
  },
  {
    key: 'board',
    label: '게시판',
    emoji: '📝',
    description: '글 쓰고 댓글 달고',
    to: '/boards',
  },
  {
    key: 'invest',
    label: '모의 투자',
    emoji: '📈',
    description: '개발 중입니다...',
    to: null,
  },
  {
    // ★ 준비 중 -> 포트폴리오
    key: 'portfolio',
    label: '포트폴리오',
    emoji: '🗂️',
    description: '지금까지 만든 것들',
    to: '/portfolio',
  },
];

export default function HomePage() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    apiRequest('/api/hello')
      .then(() => setStatus('connected'))
      .catch(() => setStatus('disconnected'));
  }, []);

  return (
    <>
      <main className='home__main'>
        <h1 className='home__title'>놀이터에 오신 걸 환영해요</h1>

        <p className='home__subtitle'>
          <a
            className='home__repo-link'
            href='https://github.com/kimhyeongju/mychat-back'
            target='_blank'
            rel='noopener noreferrer'
          >
            github.com/kimhyeongju/mychat-back
          </a>
        </p>

        <a
          className='blog-promo'
          href='https://photon299792.tistory.com/'
          target='_blank'
          rel='noopener noreferrer'
        >
          <span className='blog-promo__emoji' aria-hidden='true'>
            📝
          </span>

          <span className='blog-promo__body'>
            <span className='blog-promo__head'>
              <strong className='blog-promo__title'>기술 블로그</strong>
              <span className='blog-promo__badge'>방문 추천</span>

              <span className='blog-promo__tags'>
                <span className='blog-promo__tag'>#Spring</span>
                <span className='blog-promo__tag'>#React</span>
                <span className='blog-promo__tag'>#Docker</span>
                <span className='blog-promo__tag'>#보안</span>
              </span>
            </span>

            <span className='blog-promo__desc'>
              이 서버의 블로그(TISTORY)입니다. 꼭 한 번 들러보세요!!
            </span>
          </span>

          <span className='blog-promo__arrow' aria-hidden='true'>
            →
          </span>
        </a>

        <div className='service-grid'>
          {SERVICES.map((service) =>
            service.to ? (
              <Link key={service.key} to={service.to} className='service-card'>
                <span className='service-card__emoji' aria-hidden='true'>
                  {service.emoji}
                </span>
                <span className='service-card__label'>{service.label}</span>
                <span className='service-card__desc'>
                  {service.description}
                </span>
              </Link>
            ) : (
              <div
                key={service.key}
                className='service-card service-card--soon'
              >
                <span className='service-card__emoji' aria-hidden='true'>
                  {service.emoji}
                </span>
                <span className='service-card__label'>{service.label}</span>
                <span className='service-card__desc'>
                  {service.description}
                </span>
                <span className='service-card__badge'>준비 중</span>
              </div>
            ),
          )}
        </div>
      </main>

      <footer className='home__footer'>
        <span className={`dot dot--${status}`} aria-hidden='true' />
        서버{' '}
        {status === 'connected'
          ? '정상'
          : status === 'checking'
            ? '확인 중'
            : '응답 없음'}
      </footer>
    </>
  );
}
