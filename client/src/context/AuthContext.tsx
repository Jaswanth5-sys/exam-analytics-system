import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  quickLogin: (role: UserRole) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('exam_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('exam_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      api.get<{ user: User }>('/auth/me')
        .then(res => {
          setUser(res.user);
          localStorage.setItem('exam_user', JSON.stringify(res.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    localStorage.setItem('exam_token', res.token);
    localStorage.setItem('exam_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const quickLogin = async (role: UserRole): Promise<User> => {
    const demoAccounts = {
      admin: { email: 'admin@exam.com', pass: 'admin123' },
      teacher: { email: 'teacher@exam.com', pass: 'teacher123' },
      student: { email: 'student@exam.com', pass: 'student123' },
    };
    const creds = demoAccounts[role];
    return login(creds.email, creds.pass);
  };

  const logout = () => {
    localStorage.removeItem('exam_token');
    localStorage.removeItem('exam_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.user);
      localStorage.setItem('exam_user', JSON.stringify(res.user));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        quickLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
