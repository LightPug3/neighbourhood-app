// AuthContext.jsx - Fixed session persistence and authentication flow
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('home');
  const [toasts, setToasts] = useState([]);

  // Toast functions
  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'success',
      duration: 7000,
      ...toast
    };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccessToast = (title, message) => {
    addToast({ type: 'success', title, message });
  };

  const showErrorToast = (title, message) => {
    addToast({ type: 'error', title, message });
  };

  const showInfoToast = (title, message) => {
    addToast({ type: 'info', title, message });
  };

  // Function to save preferences to database (after authentication)
  const savePreferencesToDatabase = async (preferences, token) => {
    try {
      console.log('Saving preferences to database with token:', token ? 'token present' : 'no token');

      const response = await fetch('http://127.0.0.1:5000/api/user-preferences', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      console.log('Preferences saved to database successfully');
      showSuccessToast('Preferences Synced', 'Your ATM preferences have been saved to your account.');
      
      // Clean up the localStorage after successful save
      localStorage.removeItem('questionnaireData');
      
      return { success: true };
    } catch (error) {
      console.error('Error saving preferences to database:', error);
      showErrorToast('Sync Warning', 'Preferences saved locally but failed to sync with server.');
      return { success: false, error: error.message };
    }
  };

  // Initialize authentication state on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('Initializing authentication...');
      const token = localStorage.getItem('jwtToken');
      const savedUser = localStorage.getItem('userData');
      const savedPage = localStorage.getItem('currentPage');

      console.log('Stored token:', token ? 'present' : 'not found');
      console.log('Saved user:', savedUser);
      console.log('Saved page:', savedPage);

      if (!token) {
        console.log('No token found, user not authenticated');
        setLoading(false);
        return;
      }

      // Verify token with backend
      const isValid = await verifyTokenFunction(token);
      console.log('Token verification result:', isValid);
      
      if (isValid) {
        console.log('Token is valid, setting authenticated state');
        setIsAuthenticated(true);
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log('User data restored:', userData);
        }
        
        // Always set authenticated users to map page
        setCurrentPage('map');
        localStorage.setItem('currentPage', 'map');
        console.log('Set current page to map');
      } else {
        console.log('Token is invalid, clearing auth data');
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const verifyTokenFunction = async (token) => {
    try {
      console.log('Verifying token with backend...');
      const response = await fetch('http://127.0.0.1:5000/verify-token', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Verify token response status:', response.status);
      const data = await response.json();
      console.log('Verify token response data:', data);
      
      return response.ok && data.valid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Login response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const token = data.token;
      console.log('Login successful, received token');
      
      // Store token and user data
      localStorage.setItem('jwtToken', token);
      const userData = { email };
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('currentPage', 'map');

      setIsAuthenticated(true);
      setUser(userData);
      setCurrentPage('map');

      showSuccessToast('Welcome back!', `Successfully logged in as ${email}`);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      showErrorToast('Login Failed', error.message);
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      showInfoToast('Creating Account', 'Please wait while we set up your account...');
      
      const response = await fetch('http://127.0.0.1:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          FirstName: userData.firstName,
          LastName: userData.lastName,
          Email: userData.email,
          Password: userData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Store user data for the signup process (not authenticated yet)
      localStorage.setItem('tempUserData', JSON.stringify(userData));
      localStorage.setItem('currentPage', 'questionnaire');
      
      setUser({ email: userData.email, ...userData });
      setCurrentPage('questionnaire');

      showSuccessToast(
        'Account Created!', 
        'Please complete the questionnaire and verify your email to get started.'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      showErrorToast('Signup Failed', error.message);
      return { success: false, error: error.message };
    }
  };

  const completeQuestionnaire = () => {
    localStorage.setItem('currentPage', 'otp');
    setCurrentPage('otp');
    showInfoToast('Questionnaire Complete', 'Please check your email for the verification code.');
  };

  const verifyOTP = async (otp, email) => {
    try {
      showInfoToast('Verifying Code', 'Please wait while we verify your account...');
      
      const response = await fetch(`http://127.0.0.1:5000/confirm_otp_code/${otp}/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }

      // OTP verified successfully!
      console.log('OTP verification response:', data);
      
      // Get user data - prioritize backend response, fallback to temp storage
      let finalUserData = { email };
      
      if (data.user) {
        // Backend provided user data
        finalUserData = {
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName
        };
      } else {
        // Fallback to temp user data
        const tempUserData = localStorage.getItem('tempUserData');
        if (tempUserData) {
          finalUserData = JSON.parse(tempUserData);
        }
      }

      // Store authentication data
      if (data.token) {
        // Backend provided token - store it for authentication
        localStorage.setItem('jwtToken', data.token);
        console.log('Token stored from OTP verification');
        
        // Now that we have a token, check if there are saved questionnaire preferences
        const savedPreferences = localStorage.getItem('questionnaireData');
        if (savedPreferences) {
          console.log('Found saved preferences, attempting to sync with database...');
          const preferences = JSON.parse(savedPreferences);
          // Save preferences to database now that we have a token
          await savePreferencesToDatabase(preferences, data.token);
        }
      } else {
        console.warn('No token provided after OTP verification');
      }
      
      localStorage.setItem('userData', JSON.stringify(finalUserData));
      localStorage.setItem('currentPage', 'map');
      
      // Clean up temp data
      localStorage.removeItem('tempUserData');

      // Set user as authenticated and navigate to map
      setIsAuthenticated(true);
      setUser(finalUserData);
      setCurrentPage('map');

      // Show success message
      const welcomeName = finalUserData.firstName || finalUserData.email.split('@')[0];
      showSuccessToast(
        'Welcome to The Neighbourhood!', 
        `Your account has been verified successfully. Welcome aboard, ${welcomeName}!`
      );

      return { success: true };
    } catch (error) {
      console.error('OTP verification error:', error);
      showErrorToast('Verification Failed', error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('Logging out user');
    clearAuthData();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('home');
    showInfoToast('Logged Out', 'You have been successfully logged out.');
  };

  const clearAuthData = () => {
    console.log('Clearing authentication data');
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('tempUserData');
    localStorage.removeItem('currentPage');
    localStorage.removeItem('questionnaireData'); // Also clear any saved preferences
  };

  const navigateTo = (page, data = {}) => {
    console.log('Navigating to:', page);
    setCurrentPage(page);
    localStorage.setItem('currentPage', page);
    
    if (data.email && !isAuthenticated) {
      setUser(prev => ({ ...prev, email: data.email }));
    }
    if (data.userData) {
      setUser(data.userData);
    }
  };

  const value = {
    isAuthenticated,
    user,
    currentPage,
    loading,
    toasts,
    login,
    signup,
    logout,
    navigateTo,
    completeQuestionnaire,
    verifyOTP,
    verifyToken: verifyTokenFunction,
    addToast,
    removeToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};