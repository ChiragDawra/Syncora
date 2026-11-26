import api from './client';

export const register = (body) => api.post('/auth/register', body);
export const login = (body) => api.post('/auth/login', body);
export const getMe = () => api.get('/auth/me');
export const updateMe = (body) => api.patch('/auth/me', body);
export const changePassword = (body) => api.patch('/auth/me/password', body);
export const uploadAvatar = (file, onUploadProgress) => {
  const form = new FormData();
  form.append('avatar', file);
  return api.post('/auth/me/avatar', form, { onUploadProgress });
};
