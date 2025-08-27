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

    // Listen for auth expiry events from API calls
    const handleAuthExpired = () => {
      handleSessionExpiry();
    };

    window.addEventListener('auth-expired', handleAuthExpired);

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

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
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
      if (response && response.user) {
        setUser(response.user);
        setSessionExpired(false);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only handle session expiry if it's an auth error
      if (error.message.includes('expired') || error.message.includes('invalid') || error.message.includes('401')) {
        handleSessionExpiry();
      } else {
        // For other errors, just set loading to false but keep user logged in
        console.warn('Auth check failed but keeping user logged in:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.login({ username, password });
      
      if (response.token && response.user) {
        // Store token and set expiry (24 hours from now)
        const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('token', response.token);
        localStorage.setItem('tokenExpiry', expiryTime.toString());
        
        setUser(response.user);
        setSessionExpired(false);
        return response;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username, password, role = 'student') => {
    try {
      const response = await api.register({ username, password, role });
      
      if (response.message === 'User created successfully') {
        // Registration successful, now login
        const loginResponse = await api.login({ username, password });
        
        if (loginResponse.token && loginResponse.user) {
          // Store token and set expiry (24 hours from now)
          const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000);
          localStorage.setItem('token', loginResponse.token);
          localStorage.setItem('tokenExpiry', expiryTime.toString());
          
          setUser(loginResponse.user);
          setSessionExpired(false);
          return loginResponse;
        } else {
          throw new Error('Login failed after registration');
        }
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
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