// Home.jsx - Update your current Home.jsx with this
import React from 'react';
import { useAuth } from './AuthContext';

const Home = () => {
  const { navigateTo, verifyToken } = useAuth();

  const handleLoginClick = async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      navigateTo('login');
      return;
    }

    try {
      const isValid = await verifyToken(token);
      if (isValid) {
        navigateTo('map');
        console.log('Token is valid, navigating to map');
      } else {
        navigateTo('login');
        console.log('Token is invalid, redirecting to login');
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      navigateTo('login');
    }
  };

  const handleSignupClick = () => {
    navigateTo('signup');
  };

  return (
    <div className="min-h-screen bg-green-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-8">
          <div className="logo-container">
            <img src="/public/card_img.png" alt="Neighbourhood Logo" className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Welcome to</h1>
          <h2 className="text-2xl font-bold text-green-600 mb-4">The Neighbourhood</h2>
          <p className="text-gray-600 mb-8">Find ATMs near you with real-time status updates</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLoginClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center"
          >
            Login
          </button>

          <button
            onClick={handleSignupClick}
            className="w-full bg-white hover:bg-gray-50 text-green-600 font-bold py-3 px-6 rounded-lg border-2 border-green-600 transition duration-200 flex items-center justify-center"
          >
            Sign Up
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Join thousands of users finding nearby ATMs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;