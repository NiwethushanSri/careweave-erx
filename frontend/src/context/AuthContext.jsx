import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rxuser') || sessionStorage.getItem('rxuser')); } catch { return null; }
  });

  // On startup: if we have a token, silently refresh user from server
  // so storage never shows stale name/email
  useEffect(() => {
    const token = localStorage.getItem('rxtoken') || sessionStorage.getItem('rxtoken');
    if (!token) return;
    api.get('/auth/me').then(({ data }) => {
      const fresh = data.data.user;
      const store = localStorage.getItem('rxtoken') ? localStorage : sessionStorage;
      store.setItem('rxuser', JSON.stringify(fresh));
      setUser(fresh);
    }).catch(() => {});
  }, []);

  // remember=true persists across browser restarts (localStorage); remember=false
  // clears on browser close (sessionStorage)
  const login = useCallback(async (identifier, password, remember = true) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    other.removeItem('rxtoken');
    other.removeItem('rxuser');
    store.setItem('rxtoken', data.data.accessToken);
    store.setItem('rxuser', JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rxtoken');
    localStorage.removeItem('rxuser');
    sessionStorage.removeItem('rxtoken');
    sessionStorage.removeItem('rxuser');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      const updated = data.data.user;
      const store = localStorage.getItem('rxtoken') ? localStorage : sessionStorage;
      store.setItem('rxuser', JSON.stringify(updated));
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
