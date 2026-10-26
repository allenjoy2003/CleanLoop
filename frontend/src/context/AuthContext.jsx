import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cleanloop_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cleanloop_access_token'));
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get('/accounts/profile/');
      setUser(res.data);
      localStorage.setItem('cleanloop_user', JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  };

  const loginWithTokens = (userData, accessToken, refreshToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('cleanloop_access_token', accessToken);
    localStorage.setItem('cleanloop_refresh_token', refreshToken);
    localStorage.setItem('cleanloop_user', JSON.stringify(userData));
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('cleanloop_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/accounts/auth/signout/', { refresh: refreshToken });
      }
    } catch (err) {
      console.warn("Signout backend notice:", err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('cleanloop_access_token');
      localStorage.removeItem('cleanloop_refresh_token');
      localStorage.removeItem('cleanloop_user');
      toast.success("Signed out successfully.");
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.patch('/accounts/profile/', data);
      setUser(res.data);
      localStorage.setItem('cleanloop_user', JSON.stringify(res.data));
      toast.success("Profile updated!");
      return res.data;
    } catch (err) {
      toast.error("Failed to update profile.");
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      loginWithTokens,
      logout,
      fetchProfile,
      updateProfile,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
