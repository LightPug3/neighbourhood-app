// OTPVerification.jsx - Updated with proper authentication flow
import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from './AuthContext';

const OTPVerification = ({ email }) => {
  const { verifyOTP, navigateTo, showErrorToast } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes
  const [isExpired, setIsExpired] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only allow single character
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const timeFormat = (t) => {
    const min = Math.floor(t / 60);
    const sec = t % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    
    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    if (isExpired) {
      setError('OTP has expired. Please resend.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyOTP(enteredOtp, email);
      
      if (result.success) {
        setIsVerified(true);
        
        // Give user a moment to see the success state, then AuthContext will handle navigation
        setTimeout(() => {
          // Navigation is handled by AuthContext after successful verification
          console.log('OTP verification successful - user should be redirected to map');
        }, 1500);
      } else {
        setError(result.error || 'Invalid OTP code. Please try again.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Network error. Please check your connection and try again.');
      showErrorToast('Verification Error', 'Unable to verify your code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    if (isResending) return;
    
    setIsResending(true);
    setError('');
    setIsExpired(false);
    setTimer(600);
    setOtp(['', '', '', '', '', '']);

    try {
      const response = await fetch('http://127.0.0.1:5000/resend_otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP');
      }
      
      // Success feedback will be handled by a toast
      console.log('OTP resent successfully');
    } catch (err) {
      setError(err.message);
      showErrorToast('Resend Failed', err.message);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToQuestionnaire = () => {
    navigateTo('questionnaire');
  };

  return (
    <div className="min-h-screen bg-green-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <button
            onClick={handleBackToQuestionnaire}
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
            disabled={isLoading || isVerified}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Questionnaire
          </button>

          <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-7 h-7 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
          <p className="text-gray-600 mt-1">
            Enter the 6-digit code sent to
          </p>
          <p className="font-semibold text-gray-800">{email}</p>
          <p className={`text-sm mt-2 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
            {isExpired ? 'Code Expired' : `Code expires in: ${timeFormat(timer)}`}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                ref={(el) => otpInputRefs.current[i] = el}
                className={`w-full h-12 text-center text-2xl border rounded focus:outline-none focus:ring-2 transition-all ${
                  error ? 'border-red-400 focus:ring-red-400' : 
                  isVerified ? 'border-green-400 bg-green-50' :
                  'border-gray-300 focus:ring-green-400'
                } ${isLoading || isVerified ? 'bg-gray-50' : ''}`}
                disabled={isLoading || isVerified}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
          
          {isVerified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-600 text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> 
                Email verified successfully! Taking you to your dashboard...
              </p>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              isLoading || isVerified || isExpired
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
            }`}
            disabled={isLoading || isVerified || isExpired}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Verifying your code...
              </div>
            ) : isVerified ? (
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Verified! Redirecting...
              </div>
            ) : (
              'Verify Email'
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={resendOtp}
            disabled={isResending || isVerified || (!isExpired && timer > 0)}
            className={`text-sm flex items-center justify-center gap-2 mx-auto transition-colors ${
              isResending ? 'text-gray-400' : 
              (!isExpired && timer > 0) ? 'text-gray-400 cursor-not-allowed' :
              'text-green-600 hover:text-green-800'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Sending new code...' : 
             (!isExpired && timer > 0) ? `Resend available in ${timeFormat(timer)}` :
             'Send new code'}
          </button>
          
          {(!isExpired && timer > 0) && (
            <p className="text-xs text-gray-500 mt-2">
              You can request a new code after the current one expires
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;