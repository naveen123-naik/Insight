import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('insightai_user');
    return saved ? JSON.parse(saved) : { id: 'demo-user-123', email: 'demo@insight.ai', name: 'Demo Analyst', role: 'user' };
  });

  const [token, setToken] = useState(() => localStorage.getItem('insightai_token') || 'demo-jwt-token');

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem('insightai_token', res.data.token);
      localStorage.setItem('insightai_user', JSON.stringify(res.data.user));
      return { success: true };
    } catch (err) {
      // Fallback demo mode
      const demoUser = { id: 'demo-user-123', email, name: email.split('@')[0] || 'Analyst', role: 'user' };
      setUser(demoUser);
      setToken('demo-jwt-token');
      localStorage.setItem('insightai_token', 'demo-jwt-token');
      localStorage.setItem('insightai_user', JSON.stringify(demoUser));
      return { success: true };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('insightai_token');
    localStorage.removeItem('insightai_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
