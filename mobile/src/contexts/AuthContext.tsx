import React, { createContext, useContext, useState, useEffect } from 'react';
import { mobileApi } from '../services/api';
import { saveToken, getToken, removeToken, saveUser, getUser, clearAll } from '../services/storage';
import { User, College } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  colleges: College[];
  login: (email: string, password: string) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [colleges, setColleges] = useState<College[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // 1. Fetch colleges
      try {
        const colRes = await mobileApi.auth.getColleges();
        if (colRes.colleges) {
          setColleges(colRes.colleges);
        }
      } catch (colErr) {
        console.log('[Mobile Auth] Failed to load colleges:', colErr);
      }

      // 2. Restore token and user
      const storedToken = await getToken();
      if (storedToken) {
        setToken(storedToken);
        const storedUser = await getUser();
        if (storedUser) {
          setUser(storedUser);
        }

        // Validate session token with backend
        try {
          const meRes = await mobileApi.auth.getMe();
          if (meRes.user) {
            setUser(meRes.user);
            await saveUser(meRes.user);
          }
        } catch (meErr) {
          console.log('[Mobile Auth] Session expired, clearing storage');
          await clearAll();
          setToken(null);
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.auth.login(email, password);
      if (res.token && res.user) {
        await saveToken(res.token);
        await saveUser(res.user);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (email: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.auth.verifyOtp(email, otp);
      if (res.token && res.user) {
        await saveToken(res.token);
        await saveUser(res.user);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await mobileApi.auth.register(payload);
      if (res.token && res.user) {
        await saveToken(res.token);
        await saveUser(res.user);
        setToken(res.token);
        setUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await clearAll();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadUser = async () => {
    try {
      const meRes = await mobileApi.auth.getMe();
      if (meRes.user) {
        setUser(meRes.user);
        await saveUser(meRes.user);
      }
    } catch (e) {
      console.log('[Mobile Auth] Reload failed', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        colleges,
        login,
        loginWithOtp,
        register,
        logout,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useMobileAuth = () => useContext(AuthContext);
