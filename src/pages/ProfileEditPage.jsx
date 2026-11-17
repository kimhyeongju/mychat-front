import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import '../styles/home.css';

export default function ProfileEditPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  // /me 응답이 늦게 올 수 있으므로 user가 채워지면 폼에 반영한다.
  useEffect(() => {
    if (!user) return;
    setNickname(user.nickname ?? '');
    setEmail(user.email ?? '');
  }, [user]);

  const dirty =
    user &&
    (nickname !== (user.nickname ?? '') || email !== (user.email ?? ''));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDone(false);
    setSaving(true);

    try {
      // 바뀐 필드만 보낸다. null은 "변경 안 함"을 의미한다.
      await updateProfile({
        nickname: nickname !== user.nickname ? nickname : null,
        email: email !== (user.email ?? '') ? email : null,
      });
      await refreshUser();
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <main className='page'>
      <h1 className='page__title'>{t('profile.title')}</h1>

      <form className='profile-form' onSubmit={handleSubmit}>
        <div className='field'>
          <label htmlFor='username'>{t('profile.username')}</label>
          <input id='username' value={user.username} disabled />
          <p className='field__hint'>{t('profile.usernameHint')}</p>
        </div>

        <div className='field'>
          <label htmlFor='phone'>{t('profile.phone')}</label>
          <input id='phone' value={user.phoneNumber} disabled />
          <p className='field__hint'>
            {t('profile.phoneHint')}
          </p>
        </div>

        <div className='field'>
          <label htmlFor='nickname'>{t('profile.nickname')}</label>
          <input
            id='nickname'
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={2}
            maxLength={12}
            required
          />
          <p className='field__hint'>{t('profile.nicknameHint')}</p>
        </div>

        <div className='field'>
          <label htmlFor='email'>{t('profile.email')}</label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('common.optionalInput')}
          />
        </div>

        {error && <p className='form-msg form-msg--error'>{error}</p>}
        {done && <p className='form-msg form-msg--ok'>{t('profile.saved')}</p>}

        <div className='profile-form__actions'>
          <button
            type='button'
            className='btn btn-ghost'
            onClick={() => navigate('/')}
          >
            {t('common.back')}
          </button>
          <button
            type='submit'
            className='btn btn-solid'
            disabled={!dirty || saving}
          >
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </div>
      </form>
    </main>
  );
}
