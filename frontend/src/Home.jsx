import React, { useState } from 'react';
import { Mail, Lock, User, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import SignUp from './SignUp';
import Login from './Login';
import Map from './Map';
import OTPVerification from './OTPVerification';
import axios from 'axios';



 // Home Page Component
  const HomePage = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [userEmail, setUserEmail] = useState('');
    const [generatedOTP, setGeneratedOTP] = useState('');
    const [userData, setUserData] = useState({});

    const navigateTo = (page, data = {}) => {
        setCurrentPage(page);
        if (data.email) setUserEmail(data.email);
        if (data.otp) setGeneratedOTP(data.otp);
        if (data.userData) setUserData(data.userData);
    }
    const handleLoginClick = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigateTo('login');
        return;
      }

      try {
        const response = await axios.post('http://127.0.0.1:5000/verify_token', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.valid) {
          navigateTo('map'); // or wherever you want to send authenticated users
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

     // Render based on currentPage
    if (currentPage === 'login') {
      return <Login navigateTo={navigateTo} />;
    }

    if (currentPage === 'signup') {
      return <SignUp navigateTo={navigateTo} />;
    }
    
    if (currentPage === 'map') {
      return <Map userEmail={userEmail} navigateTo={navigateTo} />;
    }

    return (
      <div className="min-h-screen bg-green-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="mb-8">
            <div className="logo-container ">
              <img src="\public\card_img.png" alt="Neighbourhood Logo" className="w-16 h-16 mx-auto" />
            </div>
            {/* <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-lightgreen-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div> */}
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Neighbourhood</h1>
            <p className="text-gray-600">Bringing your preferred ATM closer to you</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleLoginClick}
              className="w-full bg-green-200 hover:bg-green-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <Lock className="w-5 h-5" />
              <span>Login</span>
            </button>
            
            <button
              onClick={() => navigateTo('signup')}
              className="w-full bg-purple-100 hover:bg-purple-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span>Sign Up</span>
            </button>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            Helpful• Fast • Reliable
          </div>
        </div>
      </div>
    );
  };
export default HomePage;