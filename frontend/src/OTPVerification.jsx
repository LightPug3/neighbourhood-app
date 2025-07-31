import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react';
import Map from './Map';

const OTPVerification = ({ email, onVerifySuccess, onBack }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState(600);
    const [isExpired, setIsExpired] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [currentPage, setCurrentPage] = useState('otp');
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
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
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
        if (enteredOtp.length !== 6) return setError('Please enter all 6 digits');
        if (isExpired) return setError('OTP has expired. Please resend.');

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`http://127.0.0.1:5000/confirm_otp_code/${enteredOtp}/${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json'  

                 }});
            const result = await response.json();

            if (response.ok) {
                setIsVerified(true);
                setTimeout(() => {
                    if (onVerifySuccess) onVerifySuccess();
                    setCurrentPage('map');
                }, 1000);
            } else {
                setError(result.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('Network error. Try again.');
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
            if (!response.ok) throw new Error(result.error || 'Failed to resend OTP');
            alert('A new OTP was sent to your email.');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsResending(false);
        }
};


    if (currentPage === 'map') return <Map userEmail={email} navigateTo={setCurrentPage} />;

    return (
        <div className="min-h-screen bg-green-100 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Mail className="w-7 h-7 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">OTP Verification</h2>
                    <p className="text-gray-600 mt-1">Enter the code sent to <b>{email}</b></p>
                    <p className={`text-sm mt-1 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                        {isExpired ? 'OTP Expired' : `Expires in: ${timeFormat(timer)}`}
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
                                className={`w-full h-12 text-center text-2xl border rounded focus:outline-none ${
                                    error ? 'border-red-400' : 'border-gray-300 focus:ring-green-400'
                                }`}
                                disabled={isLoading || isVerified}
                            />
                        ))}
                    </div>

                    {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
                    {isVerified && (
                        <p className="text-green-600 text-sm mb-3 flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4" /> OTP Verified! Redirecting...
                        </p>
                    )}

                    <button
                        type="submit"
                        className={`w-full py-3 rounded-lg font-semibold ${
                            isLoading || isVerified || isExpired
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        disabled={isLoading || isVerified || isExpired}
                    >
                        {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                <div className="mt-5 text-center">
                    <button
                        onClick={resendOtp}
                        disabled={isResending || isVerified}
                        className={`text-sm flex items-center justify-center gap-2 mx-auto ${
                            isResending ? 'text-gray-400' : 'text-green-600 hover:text-green-800'
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                        {isResending ? 'Resending...' : 'Resend OTP'}
                    </button>
                </div>

                {onBack && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={onBack}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            ← Back to Sign Up
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OTPVerification;