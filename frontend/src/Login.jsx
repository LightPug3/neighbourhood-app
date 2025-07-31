import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import Map from './Map';

const Login = ({ navigateTo }) => {
  const [currentPage, setCurrentPage] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add missing state variables for password reset functionality
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetData, setResetData] = useState({ email: '', new_password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add missing handler for reset password form
  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData({ ...resetData, [name]: value });
  };

  const checkFormValidity = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email address is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  // Add missing reset password handler
  const handleResetPassword = async () => {
    if (!resetData.email || !resetData.new_password) {
      setErrors({ reset: 'Email and new password are required' });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/update_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetData)
      });

      const data = await response.json();

      if (response.ok) {
        setErrors({ reset: '' });
        setShowResetPassword(false);
        setResetData({ email: '', new_password: '' });
        // Show success message or redirect
        alert('Password reset successful! Please login with your new password.');
      } else {
        setErrors({ reset: data.error || 'Password reset failed' });
      }
    } catch (err) {
      setErrors({ reset: 'Network error. Please try again.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = checkFormValidity();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Login Request - Changed to POST method
      const loginRes = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST', // Changed from GET to POST
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        setErrors({ submit: loginData.error || 'Login failed.' });
        setIsSubmitting(false);
        return;
      }

      const token = loginData.token;
      localStorage.setItem('jwtToken', token); // Save token locally
      console.log('Token saved:', token); // Added console log for debugging

      // Token Verification - Fixed route name and headers
      const verifyRes = await fetch('http://127.0.0.1:5000/verify-token', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`, // Added Bearer prefix (optional)
          'Content-Type': 'application/json'
        }
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.valid) {
        setCurrentPage('map'); // navigate to homepage
      } else {
        setErrors({ submit: 'Invalid or expired token.' });
        localStorage.removeItem('jwtToken'); // Remove invalid token
      }

    } catch (err) {
      console.error('Login error:', err); // Added console log for debugging
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentPage === 'map') {
    return <Map userEmail={formData.email} navigateTo={navigateTo} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="logo-container">
            <img src="/Neighborhood logo.png" alt="Neighbourhood Logo" className="w-25 h mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90 space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowResetPassword(!showResetPassword)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Forgot your password?
            </button>
          </div>

          {/* Errors */}
          {errors.submit && <p className="text-sm text-red-600 text-center">{errors.submit}</p>}

          {/* Submit */}
          <button
            type="submit"
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

          {/* Password Reset Section */}
          {showResetPassword && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-3">Reset your password</p>
              <div className="space-y-3">
                <input
                  type="email"
                  name="email"
                  placeholder="Your email"
                  value={resetData.email}
                  onChange={handleResetChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="password"
                  name="new_password"
                  placeholder="New password"
                  value={resetData.new_password}
                  onChange={handleResetChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition duration-200"
                  >
                    Reset Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetData({ email: '', new_password: '' });
                      setErrors({ ...errors, reset: '' });
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-md transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {errors.reset && <p className="text-sm text-red-600 mt-2">{errors.reset}</p>}
            </div>
          )}

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigateTo('signup')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;