import React, { useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import OTPVerification from './OTPVerification'; // Make sure this is correctly imported
import Scotia_Icon from "/Scotia_Icon.png";
import Sagicor_Icon from "/Sagicor_Icon.png";
import NCB_Icon from "/NCB_Icon.png";
import JMD_img from "/jamaican-dollar.png";
import USD_img from "/United_State_dollar.png";

function Questionnaire() {
  const [currentPage, setCurrentPage] = useState('questionnaire');
  const [selectedBank, setSelectedBank] = useState('');
  const [depositPreference, setDepositPreference] = useState('');
  const [sliderRadius, setSliderRadius] = useState(3);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [userEmail, setUserEmail] = useState('niaerskine0410@gmail.com'); // Replace with actual email input if needed
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState({});

  // const generateOtp = () => {
  //   return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  // };

  const checkFormValidity = () => {
    const errors = {};
    if (!selectedBank) errors.bank = 'Select a bank';
    if (!depositPreference) errors.deposit = 'Choose deposit preference';
    if (!selectedCurrency) errors.currency = 'Choose currency';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = checkFormValidity();
    if (Object.keys(validationErrors).length > 0) {
      setError(validationErrors);
      return;
    }

    setIsSubmitting(true);
    //const otp = generateOtp();
    // setGeneratedOtp(otp);

    //console.log('Generated OTP:', otp); // Replace with real email logic

    setTimeout(() => {
      setCurrentPage('otp');
      setIsSubmitting(false);
    }, 1000);
  };

  const handleVerifySuccess = () => {
    alert('User verified successfully!');
    // Continue to next step or redirect
  };

  const handlePageBack = () => {
    setCurrentPage('signup');
    setGeneratedOtp('');
  };

  if (currentPage === 'otp') {
    return (
      <OTPVerification
        email={userEmail}
        onVerifySuccess={handleVerifySuccess}
        onBack={handlePageBack}
        generatedOtp={generatedOtp}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <button type="button" className="text-gray-500 hover:text-gray-800 font-medium">Cancel</button>
            <h1 className="text-xl font-bold text-gray-800">Preference Chart</h1>
            <button
              className={`text-blue-600 hover:text-blue-800 font-semibold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>

          <div className="space-y-6">
            {/* Bank Selection */}
            <div>
              <label className="block font-medium mb-2">Which bank would you prefer to use?</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setSelectedBank('Scotia')} className={`border rounded-lg p-2 ${selectedBank === 'Scotia' ? 'bg-blue-100' : ''}`}>
                  <img src={Scotia_Icon} alt="Scotia" className="w-12 h-12 object-contain" />
                </button>
                <button type="button" onClick={() => setSelectedBank('Sagicor')} className={`border rounded-lg p-2 ${selectedBank === 'Sagicor' ? 'bg-blue-100' : ''}`}>
                  <img src={Sagicor_Icon} alt="Sagicor" className="w-12 h-12 object-contain" />
                </button>
                <button type="button" onClick={() => setSelectedBank('NCB')} className={`border rounded-lg p-2 ${selectedBank === 'NCB' ? 'bg-blue-100' : ''}`}>
                  <img src={NCB_Icon} alt="NCB" className="w-12 h-12 object-contain" />
                </button>
                <button type="button" onClick={() => setSelectedBank('Any')} className={`border rounded-lg p-2 ${selectedBank === 'Any' ? 'bg-blue-100' : ''}`}>
                  Any
                </button>
              </div>
              {error.bank && <p className="text-red-500 text-sm mt-1">{error.bank}</p>}
            </div>

            {/* Deposit Preference */}
            <div>
              <label className="block font-medium mb-2">Would you prefer an ATM that accepts deposits?</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-full ${depositPreference === 'Yes' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setDepositPreference('Yes')}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-full ${depositPreference === 'No' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setDepositPreference('No')}
                >
                  No
                </button>
              </div>
              {error.deposit && <p className="text-red-500 text-sm mt-1">{error.deposit}</p>}
            </div>

            {/* Radius Slider */}
            <div>
              <label className="block font-medium mb-2">How far would you go to use the ATM?</label>
              <Slider
                defaultValue={sliderRadius}
                min={0}
                max={15}
                marks={{ 0: '0', 3: '3', 5: '5', 10: '10', 15: '15' }}
                onChange={(value) => setSliderRadius(value)}
              />
              <div className="text-center mt-2 text-sm font-medium text-gray-700">{sliderRadius} Mile(s)</div>
            </div>

            {/* Currency Preference */}
            <div>
              <label className="block font-medium mb-2">Preferred Currency</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('JMD')}
                  className={`flex items-center gap-2 border rounded-lg p-2 ${selectedCurrency === 'JMD' ? 'bg-green-100' : ''}`}
                >
                  <img src={JMD_img} alt="JMD" className="w-6 h-6 object-contain" />
                  <span>JMD</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCurrency('USD')}
                  className={`flex items-center gap-2 border rounded-lg p-2 ${selectedCurrency === 'USD' ? 'bg-green-100' : ''}`}
                >
                  <img src={USD_img} alt="USD" className="w-6 h-6 object-contain" />
                  <span>USD</span>
                </button>
              </div>
              {error.currency && <p className="text-red-500 text-sm mt-1">{error.currency}</p>}
            </div>
          </div>

          <footer className="text-center mt-6 text-sm text-gray-400">2025 &copy; The Neighborhood</footer>
        </div>
      </div>
    </form>
  );
}

export default Questionnaire;
