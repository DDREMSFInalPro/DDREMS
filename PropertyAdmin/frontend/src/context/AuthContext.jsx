import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ddrems_admin_token');
    const savedUser = localStorage.getItem('ddrems_admin_user');
    if (savedToken && savedUser) {
      try { setToken(savedToken); setUser(JSON.parse(savedUser)); } catch { localStorage.removeItem('ddrems_admin_token'); localStorage.removeItem('ddrems_admin_user'); }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token: t, user: u } = response.data.data;
    localStorage.setItem('ddrems_admin_token', t);
    localStorage.setItem('ddrems_admin_user', JSON.stringify(u));
    setToken(t); setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('ddrems_admin_token');
    localStorage.removeItem('ddrems_admin_user');
    setToken(null); setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
