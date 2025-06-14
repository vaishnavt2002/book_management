import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkProfile = async () => {
      try {
        const res = await authApi.getProfile();
        if (isMounted) {
          setUser(res.data);
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkProfile();

    return () => {
      isMounted = false; // Cleanup to prevent memory leaks
    };
  }, []); // Empty dependency array ensures this runs only once

  const login = async (data) => {
    try {
      const res = await authApi.login(data); // Fix: Use authApi instead of api
      setUser(res.data.user);
      navigate('/');
    } catch (error) {
      throw error; // Let the caller handle errors
    }
  };

  const logout = async () => {
    
    try {
      const res = await authApi.logOut(); // Fix: Use authApi instead of api
      setUser(null);
      navigate('/');
    } catch (error) {
      throw error; // Let the caller handle errors
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);