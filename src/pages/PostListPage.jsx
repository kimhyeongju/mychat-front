import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getBoard, getPosts } from '../api/board';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 20;

function formatDate(iso) {
  const date = new Date(iso);
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  // 오늘 쓴 글은 시각만, 그 외에는 날짜만 보여준다.
  return sameDay
    ? date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
}

export default function PostListPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const page = Number(searchParams.get('page') ?? 0);
  const keyword = searchParams.get('keyword') ?? '';

  const [board, setBoard] = useState(null);
  const [data, setData] = useState(null);
  const [searchInput, setSearchInput] = useState(keyword);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBoard(slug)
      .then(setBoard)
      .catch((err) => setError(err.message));
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    getPosts(slug, { page, size: PAGE_SIZE, keyword })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, page, keyword]);

  const handleSearch = (e) => {
    e.preventDefault();
    // 검색어가 바뀌면 첫 페이지부터 다시 본다.
    setSearchParams(searchInput.trim() ? { keyword: searchInput.trim() } : {});
  };

  const goPage = (next) => {
    const params = { page: next };
    if (keyword) params.keyword = keyword;
    setSearchParams(params);
  };

  return (
    <main className='page page--wide'>
      <div className='page__header'>
        <h1 className='page__title'>{board?.name ?? '게시판'}</h1>
        {(!board?.adminOnly || user?.admin) && isAuthenticated && (
          <Link to={`/boards/${slug}/write`} className='btn btn-solid'>
            글쓰기
          </Link>
        )}
      </div>

      <form className='search-bar' onSubmit={handleSearch}>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder='제목으로 검색'
        />
        <button type='submit' className='btn btn-ghost'>
          검색
        </button>
      </form>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {loading && <p className='muted'>불러오는 중...</p>}

      {data && data.content.length === 0 && (
        <p className='muted empty'>
          {keyword ? '검색 결과가 없습니다.' : '아직 글이 없습니다.'}
        </p>
      )}

      {data && data.content.length > 0 && (
        <ul className='post-list'>
          {data.content.map((post) => (
            <li key={post.id} className='post-row'>
              <Link
                to={`/boards/${slug}/posts/${post.id}`}
                className='post-row__title'
              >
                {post.title}
                {post.commentCount > 0 && (
                  <span className='post-row__comments'>
                    [{post.commentCount}]
                  </span>
                )}
              </Link>
              <span className='post-row__meta'>
                {post.authorNickname} · {formatDate(post.createdAt)} · 조회{' '}
                {post.viewCount}
              </span>
            </li>
          ))}
        </ul>
      )}

      {data && data.totalPages > 1 && (
        <div className='pagination'>
          <button
            type='button'
            className='btn btn-ghost'
            disabled={data.first}
            onClick={() => goPage(page - 1)}
          >
            이전
          </button>
          <span className='pagination__info'>
            {data.page + 1} / {data.totalPages}
          </span>
          <button
            type='button'
            className='btn btn-ghost'
            disabled={data.last}
            onClick={() => goPage(page + 1)}
          >
            다음
          </button>
        </div>
      )}
    </main>
  );
}
