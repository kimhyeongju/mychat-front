import { apiDownload, apiRequest } from './client';

// ---------- 게시판 ----------

export function getBoards() {
  return apiRequest('/api/boards');
}

export function getBoard(slug) {
  return apiRequest(`/api/boards/${slug}`);
}

// ---------- 글 ----------

/**
 * @param {string} slug
 * @param {object} params
 * @param {number} params.page - 0부터 시작
 * @param {number} params.size
 * @param {string} params.keyword - 제목 검색어
 */
export function getPosts(slug, { page = 0, size = 20, keyword } = {}) {
  const query = new URLSearchParams({ page, size });
  if (keyword?.trim()) query.set('keyword', keyword.trim());

  return apiRequest(`/api/boards/${slug}/posts?${query}`);
}

/** 비로그인도 호출 가능하지만, 토큰이 있으면 editable 판정과 조회수 중복 방지에 쓰인다. */
export function getPost(slug, postId) {
  return apiRequest(`/api/boards/${slug}/posts/${postId}`, { auth: true });
}

export function createPost(slug, { title, content }) {
  return apiRequest(`/api/boards/${slug}/posts`, {
    method: 'POST',
    body: { title, content },
    auth: true,
  });
}

export function updatePost(slug, postId, { title, content }) {
  return apiRequest(`/api/boards/${slug}/posts/${postId}`, {
    method: 'PATCH',
    body: { title, content },
    auth: true,
  });
}

export function deletePost(slug, postId) {
  return apiRequest(`/api/boards/${slug}/posts/${postId}`, {
    method: 'DELETE',
    auth: true,
  });
}

// ---------- 댓글 ----------

export function getComments(postId) {
  return apiRequest(`/api/posts/${postId}/comments`, { auth: true });
}

export function createComment(postId, content) {
  return apiRequest(`/api/posts/${postId}/comments`, {
    method: 'POST',
    body: { content },
    auth: true,
  });
}

export function updateComment(postId, commentId, content) {
  return apiRequest(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    body: { content },
    auth: true,
  });
}

export function deleteComment(postId, commentId) {
  return apiRequest(`/api/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
    auth: true,
  });
}

// ---------- 첨부파일 ----------

export function getAttachments(postId) {
  return apiRequest(`/api/posts/${postId}/attachments`);
}

export function uploadAttachment(postId, file) {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest(`/api/posts/${postId}/attachments`, {
    method: 'POST',
    body: formData,
    auth: true,
  });
}

export function deleteAttachment(attachmentId) {
  return apiRequest(`/api/attachments/${attachmentId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/**
 * 첨부를 내려받아 브라우저 다운로드를 트리거한다.
 * a 태그로 직접 링크를 걸면 원본 파일명과 인증 헤더를 다루기 어려워서 이 방식을 쓴다.
 */
export async function downloadAttachment(attachmentId) {
  const { blob, filename } = await apiDownload(
    `/api/attachments/${attachmentId}`,
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
