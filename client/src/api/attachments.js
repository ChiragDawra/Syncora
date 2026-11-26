import api from './client';

export const uploadAttachments = (taskId, files, onUploadProgress) => {
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  return api.post(`/tasks/${taskId}/attachments`, form, { onUploadProgress, timeout: 120000 });
};
export const deleteAttachment = (taskId, attachmentId) => api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
