// frontend/src/context/AuthContext.jsx

import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- NEW: Import useNavigate

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate(); // <-- NEW: Get the navigate function

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // --- THIS IS THE NEW, CRITICAL LOGIC ---
  // This effect runs whenever the 'user' state changes.
  useEffect(() => {
    if (user && !isLoading) { // Only run if a user has just logged in
      switch (user.role) {
        case 'MANUFACTURER': navigate('/manufacturer/dashboard'); break;
        case 'DVA': navigate('/dva/dashboard'); break;
        case 'ADMIN': navigate('/admin/dashboard'); break;
        case 'PRINTING': navigate('/printing/dashboard'); break;
        case 'LOGISTICS': navigate('/logistics/dashboard'); break;
        case 'SKINCARE_BRAND': navigate('/skincare/dashboard'); break;
        default: navigate('/'); // For CUSTOMER role
      }
    }
  }, [user, isLoading, navigate]); // It depends on user, isLoading, and navigate

  const login = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken);
    // The useEffect above will now handle the navigation automatically.
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    navigate('/'); // On logout, always go to the homepage.
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};