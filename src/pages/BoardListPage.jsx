import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBoards } from '../api/board';

export default function BoardListPage() {
  const [boards, setBoards] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBoards()
      .then(setBoards)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className='page page--wide'>
      <h1 className='page__title'>게시판</h1>

      {loading && <p className='muted'>불러오는 중...</p>}
      {error && <p className='form-msg form-msg--error'>{error}</p>}

      <div className='board-list'>
        {boards.map((board) => (
          <Link
            key={board.slug}
            to={`/boards/${board.slug}`}
            className='board-item'
          >
            <div className='board-item__head'>
              <span className='board-item__name'>{board.name}</span>
              {board.adminOnly && <span className='tag'>공지</span>}
            </div>
            {board.description && (
              <span className='board-item__desc'>{board.description}</span>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
}
