import { useCallback, useEffect, useState } from 'react';
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from '../api/board';
import { useAuth } from '../context/AuthContext';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CommentSection({ postId }) {
  const { isAuthenticated } = useAuth();

  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getComments(postId)
      .then(setComments)
      .catch((err) => setError(err.message));
  }, [postId]);

  useEffect(load, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setBusy(true);
    setError('');
    try {
      await createComment(postId, input.trim());
      setInput('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditInput(comment.content);
  };

  const handleUpdate = async (commentId) => {
    if (!editInput.trim()) return;

    setBusy(true);
    setError('');
    try {
      await updateComment(postId, commentId, editInput.trim());
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;

    setBusy(true);
    setError('');
    try {
      await deleteComment(postId, commentId);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className='comments'>
      <h2 className='comments__title'>댓글 {comments.length}</h2>

      {error && <p className='form-msg form-msg--error'>{error}</p>}

      <ul className='comments__list'>
        {comments.map((comment) => (
          <li key={comment.id} className='comment'>
            <div className='comment__head'>
              <span className='comment__author'>{comment.authorNickname}</span>
              <span className='comment__date'>
                {formatDateTime(comment.createdAt)}
              </span>
            </div>

            {editingId === comment.id ? (
              <div className='comment__edit'>
                <textarea
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  maxLength={1000}
                  rows={3}
                />
                <div className='comment__actions'>
                  <button
                    type='button'
                    className='btn btn-ghost btn-sm'
                    onClick={() => setEditingId(null)}
                  >
                    취소
                  </button>
                  <button
                    type='button'
                    className='btn btn-solid btn-sm'
                    onClick={() => handleUpdate(comment.id)}
                    disabled={busy}
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className='comment__content'>{comment.content}</p>
                {comment.editable && (
                  <div className='comment__actions'>
                    <button
                      type='button'
                      className='link-btn'
                      onClick={() => startEdit(comment)}
                    >
                      수정
                    </button>
                    <button
                      type='button'
                      className='link-btn link-btn--danger'
                      onClick={() => handleDelete(comment.id)}
                      disabled={busy}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {comments.length === 0 && (
        <p className='muted empty'>첫 댓글을 남겨보세요.</p>
      )}

      {isAuthenticated ? (
        <form className='comment-form' onSubmit={handleCreate}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='댓글을 입력하세요'
            maxLength={1000}
            rows={3}
          />
          <div className='comment-form__footer'>
            <span className='muted'>{input.length} / 1000</span>
            <button
              type='submit'
              className='btn btn-solid'
              disabled={busy || !input.trim()}
            >
              등록
            </button>
          </div>
        </form>
      ) : (
        <p className='muted'>댓글을 쓰려면 로그인이 필요합니다.</p>
      )}
    </section>
  );
}
