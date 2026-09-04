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
      setError('아이디 중복확인을 먼저 진행해주세요.');
      return;
    }
    if (!nicknameAvailable) {
      setError('닉네임 중복확인을 먼저 진행해주세요.');
      return;
    }
    if (!phoneVerified) {
      setError('휴대폰 인증을 먼저 완료해주세요.');
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
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
    <AuthLayout
      title='회원가입'
      subtitle='아이디로 로그인하고, 익명 채팅도 자유롭게 즐겨보세요.'
    >
      <form className='auth-form' onSubmit={handleSubmit}>
        {error && <div className='banner banner-error'>{error}</div>}

        <DuplicateCheckField
          id='username'
          label='아이디'
          placeholder='영문/숫자, 4~20자'
          value={form.username}
          onChange={(value) =>
            setForm((prev) => ({ ...prev, username: value }))
          }
          checkAvailable={checkUsernameAvailable}
          onAvailabilityChange={setUsernameAvailable}
        />

        <div className='field-row'>
          <div className='field'>
            <label htmlFor='password'>비밀번호</label>
            <input
              id='password'
              type='password'
              className='text-input'
              placeholder='8자 이상'
              value={form.password}
              onChange={update('password')}
              required
            />
          </div>
          <div className='field'>
            <label htmlFor='passwordConfirm'>비밀번호 확인</label>
            <input
              id='passwordConfirm'
              type='password'
              className='text-input'
              value={form.passwordConfirm}
              onChange={update('passwordConfirm')}
              required
            />
            {passwordMismatch && (
              <span className='field-error'>비밀번호가 일치하지 않습니다.</span>
            )}
          </div>
        </div>

        <DuplicateCheckField
          id='nickname'
          label='닉네임'
          placeholder='채팅에 표시될 이름, 2~12자'
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
          <label htmlFor='email'>이메일 (선택)</label>
          <input
            id='email'
            type='email'
            className='text-input'
            placeholder='선택 입력'
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <button
          type='submit'
          className='btn btn-primary btn-block'
          disabled={loading}
        >
          {loading ? '가입하는 중...' : '가입하기'}
        </button>
      </form>

      <div className='auth-footer'>
        이미 계정이 있으신가요?{' '}
        <Link to='/login' className='link'>
          로그인
        </Link>
      </div>
    </AuthLayout>
  );
}
