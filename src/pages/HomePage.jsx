import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';

const SERVICES = [
  {
    key: 'chat',
    label: '채팅',
    emoji: '💬',
    description: '가볍게 떠드는 공간',
    to: null,
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
    description: '돈 안 잃는 투자 연습',
    to: null,
  },
  {
    key: 'tbd',
    label: '준비 중',
    emoji: '🧩',
    description: '무엇이 좋을까?',
    to: null,
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
        <p className='home__subtitle'>마음에 드는 칸을 골라 들어가 보세요.</p>

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
