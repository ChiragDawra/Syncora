import api from './client';

export const listComments = (taskId, params, cfg) => api.get(`/tasks/${taskId}/comments`, { params, ...cfg });
export const addComment = (taskId, text) => api.post(`/tasks/${taskId}/comments`, { text });
export const editComment = (commentId, text) => api.patch(`/comments/${commentId}`, { text });
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`);
