import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Questionnaire from './Questionnaire';


const SignUp = ({ onSignUpSuccess }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [currentPage, setCurrentPage] = useState('signup');
    const [userEmail, setUserEmail] = useState('');
    const [userData, setUserData] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState('');

    const checkFormValidity = () => {
        const errors = {};
        if (!formData.firstName) errors.firstName = 'First name is required';
        if (!formData.lastName) errors.lastName = 'Last name is required';
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email address is invalid';
        }
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters long';
        }
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        setError({});
        setApiError('');

        const validationErrors = checkFormValidity();
        if (Object.keys(validationErrors).length > 0) {
            setError(validationErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare data in the format expected by Flask API
            const apiData = {
                FirstName: formData.firstName,
                LastName: formData.lastName,
                Email: formData.email,
                Password: formData.password
            };

            const response = await fetch('http://127.0.0.1:5000/signup', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });

            const data = await response.json();

            if (response.ok) {
                // Success - store user email and move to OTP verification
                setUserEmail(formData.email);
                setUserData(formData);
                setCurrentPage('questionnaire');
                
                // Show success message
                alert(data.message || 'Signup successful! Please check your email for the OTP code.');
            } else {
                // Handle API errors
                setApiError(data.error || 'An error occurred during signup');
            }
        } catch (error) {
            console.error('Network error:', error);
            setApiError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifySuccess = () => {
        // After OTP verification, go to questionnaire
        setCurrentPage('questionnaire');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
        
        // Clear field-specific error when user starts typing
        if (error[name]) {
            setError((prevError) => ({
                ...prevError,
                [name]: ''
            }));
        }
        
        // Clear API error when user starts typing
        if (apiError) {
            setApiError('');
        }
    };

    const handlePageBack = () => {
        setCurrentPage('home');
    };

    if (currentPage === 'questionnaire') {
        return <Questionnaire userData={userData} />;
    };

    // Render different pages based on current state
    // if (currentPage === 'questionnaire') {
    //     return (
    //         <div className="min-h-screen bg-purple-200 flex items-center justify-center p-4">
    //             <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
    //                 <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
    //                 <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Verified!</h2>
    //                 <p className="text-gray-600 mb-4">Welcome to the Neighbourhood! Your account has been successfully created and verified.</p>
    //                 <p className="text-sm text-gray-500">You can now proceed to the questionnaire...</p>
    //             </div>
    //         </div>
    //     );
    // }

    // if (currentPage === 'otp') {
    //     return (
    //         <div className="min-h-screen bg-purple-200 flex items-center justify-center p-4">
    //             <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
    //                 <div className="flex items-center mb-6">
    //                     <button
    //                         onClick={handlePageBack}
    //                         className="mr-3 p-2 text-gray-600 hover:text-gray-800"
    //                     >
    //                         <ArrowLeft className="w-5 h-5" />
    //                     </button>
    //                     <h1 className="text-xl font-bold text-gray-800">Verify Your Email</h1>
    //                 </div>
                    
    //                 <div className="text-center mb-6">
    //                     <Mail className="w-16 h-16 text-purple-500 mx-auto mb-4" />
    //                     <p className="text-gray-600 mb-2">
    //                         We've sent a 6-digit verification code to:
    //                     </p>
    //                     <p className="font-semibold text-gray-800">{userEmail}</p>
    //                 </div>

    //                 <div className="space-y-4">
    //                     <p className="text-sm text-gray-600 text-center">
    //                         Please check your email and enter the OTP code below:
    //                     </p>
                        
    //                     <input
    //                         type="text"
    //                         placeholder="Enter 6-digit OTP"
    //                         maxLength="6"
    //                         className="w-full px-4 py-3 text-center text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
    //                     />
                        
    //                     <button
    //                         onClick={handleVerifySuccess}
    //                         className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
    //                     >
    //                         Verify Code
    //                     </button>
                        
    //                     <div className="text-center">
    //                         <button className="text-sm text-purple-600 hover:text-purple-700">
    //                             Didn't receive the code? Resend
    //                         </button>
    //                     </div>
                        
    //                     <div className="flex items-center justify-center text-sm text-gray-500">
    //                         <Clock className="w-4 h-4 mr-1" />
    //                         Code expires in 10 minutes
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="min-h-screen bg-purple-200 flex items-center justify-center p-4">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
                    <p className="text-gray-600 font-bold">Join the Neighbourhood and let us help you out</p>
                </div>

                {/* Display API errors */}
                {apiError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        <div className="flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            {apiError}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className={`mt-1 block w-full px-3 py-2 border ${error.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                            disabled={isSubmitting}
                        />
                        {error.firstName && <p className="text-red-500 text-sm mt-1">{error.firstName}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className={`mt-1 block w-full px-3 py-2 border ${error.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                            disabled={isSubmitting}
                        />
                        {error.lastName && <p className="text-red-500 text-sm mt-1">{error.lastName}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`mt-1 block w-full px-3 py-2 border ${error.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                            disabled={isSubmitting}
                        />
                        {error.email && <p className="text-red-500 text-sm mt-1">{error.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`mt-1 block w-full px-3 py-2 pr-10 border ${error.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                disabled={isSubmitting}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {error.password && <p className="text-red-500 text-sm mt-1">{error.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`mt-1 block w-full px-3 py-2 pr-10 border ${error.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                disabled={isSubmitting}
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {error.confirmPassword && <p className="text-red-500 text-sm mt-1">{error.confirmPassword}</p>}
                    </div>

                    <button
                        onClick={handleSubmit}
                        className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                            </>
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button 
                            className="text-purple-600 hover:text-purple-700 font-medium"
                            onClick={() => setCurrentPage('signin')}
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
