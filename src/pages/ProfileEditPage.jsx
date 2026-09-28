import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

export default function ProfileEditPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

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
      <h1 className='page__title'>회원정보 수정</h1>

      <form className='profile-form' onSubmit={handleSubmit}>
        <div className='field'>
          <label htmlFor='username'>아이디</label>
          <input id='username' value={user.username} disabled />
          <p className='field__hint'>아이디는 변경할 수 없습니다.</p>
        </div>

        <div className='field'>
          <label htmlFor='phone'>휴대폰</label>
          <input id='phone' value={user.phoneNumber} disabled />
          <p className='field__hint'>
            휴대폰 번호 변경은 본인 인증이 필요합니다.
          </p>
        </div>

        <div className='field'>
          <label htmlFor='nickname'>닉네임</label>
          <input
            id='nickname'
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            minLength={2}
            maxLength={12}
            required
          />
          <p className='field__hint'>2~12자</p>
        </div>

        <div className='field'>
          <label htmlFor='email'>이메일</label>
          <input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='선택 입력'
          />
        </div>

        {error && <p className='form-msg form-msg--error'>{error}</p>}
        {done && <p className='form-msg form-msg--ok'>저장했습니다.</p>}

        <div className='profile-form__actions'>
          <button
            type='button'
            className='btn btn-ghost'
            onClick={() => navigate('/')}
          >
            돌아가기
          </button>
          <button
            type='submit'
            className='btn btn-solid'
            disabled={!dirty || saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </main>
  );
}
