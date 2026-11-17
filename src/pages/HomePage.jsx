import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { useI18n } from '../context/LanguageContext';

const SERVICES = [
  {
    key: 'chat',
    label: 'home.chat',
    emoji: '💬',
    description: 'home.chatDesc',
    to: '/chat',
  },
  {
    key: 'board',
    label: 'home.board',
    emoji: '📝',
    description: 'home.boardDesc',
    to: '/boards',
  },
  {
    key: 'invest',
    label: 'home.invest',
    emoji: '📈',
    description: 'home.investDesc',
    to: '/invest',
  },
  {
    // ★ 준비 중 -> 포트폴리오
    key: 'portfolio',
    label: 'home.portfolio',
    emoji: '🗂️',
    description: 'home.portfolioDesc',
    to: '/portfolio',
  },
];

export default function HomePage() {
  const { t } = useI18n();
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    apiRequest('/api/hello')
      .then(() => setStatus('connected'))
      .catch(() => setStatus('disconnected'));
  }, []);

  return (
    <>
      <main className='home__main'>
        <h1 className='home__title'>{t('home.title')}</h1>

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
              <strong className='blog-promo__title'>{t('home.blogTitle')}</strong>
              <span className='blog-promo__badge'>{t('home.blogBadge')}</span>

              <span className='blog-promo__tags'>
                <span className='blog-promo__tag'>#Spring</span>
                <span className='blog-promo__tag'>#React</span>
                <span className='blog-promo__tag'>#Docker</span>
                <span className='blog-promo__tag'>#보안</span>
              </span>
            </span>

            <span className='blog-promo__desc'>
              {t('home.blogDesc')}
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
                <span className='service-card__label'>{t(service.label)}</span>
                <span className='service-card__desc'>
                  {t(service.description)}
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
                <span className='service-card__label'>{t(service.label)}</span>
                <span className='service-card__desc'>
                  {t(service.description)}
                </span>
                <span className='service-card__badge'>{t('home.soon')}</span>
              </div>
            ),
          )}
        </div>
      </main>

      <footer className='home__footer'>
        <span className={`dot dot--${status}`} aria-hidden='true' />
        {t('home.server')}{' '}
        {status === 'connected'
          ? t('home.serverOk')
          : status === 'checking'
            ? t('home.serverChecking')
            : t('home.serverDown')}
      </footer>
    </>
  );
}
