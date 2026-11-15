import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createUser, deleteUser, listUsers, updateUser } from '../api/admin';
import '../styles/admin.css';

const EMPTY_FORM = { username: '', password: '', nickname: '', phoneNumber: '', email: '' };

export default function AdminUsersPage() {
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // 수정 중인 회원

  const load = useCallback(() => {
    listUsers({ q: query, page })
      .then((res) => {
        setData(res);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  const search = (e) => {
    e.preventDefault();
    setPage(0);
    setQuery(keyword);
  };

  const handleDelete = async (u) => {
    const ok = window.confirm(
      `'${u.username}' (${u.nickname}) 회원을 삭제할까요?\n` +
        '탈퇴 처리되며 모의투자 계좌, 거래 내역, 관심 종목, 주간 성적도 함께 삭제됩니다.\n' +
        '되돌릴 수 없습니다.',
    );
    if (!ok) return;
    try {
      await deleteUser(u.id);
      setNotice(`${u.username} 회원을 삭제했습니다.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className='page page--wide admin'>
      <div className='page__header'>
        <div className='invest__title-row'>
          <Link to='/' className='btn btn-ghost btn-sm'>
            ← 홈
          </Link>
          <h1 className='page__title'>사용자 관리</h1>
        </div>
        <button
          type='button'
          className='btn btn-solid btn-sm'
          onClick={() => {
            setNotice('');
            setCreating(true);
          }}
        >
          사용자 추가
        </button>
      </div>

      <form className='admin__search' onSubmit={search}>
        <input
          className='text-input'
          placeholder='아이디 또는 닉네임 검색'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type='submit' className='btn btn-ghost'>
          검색
        </button>
      </form>

      {notice && <p className='form-msg'>{notice}</p>}
      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!data && !error && <p className='muted'>불러오는 중...</p>}

      {data && (
        <section className='invest-card'>
          <div className='invest-table-wrap'>
            <table className='invest-table'>
              <thead>
                <tr>
                  <th>아이디</th>
                  <th>닉네임</th>
                  <th>전화번호</th>
                  <th>가입일</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.content.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.username}
                      {u.admin && <span className='tag'>운영자</span>}
                    </td>
                    <td>{u.nickname}</td>
                    <td>
                      {u.phoneNumber}
                      {u.phoneNumber.startsWith('00') && (
                        <span className='tag tag--warn'>임시</span>
                      )}
                    </td>
                    <td className='muted'>
                      {u.createdAt ? u.createdAt.slice(0, 10) : '-'}
                    </td>
                    <td className='admin__actions'>
                      {!u.admin && (
                        <>
                          <button
                            type='button'
                            className='btn btn-ghost btn-sm'
                            onClick={() => {
                              setNotice('');
                              setEditing(u);
                            }}
                          >
                            수정
                          </button>
                          <button
                            type='button'
                            className='btn btn-danger btn-sm'
                            onClick={() => handleDelete(u)}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.content.length === 0 && (
            <p className='muted empty'>조건에 맞는 사용자가 없습니다.</p>
          )}

          <div className='admin__pager'>
            <button
              type='button'
              className='btn btn-ghost btn-sm'
              disabled={data.first}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </button>
            <span className='muted'>
              {data.page + 1} / {Math.max(data.totalPages, 1)} · 총{' '}
              {data.totalElements}명
            </span>
            <button
              type='button'
              className='btn btn-ghost btn-sm'
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </button>
          </div>
        </section>
      )}

      {creating && (
        <CreateDialog
          onClose={() => setCreating(false)}
          onDone={(u) => {
            setCreating(false);
            setNotice(`${u.username} 계정을 만들었습니다.`);
            setPage(0);
            load();
          }}
        />
      )}

      {editing && (
        <EditDialog
          user={editing}
          onClose={() => setEditing(null)}
          onDone={(u) => {
            setEditing(null);
            setNotice(`${u.username} 정보를 수정했습니다.`);
            load();
          }}
        />
      )}
    </main>
  );
}

function CreateDialog({ onClose, onDone }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await createUser({
        username: form.username.trim(),
        password: form.password,
        nickname: form.nickname.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        email: form.email.trim() || null,
      });
      onDone(created);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title='사용자 추가' onClose={onClose}>
      <form className='auth-form' onSubmit={submit}>
        <div className='field'>
          <label>아이디 (영문/숫자/_ 4~20자)</label>
          <input className='text-input' value={form.username} onChange={set('username')} required />
        </div>
        <div className='field'>
          <label>비밀번호 (규칙 없음, 1자 이상)</label>
          <input className='text-input' value={form.password} onChange={set('password')} required />
        </div>
        <div className='field'>
          <label>닉네임 (2~12자)</label>
          <input className='text-input' value={form.nickname} onChange={set('nickname')} required />
        </div>
        <div className='field'>
          <label>전화번호 (선택)</label>
          <input
            className='text-input'
            value={form.phoneNumber}
            onChange={set('phoneNumber')}
            placeholder='비워두면 임시 번호가 자동으로 들어갑니다'
            inputMode='numeric'
          />
        </div>
        <div className='field'>
          <label>이메일 (선택)</label>
          <input className='text-input' type='email' value={form.email} onChange={set('email')} />
        </div>
        {error && <p className='form-msg form-msg--error'>{error}</p>}
        <div className='admin__dialog-actions'>
          <button type='button' className='btn btn-ghost' onClick={onClose}>
            취소
          </button>
          <button type='submit' className='btn btn-solid' disabled={busy}>
            추가
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function EditDialog({ user, onClose, onDone }) {
  const [form, setForm] = useState({
    nickname: user.nickname,
    phoneNumber: user.phoneNumber,
    email: user.email ?? '',
    password: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await updateUser(user.id, {
        nickname: form.nickname.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        // 비워두면 비밀번호는 그대로 둔다.
        password: form.password === '' ? null : form.password,
      });
      onDone(updated);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Dialog title={`${user.username} 수정`} onClose={onClose}>
      <form className='auth-form' onSubmit={submit}>
        <div className='field'>
          <label>닉네임</label>
          <input className='text-input' value={form.nickname} onChange={set('nickname')} required />
        </div>
        <div className='field'>
          <label>전화번호</label>
          <input
            className='text-input'
            value={form.phoneNumber}
            onChange={set('phoneNumber')}
            inputMode='numeric'
            required
          />
        </div>
        <div className='field'>
          <label>이메일</label>
          <input className='text-input' type='email' value={form.email} onChange={set('email')} />
        </div>
        <div className='field'>
          <label>새 비밀번호 (바꿀 때만 입력)</label>
          <input
            className='text-input'
            value={form.password}
            onChange={set('password')}
            placeholder='비워두면 그대로 유지'
          />
          <span className='field-hint'>
            비밀번호를 바꾸면 이 회원의 기존 로그인은 끊깁니다.
          </span>
        </div>
        {error && <p className='form-msg form-msg--error'>{error}</p>}
        <div className='admin__dialog-actions'>
          <button type='button' className='btn btn-ghost' onClick={onClose}>
            취소
          </button>
          <button type='submit' className='btn btn-solid' disabled={busy}>
            저장
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function Dialog({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className='admin__overlay' onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className='admin__dialog' role='dialog' aria-label={title}>
        <h2 className='admin__dialog-title'>{title}</h2>
        {children}
      </div>
    </div>
  );
}
