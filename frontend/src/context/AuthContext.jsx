import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rxuser')); } catch { return null; }
  });

  // On startup: if we have a token, silently refresh user from server
  // so localStorage never shows stale name/email
  useEffect(() => {
    const token = localStorage.getItem('rxtoken');
    if (!token) return;
    api.get('/auth/me').then(({ data }) => {
      const fresh = data.data;
      localStorage.setItem('rxuser', JSON.stringify(fresh));
      setUser(fresh);
    }).catch(() => {});
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('rxtoken', data.data.accessToken);
    localStorage.setItem('rxuser', JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rxtoken');
    localStorage.removeItem('rxuser');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      const updated = data.data;
      localStorage.setItem('rxuser', JSON.stringify(updated));
      setUser(updated);
    } catch {}
  }, []);

  const isRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
