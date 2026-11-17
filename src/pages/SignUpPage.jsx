import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  checkNicknameAvailable,
  checkUsernameAvailable,
  signUp,
} from '../api/auth';
import AuthLayout from '../components/AuthLayout';
import DuplicateCheckField from '../components/DuplicateCheckField';
import PhoneVerifyField from '../components/PhoneVerifyField';
import PasswordRules from '../components/PasswordRules';
import { useI18n } from '../context/LanguageContext';
import { validatePassword } from '../utils/password';
import { isValidUsername } from '../utils/username';

const initialForm = {
  username: '',
  password: '',
  passwordConfirm: '',
  nickname: '',
  phoneNumber: '',
  email: '',
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [form, setForm] = useState(initialForm);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const passwordMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!usernameAvailable) {
      setError(t('signup.needUsernameCheck'));
      return;
    }
    if (!nicknameAvailable) {
      setError(t('signup.needNicknameCheck'));
      return;
    }
    if (!phoneVerified) {
      setError(t('phone.needVerify'));
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError(t('signup.passwordMismatch'));
      return;
    }
    const passwordError = validatePassword(form.password, t);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    try {
      await signUp(form);
      navigate('/login', { state: { signedUp: true } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('signup.title')} subtitle={t('signup.subtitle')}>
      <form className='auth-form' onSubmit={handleSubmit}>
        {error && <div className='banner banner-error'>{error}</div>}

        <DuplicateCheckField
          id='username'
          label={t('signup.username')}
          placeholder={t('signup.usernamePlaceholder')}
          validate={(v) => (isValidUsername(v) ? '' : t('username.rule'))}
          value={form.username}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, username: value }))
          }
          checkAvailable={checkUsernameAvailable}
          onAvailabilityChange={setUsernameAvailable}
        />

        <div className='field-row'>
          <div className='field'>
            <label htmlFor='password'>{t('signup.password')}</label>
            <input
              id='password'
              type='password'
              className='text-input'
              placeholder={t('pw.hint')}
              value={form.password}
              onChange={update('password')}
              required
            />
            <PasswordRules password={form.password} />
          </div>
          <div className='field'>
            <label htmlFor='passwordConfirm'>{t('signup.passwordConfirm')}</label>
            <input
              id='passwordConfirm'
              type='password'
              className='text-input'
              value={form.passwordConfirm}
              onChange={update('passwordConfirm')}
              required
            />
            {passwordMismatch && (
              <span className='field-error'>
                {t('signup.passwordMismatch')}
              </span>
            )}
          </div>
        </div>

        <DuplicateCheckField
          id='nickname'
          label={t('signup.nickname')}
          placeholder={t('signup.nicknamePlaceholder')}
          value={form.nickname}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, nickname: value }))
          }
          checkAvailable={checkNicknameAvailable}
          onAvailabilityChange={setNicknameAvailable}
        />

        <PhoneVerifyField
          phoneNumber={form.phoneNumber}
          onChangePhoneNumber={(value) =>
            setForm((prev) => ({ ...prev, phoneNumber: value }))
          }
          verified={phoneVerified}
          onVerified={() => setPhoneVerified(true)}
        />

        <div className='field'>
          <label htmlFor='email'>{t('signup.email')}</label>
          <input
            id='email'
            type='email'
            className='text-input'
            placeholder={t('common.optionalInput')}
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <button
          type='submit'
          className='btn btn-primary btn-block'
          disabled={loading}
        >
          {loading ? t('signup.submitting') : t('signup.submit')}
        </button>
      </form>

      <div className='auth-footer'>
        {t('signup.haveAccount')}{' '}
        <Link to='/login' className='link'>
          {t('nav.login')}
        </Link>
      </div>
    </AuthLayout>
  );
}
