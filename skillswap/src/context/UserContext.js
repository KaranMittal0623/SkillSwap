import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const handleError = (error) => {
    console.error('Error in UserContext:', error);
    let message;
    if (error.message) {
      // This is for our custom error messages from api.js
      message = error.message;
    } else if (error.response?.data?.message) {
      // This is for server error responses
      message = error.response.data.message;
    } else if (error.code === 'ECONNABORTED') {
      // This is for timeout errors
      message = 'Request timed out. Please try again.';
    } else {
      // Fallback error message
      message = 'Something went wrong. Please try again.';
    }
    toast.error(message);
    return { success: false, error: message };
  };

  const login = async (email, password) => {
    try {
      setGlobalLoading(true);
      const response = await api.post('/login', { email, password });
      const { token, user: userData } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      return handleError(error);
    } finally {
      setGlobalLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setGlobalLoading(true);
      const response = await api.post('/register', userData);
      toast.success('Registration successful! Please login.');
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    } finally {
      setGlobalLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info('Logged out successfully');
  };

  const incrementPoints = async (skillName) => {
    try {
      setGlobalLoading(true);
      const response = await api.post('/increment-points', { 
        userId: user._id,
        skillName 
      });
      toast.success('Points added successfully!');
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    } finally {
      setGlobalLoading(false);
    }
  };

  const sendConnectionRequest = async (targetUserId, message, skillInterested) => {
    try {
      setGlobalLoading(true);
      const response = await api.post('/send-connection-request', {
        targetUserId,
        message,
        skillInterested
      });
      toast.success('Connection request sent successfully!');
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        loading,
        globalLoading,
        login,
        register,
        logout,
        incrementPoints,
        sendConnectionRequest
      }}
    >
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;