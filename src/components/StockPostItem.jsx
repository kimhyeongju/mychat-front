import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createPostComment,
  deletePostComment,
  deleteStockPost,
  getPostComments,
  setPostLike,
  updateStockPost,
} from '../api/invest';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/LanguageContext';
import RankingNickname from './RankingNickname';

const POST_MAX = 1000;
const COMMENT_MAX = 500;

/** 토론 글 한 건: 좋아요, 댓글, 수정, 삭제. 변경 결과는 부모에 알려 목록과 맞춘다. */
export default function StockPostItem({ post, onChange, onDelete }) {
  const { t, locale } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [liking, setLiking] = useState(false);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commenting, setCommenting] = useState(false);

  const canDelete = post.mine || user?.admin;

  const requireLogin = () => {
    window.alert(t('inv.loginRequired'));
    navigate('/login');
  };

  const toggleLike = async () => {
    if (!isAuthenticated) {
      requireLogin();
      return;
    }
    setLiking(true);
    setError('');
    try {
      const result = await setPostLike(post.id, !post.liked);
      onChange({ ...post, liked: result.liked, likeCount: result.likeCount });
    } catch (err) {
      setError(err.message);
    } finally {
      setLiking(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateStockPost(post.id, draft);
      onChange(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t('disc.confirmDelete'))) return;
    setError('');
    try {
      await deleteStockPost(post.id);
      onDelete(post.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadComments = () =>
    getPostComments(post.id)
      .then(setComments)
      .catch((err) => setError(err.message));

  const toggleComments = () => {
    const next = !commentsOpen;
    setCommentsOpen(next);
    if (next && comments === null) loadComments();
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!commentDraft.trim()) return;
    setCommenting(true);
    setError('');
    try {
      const created = await createPostComment(post.id, commentDraft);
      setComments((prev) => [...(prev ?? []), created]);
      setCommentDraft('');
      onChange({ ...post, commentCount: post.commentCount + 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setCommenting(false);
    }
  };

  const removeComment = async (comment) => {
    if (!window.confirm(t('disc.confirmDelete'))) return;
    setError('');
    try {
      await deletePostComment(comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      onChange({ ...post, commentCount: Math.max(post.commentCount - 1, 0) });
    } catch (err) {
      setError(err.message);
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleString(locale, {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <li className='post'>
      <div className='post__head'>
        <RankingNickname
          userId={post.authorId}
          nickname={post.authorNickname}
          withdrawn={post.authorNickname === '(탈퇴한 사용자)'}
        />
        <span className='muted post__time'>
          {formatTime(post.createdAt)}
          {post.edited && ` ${t('disc.edited')}`}
        </span>
      </div>

      {editing ? (
        <form className='post__edit' onSubmit={saveEdit}>
          <textarea
            className='text-input post__textarea'
            value={draft}
            maxLength={POST_MAX}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
          />
          <div className='post__actions'>
            <button
              type='submit'
              className='btn btn-solid btn-sm'
              disabled={saving || !draft.trim()}
            >
              {t('disc.save')}
            </button>
            <button
              type='button'
              className='btn btn-ghost btn-sm'
              onClick={() => {
                setEditing(false);
                setDraft(post.content);
              }}
            >
              {t('disc.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <p className='post__content'>{post.content}</p>
      )}

      <div className='post__actions'>
        <button
          type='button'
          className={`post__action ${post.liked ? 'is-on' : ''}`}
          onClick={toggleLike}
          disabled={liking}
          aria-pressed={post.liked}
          aria-label={t('disc.like')}
        >
          {post.liked ? '♥' : '♡'} {post.likeCount}
        </button>
        <button
          type='button'
          className='post__action'
          onClick={toggleComments}
          aria-expanded={commentsOpen}
        >
          💬 {t('disc.comments', { n: post.commentCount })}
        </button>
        {post.mine && !editing && (
          <button
            type='button'
            className='post__action'
            onClick={() => {
              setDraft(post.content);
              setEditing(true);
            }}
          >
            {t('disc.edit')}
          </button>
        )}
        {canDelete && (
          <button type='button' className='post__action post__action--danger' onClick={remove}>
            {t('disc.delete')}
          </button>
        )}
      </div>

      {error && <p className='form-msg form-msg--error'>{error}</p>}

      {commentsOpen && (
        <div className='comments'>
          {comments === null && <p className='muted'>{t('inv.loading')}</p>}
          {comments?.length === 0 && (
            <p className='muted'>{t('disc.noComments')}</p>
          )}
          <ul className='comments__list'>
            {comments?.map((c) => (
              <li key={c.id} className='comment'>
                <div className='comment__head'>
                  <RankingNickname
                    userId={c.authorId}
                    nickname={c.authorNickname}
                    withdrawn={c.authorNickname === '(탈퇴한 사용자)'}
                  />
                  <span className='muted post__time'>{formatTime(c.createdAt)}</span>
                  {(c.mine || user?.admin) && (
                    <button
                      type='button'
                      className='post__action post__action--danger'
                      onClick={() => removeComment(c)}
                    >
                      {t('disc.delete')}
                    </button>
                  )}
                </div>
                <p className='post__content'>{c.content}</p>
              </li>
            ))}
          </ul>

          {isAuthenticated ? (
            <form className='comments__form' onSubmit={addComment}>
              <input
                className='text-input'
                value={commentDraft}
                maxLength={COMMENT_MAX}
                placeholder={t('disc.commentPlaceholder')}
                onChange={(e) => setCommentDraft(e.target.value)}
              />
              <button
                type='submit'
                className='btn btn-solid btn-sm'
                disabled={commenting || !commentDraft.trim()}
              >
                {t('disc.post')}
              </button>
            </form>
          ) : (
            <p className='muted'>
              {t('disc.loginToComment1')}
              <Link to='/login' className='link'>
                {t('nav.login')}
              </Link>
              {t('disc.loginToComment2')}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
