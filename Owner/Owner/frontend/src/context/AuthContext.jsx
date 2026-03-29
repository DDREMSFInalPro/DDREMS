/**
 * Auth Context
 * Manages user authentication state across the application
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('ddrems_token');
    const savedUser = localStorage.getItem('ddrems_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Clear if wrong role for this portal
        if (parsedUser.role !== 'owner') {
          localStorage.removeItem('ddrems_token');
          localStorage.removeItem('ddrems_user');
        } else {
          setToken(savedToken);
          setUser(parsedUser);
        }
      } catch {
        localStorage.removeItem('ddrems_token');
        localStorage.removeItem('ddrems_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = response.data.data;

    localStorage.setItem('ddrems_token', newToken);
    localStorage.setItem('ddrems_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { token: newToken, user: newUser } = response.data.data;

    localStorage.setItem('ddrems_token', newToken);
    localStorage.setItem('ddrems_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('ddrems_token');
    localStorage.removeItem('ddrems_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isOwner = user?.role === 'owner';

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isOwner,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
