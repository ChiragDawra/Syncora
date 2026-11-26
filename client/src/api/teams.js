import api from './client';

export const listTeams = () => api.get('/teams');
export const createTeam = (body) => api.post('/teams', body);
export const getTeam = (teamId, cfg) => api.get(`/teams/${teamId}`, cfg);
export const updateTeam = (teamId, body) => api.patch(`/teams/${teamId}`, body);
export const deleteTeam = (teamId) => api.delete(`/teams/${teamId}`);
export const addMember = (teamId, body) => api.post(`/teams/${teamId}/members`, body);
export const changeRole = (teamId, userId, role) => api.patch(`/teams/${teamId}/members/${userId}`, { role });
export const removeMember = (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`);
export const getDashboard = (teamId, cfg) => api.get(`/teams/${teamId}/dashboard`, cfg);
export const listActivity = (teamId, params, cfg) => api.get(`/teams/${teamId}/activity`, { params, ...cfg });
