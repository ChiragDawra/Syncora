import { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import * as authApi from '../api/auth';

export const AuthContext = createContext(null);

// status: checking (restoring the session) | authenticated | anonymous
const initial = { user: null, token: localStorage.getItem('token'), status: 'checking' };

// useReducer: the auth state machine
function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'SESSION_RESTORED':
      return { ...state, user: action.user, token: action.token ?? state.token, status: 'authenticated' };
    case 'LOGOUT':
      return { user: null, token: null, status: 'anonymous' };
    case 'USER_UPDATED':
      return { ...state, user: action.user };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initial);

  // App start: restore the session from the saved token
  useEffect(() => {
    if (!initial.token) {
      dispatch({ type: 'LOGOUT' });
      return;
    }
    authApi
      .getMe()
      .then((res) => dispatch({ type: 'SESSION_RESTORED', user: res.data.user }))
      .catch(() => {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      });
  }, []);

  // The Axios interceptor fires this on any 401
  useEffect(() => {
    const onLogout = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const saveSession = useCallback((user, token) => {
    localStorage.setItem('token', token);
    dispatch({ type: 'LOGIN_SUCCESS', user, token });
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login({ email, password });
      saveSession(res.data.user, res.data.token);
      return res.data.user;
    },
    [saveSession]
  );

  const register = useCallback(
    async (data) => {
      const res = await authApi.register(data);
      saveSession(res.data.user, res.data.token);
      return res.data.user;
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token'); // JWT is stateless: logging out = forgetting the token
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((user) => dispatch({ type: 'USER_UPDATED', user }), []);

  const value = useMemo(
    () => ({ user: state.user, status: state.status, login, register, logout, updateUser, saveSession }),
    [state.user, state.status, login, register, logout, updateUser, saveSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
