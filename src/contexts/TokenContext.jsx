import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const TokenContext = createContext();

export const useToken = () => {
  const context = useContext(TokenContext);
  if (!context) {
    throw new Error('useToken must be used within a TokenProvider');
  }
  return context;
};

export const TokenProvider = ({ children }) => {
  const { user } = useAuth();
  const [token, setToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  useEffect(() => {
    if (user) {
      const savedToken = localStorage.getItem(`google_slides_token_${user.id}`);
      const savedExpiry = localStorage.getItem(`google_slides_token_expiry_${user.id}`);
      
      if (savedToken && savedExpiry) {
        const expiryTime = new Date(savedExpiry);
        const now = new Date();
        
        if (now < expiryTime) {
          setToken(savedToken);
          setTokenExpiry(expiryTime);
        } else {
          // Token expired, clear it
          clearToken();
          toast.error('Your Google API token has expired. Please refresh it in settings.');
        }
      }
    } else {
      setToken(null);
      setTokenExpiry(null);
    }
  }, [user]);

  const saveToken = (newToken) => {
    if (user) {
      setToken(newToken);
      // Set expiry to 50 minutes from now (tokens usually expire in 1 hour)
      const expiry = new Date(Date.now() + 50 * 60 * 1000);
      setTokenExpiry(expiry);
      
      localStorage.setItem(`google_slides_token_${user.id}`, newToken);
      localStorage.setItem(`google_slides_token_expiry_${user.id}`, expiry.toISOString());
    }
  };

  const clearToken = () => {
    if (user) {
      setToken(null);
      setTokenExpiry(null);
      localStorage.removeItem(`google_slides_token_${user.id}`);
      localStorage.removeItem(`google_slides_token_expiry_${user.id}`);
    }
  };

  const validateToken = async () => {
    if (!token) return false;
    
    // Check if token is expired
    if (tokenExpiry && new Date() >= tokenExpiry) {
      clearToken();
      return false;
    }

    try {
      // Test the token by making a simple API call
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token);
      
      if (!response.ok) {
        clearToken();
        return false;
      }
      
      const tokenInfo = await response.json();
      
      // Check if token has required scopes
      if (!tokenInfo.scope || !tokenInfo.scope.includes('presentations')) {
        toast.error('Token does not have required Google Slides permissions');
        clearToken();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      clearToken();
      return false;
    }
  };

  const isTokenExpiringSoon = () => {
    if (!tokenExpiry) return false;
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    return tokenExpiry <= fiveMinutesFromNow;
  };

  const getTokenTimeRemaining = () => {
    if (!tokenExpiry) return null;
    const now = new Date();
    const remaining = tokenExpiry.getTime() - now.getTime();
    return Math.max(0, Math.floor(remaining / 1000 / 60)); // minutes
  };

  const value = {
    token,
    saveToken,
    clearToken,
    validateToken,
    hasToken: !!token,
    tokenExpiry,
    isTokenExpiringSoon: isTokenExpiringSoon(),
    tokenTimeRemaining: getTokenTimeRemaining()
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
};