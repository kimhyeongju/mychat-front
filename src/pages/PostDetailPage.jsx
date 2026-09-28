import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  deletePost,
  downloadAttachment,
  getAttachments,
  getPost,
} from '../api/board';
import CommentSection from '../components/CommentSection';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PostDetailPage() {
  const { slug, postId } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    getPost(slug, postId)
      .then(setPost)
      .catch((err) => setError(err.message));

    getAttachments(postId)
      .then(setAttachments)
      .catch(() => setAttachments([]));
  }, [slug, postId]);

  useEffect(load, [load]);

  const handleDelete = async () => {
    if (
      !window.confirm('이 글을 삭제할까요? 댓글과 첨부파일도 함께 사라집니다.')
    ) {
      return;
    }

    setDeleting(true);
    try {
      await deletePost(slug, postId);
      navigate(`/boards/${slug}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const handleDownload = async (attachmentId) => {
    try {
      await downloadAttachment(attachmentId);
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !post) {
    return (
      <main className='page page--wide'>
        <p className='form-msg form-msg--error'>{error}</p>
        <Link to={`/boards/${slug}`} className='btn btn-ghost'>
          목록으로
        </Link>
      </main>
    );
  }

  if (!post) {
    return (
      <main className='page page--wide'>
        <p className='muted'>불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className='page page--wide'>
      <article className='post'>
        <header className='post__header'>
          <h1 className='post__title'>{post.title}</h1>
          <div className='post__meta'>
            <span>{post.authorNickname}</span>
            <span>{formatDateTime(post.createdAt)}</span>
            <span>조회 {post.viewCount}</span>
          </div>
        </header>

        {/* 사용자 입력이므로 dangerouslySetInnerHTML을 쓰지 않는다.
            white-space: pre-wrap으로 줄바꿈만 살린다. */}
        <div className='post__content'>{post.content}</div>

        {attachments.length > 0 && (
          <section className='attachments'>
            <h2 className='attachments__title'>첨부파일</h2>
            <ul className='attachments__list'>
              {attachments.map((file) => (
                <li key={file.id}>
                  <button
                    type='button'
                    className='attachments__item'
                    onClick={() => handleDownload(file.id)}
                  >
                    <span aria-hidden='true'>📎</span>
                    {file.originalName}
                    <span className='muted'>
                      ({formatSize(file.sizeBytes)})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {error && <p className='form-msg form-msg--error'>{error}</p>}

        <div className='post__actions'>
          <Link to={`/boards/${slug}`} className='btn btn-ghost'>
            목록
          </Link>
          {post.editable && (
            <>
              <Link
                to={`/boards/${slug}/posts/${postId}/edit`}
                className='btn btn-ghost'
              >
                수정
              </Link>
              <button
                type='button'
                className='btn btn-danger'
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </>
          )}
        </div>
      </article>

      <CommentSection postId={postId} />
    </main>
  );
}
