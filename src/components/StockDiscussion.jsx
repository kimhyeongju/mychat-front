import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createStockPost, getStockPosts } from '../api/invest';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import StockPostItem from './StockPostItem';

const POST_MAX = 1000;
const PAGE_SIZE = 20;

/** 종목 토론 탭: 글 목록(최신/인기), 글쓰기, 댓글, 좋아요. */
export default function StockDiscussion({ symbol }) {
  const { t } = useI18n();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [sort, setSort] = useState('latest');
  const [posts, setPosts] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 종목·정렬·로그인 상태가 바뀌면 처음부터 다시 받는다(liked/mine 이 달라지므로).
  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;
    setPosts(null);
    setError('');
    getStockPosts(symbol, { sort, page: 0, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setPosts(res.content);
        setPage(0);
        setHasMore(!res.last);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [symbol, sort, isAuthenticated, authLoading]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await getStockPosts(symbol, {
        sort,
        page: page + 1,
        size: PAGE_SIZE,
      });
      setPosts((prev) => {
        // 다음 쪽을 받는 사이 새 글이 올라오면 같은 글이 겹칠 수 있어 id 로 걸러낸다.
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.content.filter((p) => !seen.has(p.id))];
      });
      setPage(page + 1);
      setHasMore(!res.last);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [symbol, sort, page]);

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    setFormError('');
    try {
      const created = await createStockPost(symbol, draft);
      setDraft('');
      // 인기순에서는 좋아요 0 인 새 글이 맨 위에 오지 않으므로 최신순으로 바꿔 보여준다.
      if (sort === 'latest') {
        setPosts((prev) => [created, ...(prev ?? [])]);
      } else {
        setSort('latest');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const replacePost = (updated) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  const removePost = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className='discussion'>
      <p className='muted invest-note'>{t('disc.notice')}</p>

      {isAuthenticated ? (
        <form className='discussion__form' onSubmit={submit}>
          <textarea
            className='text-input post__textarea'
            value={draft}
            maxLength={POST_MAX}
            rows={3}
            placeholder={t('disc.placeholder', { symbol })}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className='discussion__form-row'>
            <span className='muted'>
              {draft.length}/{POST_MAX}
            </span>
            <button
              type='submit'
              className='btn btn-solid btn-sm'
              disabled={submitting || !draft.trim()}
            >
              {submitting ? t('disc.posting') : t('disc.post')}
            </button>
          </div>
          {formError && <p className='form-msg form-msg--error'>{formError}</p>}
        </form>
      ) : (
        <p className='muted'>
          {t('disc.loginToWrite1')}
          <Link to='/login' className='link'>
            {t('nav.login')}
          </Link>
          {t('disc.loginToWrite2')}
        </p>
      )}

      <div className='discussion__sort' role='tablist'>
        {['latest', 'popular'].map((s) => (
          <button
            key={s}
            type='button'
            role='tab'
            aria-selected={sort === s}
            className={`discussion__sort-btn ${sort === s ? 'is-active' : ''}`}
            onClick={() => setSort(s)}
          >
            {t(s === 'latest' ? 'disc.sortLatest' : 'disc.sortPopular')}
          </button>
        ))}
      </div>

      {error && <p className='form-msg form-msg--error'>{error}</p>}
      {!posts && !error && <p className='muted'>{t('inv.loading')}</p>}
      {posts?.length === 0 && <p className='muted empty'>{t('disc.empty')}</p>}

      {posts && posts.length > 0 && (
        <ul className='post-list'>
          {posts.map((p) => (
            <StockPostItem
              key={p.id}
              post={p}
              onChange={replacePost}
              onDelete={removePost}
            />
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type='button'
          className='btn btn-ghost'
          onClick={loadMore}
          disabled={loadingMore}
        >
          {t('pf.more')}
        </button>
      )}
    </div>
  );
}
