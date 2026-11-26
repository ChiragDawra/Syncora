import api from './client';

export const listTasks = (boardId, params, cfg) => api.get(`/boards/${boardId}/tasks`, { params, ...cfg });
export const createTask = (boardId, body) => api.post(`/boards/${boardId}/tasks`, body);
export const listMyTasks = (params, cfg) => api.get('/tasks/mine', { params, ...cfg });
export const getTask = (taskId, cfg) => api.get(`/tasks/${taskId}`, cfg);
export const updateTask = (taskId, body) => api.patch(`/tasks/${taskId}`, body);
export const moveTask = (taskId, body) => api.patch(`/tasks/${taskId}/move`, body);
export const deleteTask = (taskId) => api.delete(`/tasks/${taskId}`);
