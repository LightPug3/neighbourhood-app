import React, { useState } from 'react';
import { Mail, Lock, User, Phone, ArrowLeft, CheckCircle } from 'lucide-react';
import SignUp from './SignUp';
import Home from './Home';
import Login from './Login';
import OTPVerification from './OTPVerification';
import Questionnaire from './Questionnaire';
import Map from './Map';

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [userEmail, setUserEmail] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [userData, setUserData] = useState({});

  const navigateTo = (page, data = {}) => {
    setCurrentPage(page);
    if (data.email) setUserEmail(data.email);
    if (data.otp) setGeneratedOTP(data.otp);
    if (data.userData) setUserData(data.userData);
  };
  const render=()=>{
    switch(currentPage){
      case 'signup':
        return <SignUp navigateTo={navigateTo} />;
      case 'questionnaire':
        return <Questionnaire navigateTo={navigateTo} />;
      case 'login':
        return <Login navigateTo={navigateTo} />;
      case 'otp':
        return <OTPVerification email={userEmail} navigateTo={navigateTo} />;
      case 'map':
        return <Map userEmail={userEmail} navigateTo={navigateTo} />;
      default:
        return <Home navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="App">
      {render()}
    </div>
  );
};
export default App;