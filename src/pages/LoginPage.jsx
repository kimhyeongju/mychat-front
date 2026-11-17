import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { markLoggedIn } = useAuth();
  const { t } = useI18n();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      markLoggedIn();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('login.title')} subtitle={t('login.subtitle')}>
      <form className='auth-form' onSubmit={handleSubmit}>
        {location.state?.signedUp && (
          <div className='banner banner-success'>
            {t('login.signedUp')}
          </div>
        )}
        {error && <div className='banner banner-error'>{error}</div>}

        <div className='field'>
          <label htmlFor='username'>{t('login.username')}</label>
          <input
            id='username'
            className='text-input'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            required
          />
        </div>

        <div className='field'>
          <label htmlFor='password'>{t('login.password')}</label>
          <input
            id='password'
            type='password'
            className='text-input'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type='submit'
          className='btn btn-primary btn-block'
          disabled={loading}
        >
          {loading ? t('login.submitting') : t('login.submit')}
        </button>
      </form>

      <div className='auth-links'>
        <Link to='/find-id'>{t('login.findId')}</Link>
        <Link to='/find-password'>{t('login.findPassword')}</Link>
      </div>

      <div className='auth-footer'>
        {t('login.noAccount')}{' '}
        <Link to='/signup' className='link'>
          {t('nav.signup')}
        </Link>
      </div>
    </AuthLayout>
  );
}
