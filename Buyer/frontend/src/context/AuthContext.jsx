/**
 * Auth Context (Buyer Module)
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
    const savedToken = localStorage.getItem('ddrems_buyer_token');
    const savedUser = localStorage.getItem('ddrems_buyer_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('ddrems_buyer_token');
        localStorage.removeItem('ddrems_buyer_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = response.data.data;

    localStorage.setItem('ddrems_buyer_token', newToken);
    localStorage.setItem('ddrems_buyer_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { token: newToken, user: newUser } = response.data.data;

    localStorage.setItem('ddrems_buyer_token', newToken);
    localStorage.setItem('ddrems_buyer_user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('ddrems_buyer_token');
    localStorage.removeItem('ddrems_buyer_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isBuyer = user?.role === 'buyer';

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isBuyer,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
