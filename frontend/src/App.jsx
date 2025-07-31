// App.jsx - Updated with toast notifications
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import ToastNotification from './ToastNotification';
import SignUp from './SignUp';
import Home from './Home';
import Login from './Login';
import OTPVerification from './OTPVerification';
import Questionnaire from './Questionnaire';
import Map from './Map';

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-green-200 flex items-center justify-center">
    <div className="bg-white rounded-xl p-8 shadow-lg text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main app component that handles routing based on authentication state
const AppContent = () => {
  const { isAuthenticated, currentPage, loading, user, toasts, removeToast } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Handle routing based on authentication state and current page
  const renderPage = () => {
    // If user is authenticated, they should only see map
    if (isAuthenticated) {
      return <Map userEmail={user?.email} />;
    }

    // If not authenticated, handle signup flow pages
    switch (currentPage) {
      case 'signup':
        return <SignUp />;
      case 'login':
        return <Login />;
      case 'questionnaire':
        return <Questionnaire />;
      case 'otp':
        return <OTPVerification email={user?.email || ''} />;
      case 'map':
        // If somehow they reach map without being authenticated, redirect to home
        return <Home />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
      
      {/* Toast Notifications */}
      <ToastNotification 
        toasts={toasts} 
        removeToast={removeToast} 
      />
    </div>
  );
};

// Main App component wrapped with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;