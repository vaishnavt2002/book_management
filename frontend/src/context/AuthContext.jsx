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
      isMounted = false;
    };
  }, []);

  const login = async (data) => {
    try {
      const res = await authApi.login(data);
      setUser(res.data.user);
      navigate('/');
    } catch (error) {
      throw error; 
    }
  };

  const logout = async () => {
    try {
      const res = await authApi.logOut();
      setUser(null);
      navigate('/');
    } catch (error) {
      throw error; 
    }
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);