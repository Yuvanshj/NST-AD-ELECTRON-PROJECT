import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePersona, setActivePersona] = useState('ALUMNI');

  // Load initial colleges & pre-login Hardik Patel as initial active persona
  useEffect(() => {
    async function init() {
      try {
        const collegeRes = await api.auth.getColleges();
        if (collegeRes.colleges) {
          setColleges(collegeRes.colleges);
        }

        // Login default persona (Hardik Patel, verified alumni)
        const loginRes = await api.auth.login('hardik.patel@alum.ldce.ac.in', 'Password@123');
        if (loginRes.user) {
          setCurrentUser(loginRes.user);
          setActivePersona(loginRes.user.role);
        }
      } catch (err) {
        console.warn('Initial auth load failed, attempting fallback to directory:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Quick Persona switcher for hackathon evaluators
  const switchPersona = async (personaRole) => {
    setLoading(true);
    let email = 'hardik.patel@alum.ldce.ac.in';
    if (personaRole === 'STUDENT') {
      email = 'meet.joshi@student.ldce.ac.in';
    } else if (personaRole === 'COLLEGE_ADMIN') {
      email = 'alumni.admin@ldce.ac.in';
    } else if (personaRole === 'STATE_DIRECTOR') {
      email = 'superadmin@gujarat.gov.in';
    } else if (personaRole === 'PENDING_ALUMNI') {
      email = 'rahul.vyas@gmail.com';
    }

    try {
      const res = await api.auth.login(email, 'Password@123');
      if (res.user) {
        setCurrentUser(res.user);
        setActivePersona(personaRole);
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res.user) {
      setCurrentUser(res.user);
      setActivePersona(res.user.role);
    }
    return res;
  };

  const logout = () => {
    setCurrentUser(null);
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

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        colleges,
        loading,
        activePersona,
        switchPersona,
        login,
        logout,
        refreshProfile,
        setCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
