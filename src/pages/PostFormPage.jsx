import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  createPost,
  deleteAttachment,
  getAttachments,
  getBoard,
  getPost,
  updatePost,
  uploadAttachment,
} from '../api/board';

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PostFormPage() {
  const { slug, postId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const isEdit = Boolean(postId);

  const [board, setBoard] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  /** 아직 업로드하지 않은 새 파일들 */
  const [newFiles, setNewFiles] = useState([]);
  /** 수정 모드에서 이미 서버에 올라가 있는 첨부 */
  const [existing, setExisting] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    getBoard(slug)
      .then(setBoard)
      .catch((err) => setError(err.message));
  }, [slug]);

  useEffect(() => {
    if (!isEdit) return;

    Promise.all([getPost(slug, postId), getAttachments(postId)])
      .then(([post, attachments]) => {
        if (!post.editable) {
          setError('이 글을 수정할 권한이 없습니다.');
          return;
        }
        setTitle(post.title);
        setContent(post.content);
        setExisting(attachments);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isEdit, slug, postId]);

  const totalCount = existing.length + newFiles.length;

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    // 같은 파일을 다시 고를 수 있도록 input 값을 비운다.
    e.target.value = '';

    const oversize = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (oversize) {
      setError(`파일 하나당 10MB까지 가능합니다: ${oversize.name}`);
      return;
    }

    if (totalCount + selected.length > MAX_ATTACHMENTS) {
      setError(`첨부는 최대 ${MAX_ATTACHMENTS}개까지 가능합니다.`);
      return;
    }

    setError('');
    setNewFiles((prev) => [...prev, ...selected]);
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExisting = async (attachmentId) => {
    if (!window.confirm('첨부파일을 삭제할까요?')) return;

    try {
      await deleteAttachment(attachmentId);
      setExisting((prev) => prev.filter((file) => file.id !== attachmentId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    setError('');

    try {
      const post = isEdit
        ? await updatePost(slug, postId, { title: title.trim(), content })
        : await createPost(slug, { title: title.trim(), content });

      // 글 저장이 끝난 뒤 새 파일을 순차 업로드한다.
      // 하나라도 실패하면 알리되, 글 자체는 이미 저장됐으므로 상세로 이동한다.
      const failed = [];
      for (const file of newFiles) {
        try {
          await uploadAttachment(post.id, file);
        } catch {
          failed.push(file.name);
        }
      }

      if (failed.length > 0) {
        window.alert(`다음 파일 업로드에 실패했습니다: ${failed.join(', ')}`);
      }

      navigate(`/boards/${slug}/posts/${post.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className='page page--wide'>
        <p className='muted'>불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className='page page--wide'>
      <h1 className='page__title'>
        {isEdit ? '글 수정' : `${board?.name ?? '게시판'} 글쓰기`}
      </h1>

      <form className='post-form' onSubmit={handleSubmit}>
        <div className='field'>
          <label htmlFor='title'>제목</label>
          <input
            id='title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder='제목을 입력하세요'
            required
          />
        </div>

        <div className='field'>
          <label htmlFor='content'>내용</label>
          <textarea
            id='content'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={20000}
            rows={16}
            placeholder='내용을 입력하세요'
            required
          />
          <p className='field__hint'>{content.length} / 20000</p>
        </div>

        <div className='field'>
          <label>첨부파일</label>

          {existing.length > 0 && (
            <ul className='file-list'>
              {existing.map((file) => (
                <li key={file.id} className='file-item'>
                  <span aria-hidden='true'>📎</span>
                  <span className='file-item__name'>{file.originalName}</span>
                  <span className='muted'>{formatSize(file.sizeBytes)}</span>
                  <button
                    type='button'
                    className='link-btn link-btn--danger'
                    onClick={() => removeExisting(file.id)}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}

          {newFiles.length > 0 && (
            <ul className='file-list'>
              {newFiles.map((file, index) => (
                <li key={`${file.name}-${index}`} className='file-item'>
                  <span aria-hidden='true'>📄</span>
                  <span className='file-item__name'>{file.name}</span>
                  <span className='muted'>{formatSize(file.size)}</span>
                  <button
                    type='button'
                    className='link-btn link-btn--danger'
                    onClick={() => removeNewFile(index)}
                  >
                    제거
                  </button>
                </li>
              ))}
            </ul>
          )}

          <input
            ref={fileInputRef}
            type='file'
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            type='button'
            className='btn btn-ghost'
            onClick={() => fileInputRef.current?.click()}
            disabled={totalCount >= MAX_ATTACHMENTS}
          >
            파일 선택 ({totalCount}/{MAX_ATTACHMENTS})
          </button>
          <p className='field__hint'>
            개당 10MB까지. 이미지, 문서, 압축파일만 가능합니다.
          </p>
        </div>

        {error && <p className='form-msg form-msg--error'>{error}</p>}

        <div className='post-form__actions'>
          <Link
            to={isEdit ? `/boards/${slug}/posts/${postId}` : `/boards/${slug}`}
            className='btn btn-ghost'
          >
            취소
          </Link>
          <button
            type='submit'
            className='btn btn-solid'
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </main>
  );
}
