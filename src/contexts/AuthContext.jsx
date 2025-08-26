import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (token && tokenExpiry) {
      const now = new Date().getTime();
      const expiryTime = parseInt(tokenExpiry);
      
      if (now < expiryTime) {
        checkAuth();
      } else {
        // Token expired
        handleSessionExpiry();
      }
    } else {
      setLoading(false);
    }

    // Set up token expiry check interval
    const interval = setInterval(() => {
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      if (tokenExpiry) {
        const now = new Date().getTime();
        const expiryTime = parseInt(tokenExpiry);
        
        if (now >= expiryTime) {
          handleSessionExpiry();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleSessionExpiry = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setUser(null);
    setSessionExpired(true);
    setLoading(false);
  };

  const checkAuth = async () => {
    try {
      const response = await api.getCurrentUser();
      setUser(response.user);
      setSessionExpired(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      handleSessionExpiry();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.login({ username, password });
      
      // Store token and set expiry (24 hours from now)
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('token', response.token);
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      
      setUser(response.user);
      setSessionExpired(false);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username, password, role = 'student') => {
    try {
      const response = await api.register({ username, password, role });
      // Registration doesn't return a token, so we need to login after registration
      const loginResponse = await api.login({ username, password });
      
      // Store token and set expiry (24 hours from now)
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('token', loginResponse.token);
      localStorage.setItem('tokenExpiry', expiryTime.toString());
      
      setUser(loginResponse.user);
      setSessionExpired(false);
      return loginResponse;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setUser(null);
    setSessionExpired(false);
  };

  const refreshSession = async () => {
    try {
      await checkAuth();
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem('tokenExpiry', expiryTime.toString());
    } catch (error) {
      handleSessionExpiry();
    }
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAdmin,
    loading,
    sessionExpired,
    refreshSession,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};