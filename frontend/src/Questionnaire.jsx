// Questionnaire.jsx - Fixed to not require JWT token during signup flow
import React, { useState } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useAuth } from './AuthContext';
import { CheckCircle, AlertCircle } from 'lucide-react';

import Scotia_Icon from "/Scotia_Icon.png";
import Sagicor_Icon from "/Sagicor_Icon.png";
import NCB_Icon from "/NCB_Icon.png";
import JMD_img from "/jamaican-dollar.png";
import USD_img from "/United_State_dollar.png";

const Questionnaire = () => {
  const { completeQuestionnaire, user, showErrorToast, showSuccessToast } = useAuth();
  const [selectedBanks, setSelectedBanks] = useState([]); // Changed to array for multi-select
  const [transactionTypes, setTransactionTypes] = useState([]); // Changed name and to array
  const [sliderRadius, setSliderRadius] = useState(10); // Increased default to 10km
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const bankOptions = [
    { id: 'Sagicor', name: 'Sagicor Bank', icon: Sagicor_Icon },
    { id: 'NCB', name: 'National Commercial Bank', icon: NCB_Icon },
    { id: 'Scotia', name: 'Bank of Nova Scotia', icon: Scotia_Icon },
    { id: 'Any', name: 'Any Bank', icon: null }
  ];

  const transactionOptions = [
    { 
      value: 'withdrawal', 
      label: 'Withdrawal', 
      description: 'Taking cash out of ATMs',
      icon: '💸'
    },
    { 
      value: 'deposit', 
      label: 'Deposit', 
      description: 'Putting cash or cheques into ATMs',
      icon: '💰'
    },
    { 
      value: 'both', 
      label: 'Both', 
      description: 'Both withdrawals and deposits',
      icon: '🔄'
    }
  ];

  const checkFormValidity = () => {
    const errors = {};
    if (selectedBanks.length === 0) errors.banks = 'Please select at least one bank preference';
    if (transactionTypes.length === 0) errors.transactions = 'Please select your transaction interests';
    if (!selectedCurrency) errors.currency = 'Please choose your preferred currency';
    if (sliderRadius < 1 || sliderRadius > 25) errors.radius = 'Please set a valid travel radius';
    return errors;
  };

  const handleBankSelection = (bankId) => {
    setSelectedBanks(prev => {
      if (bankId === 'Any') {
        // If "Any" is selected, clear other selections and select only "Any"
        return prev.includes('Any') ? [] : ['Any'];
      } else {
        // If a specific bank is selected, remove "Any" if it exists
        const withoutAny = prev.filter(id => id !== 'Any');
        if (withoutAny.includes(bankId)) {
          // Remove the bank if already selected
          return withoutAny.filter(id => id !== bankId);
        } else {
          // Add the bank
          return [...withoutAny, bankId];
        }
      }
    });
    
    // Clear errors when user makes selection
    if (errors.banks) {
      setErrors(prev => ({ ...prev, banks: '' }));
    }
  };

  const handleTransactionSelection = (transactionType) => {
    setTransactionTypes(prev => {
      if (transactionType === 'both') {
        // If "both" is selected, clear other selections and select only "both"
        return prev.includes('both') ? [] : ['both'];
      } else {
        // If withdrawal or deposit is selected, remove "both" if it exists
        const withoutBoth = prev.filter(type => type !== 'both');
        if (withoutBoth.includes(transactionType)) {
          // Remove the transaction type if already selected
          return withoutBoth.filter(type => type !== transactionType);
        } else {
          // Add the transaction type
          return [...withoutBoth, transactionType];
        }
      }
    });
    
    // Clear errors when user makes selection
    if (errors.transactions) {
      setErrors(prev => ({ ...prev, transactions: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = checkFormValidity();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showErrorToast('Incomplete Form', 'Please fill in all required fields to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare preferences data
      const preferences = {
        preferred_banks: selectedBanks,
        transaction_types: transactionTypes,
        max_radius_km: sliderRadius,
        preferred_currency: selectedCurrency,
        email: user?.email,
        completedAt: new Date().toISOString()
      };
      
      // Save to localStorage for now - will be saved to database after OTP verification
      localStorage.setItem('questionnaireData', JSON.stringify(preferences));
      console.log('Preferences saved to localStorage:', preferences);
      
      // Show success message and move to OTP verification
      showSuccessToast('Preferences Saved!', 'Your ATM preferences have been saved. Next, verify your email.');
      
      // Small delay to show success message, then proceed
      setTimeout(() => {
        completeQuestionnaire();
        setIsSubmitting(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      showErrorToast('Save Error', error.message || 'Unable to save your preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      localStorage.removeItem('tempUserData');
      localStorage.removeItem('currentPage');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-gray-100">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Set Your ATM Preferences</h1>
            <p className="text-gray-600">Help us show you the most relevant ATMs</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Bank Selection - Multi-select */}
          <div>
            <label className="block text-lg font-semibold mb-4 text-gray-800">
              Which banks would you prefer to use?
              <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
            
            <div className="grid grid-cols-2 gap-4">
              {bankOptions.map((bank) => (
                <button 
                  key={bank.id}
                  type="button" 
                  onClick={() => handleBankSelection(bank.id)} 
                  className={`relative border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
                    selectedBanks.includes(bank.id)
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  {/* Selection indicator */}
                  {selectedBanks.includes(bank.id) && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  
                  {bank.icon ? (
                    <img src={bank.icon} alt={bank.name} className="w-16 h-16 object-contain mx-auto mb-3" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-sm font-bold text-gray-600">ANY</span>
                    </div>
                  )}
                  <p className="font-medium text-gray-800 text-center">{bank.name}</p>
                </button>
              ))}
            </div>
            {errors.banks && (
              <div className="flex items-center mt-3 text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <p className="text-sm">{errors.banks}</p>
              </div>
            )}
          </div>

          {/* Transaction Types - Updated question */}
          <div>
            <label className="block text-lg font-semibold mb-4 text-gray-800">
              What transactions are you most interested in?
              <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
            
            <div className="space-y-3">
              {transactionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleTransactionSelection(option.value)}
                  className={`w-full text-left p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                    transactionTypes.includes(option.value)
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <div className="flex items-center">
                    {transactionTypes.includes(option.value) && (
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="text-2xl mr-3">{option.icon}</span>
                        <span className="font-semibold text-gray-800">{option.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {errors.transactions && (
              <div className="flex items-center mt-3 text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <p className="text-sm">{errors.transactions}</p>
              </div>
            )}
          </div>

          {/* Travel Radius - Updated label */}
          <div>
            <label className="block text-lg font-semibold mb-4 text-gray-800">
              Maximum travel radius: <span className="text-blue-600 font-bold">{sliderRadius} km</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">How far are you willing to travel to find an ATM?</p>
            
            <div className="px-4 py-6 bg-gray-50 rounded-xl">
              <Slider
                min={1}
                max={25}
                value={sliderRadius}
                onChange={setSliderRadius}
                disabled={isSubmitting}
                trackStyle={{ backgroundColor: '#3B82F6', height: 8 }}
                handleStyle={{ 
                  borderColor: '#3B82F6', 
                  backgroundColor: '#3B82F6',
                  height: 24,
                  width: 24,
                  marginTop: -8,
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                }}
                railStyle={{ backgroundColor: '#E5E7EB', height: 8 }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-3 px-2">
                <span>1 km (very close)</span>
                <span className="text-center">Moderate distance</span>
                <span>25 km (anywhere)</span>
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-lg font-semibold mb-4 text-gray-800">
              Preferred currency?
              <span className="text-red-500 ml-1">*</span>
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button" 
                onClick={() => setSelectedCurrency('JMD')} 
                className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                  selectedCurrency === 'JMD' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                {selectedCurrency === 'JMD' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className="relative">
                  <img src={JMD_img} alt="Jamaican Dollar" className="w-12 h-12 object-contain mx-auto mb-3" />
                  <p className="font-semibold text-gray-800">Jamaican Dollar</p>
                  <p className="text-sm text-gray-600 mt-1">JMD</p>
                </div>
              </button>
              
              <button 
                type="button" 
                onClick={() => setSelectedCurrency('USD')} 
                className={`border-2 rounded-xl p-6 transition-all hover:shadow-lg ${
                  selectedCurrency === 'USD' 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                {selectedCurrency === 'USD' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className="relative">
                  <img src={USD_img} alt="US Dollar" className="w-12 h-12 object-contain mx-auto mb-3" />
                  <p className="font-semibold text-gray-800">US Dollar</p>
                  <p className="text-sm text-gray-600 mt-1">USD</p>
                </div>
              </button>
            </div>
            {errors.currency && (
              <div className="flex items-center mt-3 text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <p className="text-sm">{errors.currency}</p>
              </div>
            )}
          </div>

          {/* Progress Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 text-center border border-blue-100">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <p className="font-semibold text-blue-800">Almost finished! 🎉</p>
            </div>
            <p className="text-sm text-blue-700">
              Next: verify your email to complete your account setup and start finding ATMs
            </p>
          </div>
        </form>

        {/* Buttons at bottom with better styling */}
        <div className="px-8 pb-8">
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Saving Preferences...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Continue to Verification
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;