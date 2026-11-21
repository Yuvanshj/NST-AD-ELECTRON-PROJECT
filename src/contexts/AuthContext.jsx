import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'otp' | 'forgot'

  // Initialize session: restore existing token or load colleges
  useEffect(() => {
    async function init() {
      try {
        const collegeRes = await api.auth.getColleges();
        if (collegeRes.colleges) {
          setColleges(collegeRes.colleges);
        }

        // Check if user has an active session token
        const existingToken = getAuthToken();
        if (existingToken) {
          try {
            const meRes = await api.auth.getMe();
            if (meRes.user) {
              setCurrentUser(meRes.user);
            }
          } catch (tokenErr) {
            console.warn('Existing session token invalid or expired, resetting:', tokenErr.message);
            setAuthToken(null);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.warn('Failed to load initial colleges or session:', err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res.user && res.token) {
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setShowAuthModal(false);
    }
    return res;
  };

  const loginWithOtp = async (email, otp) => {
    const res = await api.auth.verifyOtp(email, otp);
    if (res.user && res.token) {
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setShowAuthModal(false);
    }
    return res;
  };

  const register = async (payload) => {
    const res = await api.auth.register(payload);
    if (res.user && res.token) {
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setShowAuthModal(false);
    }
    return res;
  };

  const logout = async () => {
    try {
      if (currentUser) {
        await api.auth.logout().catch(() => {});
      }
    } finally {
      setAuthToken(null);
      setCurrentUser(null);
    }
  };

  const refreshProfile = async () => {
    if (currentUser?._id) {
      try {
        const res = await api.auth.getProfile(currentUser._id);
        if (res.user) {
          setCurrentUser(res.user);
        }
      } catch (e) {
        console.error('Failed to refresh profile:', e);
      }
    }
  };

  // Developer Quick Persona Launcher for hackathon evaluation (explicit user action, no auto-login)
  const quickLoginPersona = async (role) => {
    setLoading(true);
    let email = 'hardik.patel@alum.ldce.ac.in';
    if (role === 'STUDENT') {
      email = 'meet.joshi@student.ldce.ac.in';
    } else if (role === 'COLLEGE_ADMIN') {
      email = 'alumni.admin@ldce.ac.in';
    } else if (role === 'STATE_DIRECTOR' || role === 'SUPER_ADMIN') {
      email = 'superadmin@gujarat.gov.in';
    } else if (role === 'PENDING_ALUMNI') {
      email = 'rahul.vyas@gmail.com';
    }

    try {
      const res = await api.auth.login(email, 'Password@123');
      if (res.user && res.token) {
        setAuthToken(res.token);
        setCurrentUser(res.user);
        setShowAuthModal(false);
      }
    } catch (err) {
      console.error('Quick login failed:', err);
      alert('Could not authenticate persona: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        colleges,
        loading,
        showAuthModal,
        setShowAuthModal,
        authModalMode,
        setAuthModalMode,
        login,
        loginWithOtp,
        register,
        logout,
        refreshProfile,
        setCurrentUser,
        quickLoginPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
