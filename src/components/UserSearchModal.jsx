import { useEffect, useState } from 'react';
import { searchUsers } from '../api/user';

export default function UserSearchModal({ onSelect, onClose }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  // 입력할 때마다 요청하지 않도록 300ms 디바운스를 건다.
  useEffect(() => {
    if (keyword.trim().length < 2) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(() => {
      searchUsers(keyword.trim())
        .then(setResults)
        .catch((err) => setError(err.message));
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const onEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose]);

  return (
    <div className='modal' onClick={onClose}>
      <div
        className='modal__panel'
        role='dialog'
        aria-modal='true'
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='modal__title'>새 대화 시작</h2>

        <input
          className='modal__input'
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder='닉네임 2자 이상 입력'
          autoFocus
        />

        {error && <p className='form-msg form-msg--error'>{error}</p>}

        {keyword.trim().length >= 2 && results.length === 0 && !error && (
          <p className='muted'>검색 결과가 없습니다.</p>
        )}

        <ul className='modal__list'>
          {results.map((user) => (
            <li key={user.userId}>
              <button
                type='button'
                className='modal__item'
                onClick={() => onSelect(user)}
              >
                {user.nickname}
              </button>
            </li>
          ))}
        </ul>

        <div className='modal__actions'>
          <button type='button' className='btn btn-ghost' onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
