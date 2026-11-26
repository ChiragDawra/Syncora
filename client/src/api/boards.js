import api from './client';

export const listBoards = (teamId, params, cfg) => api.get(`/teams/${teamId}/boards`, { params, ...cfg });
export const createBoard = (teamId, body) => api.post(`/teams/${teamId}/boards`, body);
export const getBoard = (boardId, cfg) => api.get(`/boards/${boardId}`, cfg);
export const updateBoard = (boardId, body) => api.patch(`/boards/${boardId}`, body);
export const deleteBoard = (boardId) => api.delete(`/boards/${boardId}`);
export const getBoardStats = (boardId, cfg) => api.get(`/boards/${boardId}/stats`, cfg);
