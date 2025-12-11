import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function LoginPage({ login, user, setNotification }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registrationStep, setRegistrationStep] = useState('details'); // 'details' or 'otp'
  const [otp, setOtp] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLogin) {
      document.title = 'Login - SamriddhiShop';
    } else {
      document.title = 'Create Account - SamriddhiShop';
    }
  }, [isLogin]);

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  // Countdown timer effect for resending OTP
  useEffect(() => {
    let timerId;
    if (registrationStep === 'otp' && resendTimer > 0) {
      timerId = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(timerId);
    }
    return () => clearInterval(timerId);
  }, [registrationStep, resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {

      localStorage.removeItem("token");
      
      const success = await login(email, password);
      if (success) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        alert('Login failed. Please check your credentials.');
        setLoading(false);
      }
    } else {
      if (registrationStep === 'details') {
        // Step 1: Send OTP for email verification
        try {
          const response = await fetch(`${API_BASE}/api/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, type: 'register' })
          });
          const data = await response.json();
          if (response.ok) {
            setNotification({ message: data.message || 'OTP sent to your email!', product: 'Please check your Email inbox.', type: 'info' });
            setResendTimer(30); // Start a 30-second timer
            setRegistrationStep('otp');
          } else {
            alert(data.error || 'Failed to send OTP. The email might already be registered.');
          }
        } catch (error) {
          console.error('Send OTP error:', error);
          alert('An error occurred while sending the OTP.');
        }
      } else {
        // Step 2: Verify OTP and register
        try {
          const response = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone, otp })
          });
          
          if (response.status === 429) {
            alert('Too many registration attempts. Please wait 15 minutes and try again.');
            setLoading(false);
            return;
          }
          
          if (response.ok) {
            setNotification({
              message: 'Account created successfully!',
              product: 'Welcome to SamriddhiShop!',
              type: 'success'
            });
            // Automatically log the user in
            const success = await login(email, password);
            if (!success) {
              // If auto-login fails, switch to login form for manual attempt
              setIsLogin(true);
              setRegistrationStep('details');
            }
          } else {
            const data = await response.json().catch(() => ({ error: 'Registration failed' }));
            alert(data.error || 'Registration failed. Please try again.');
            if (data.error && data.error.toLowerCase().includes('otp')) {
              // Don't go back if OTP is wrong, let user retry
            } else {
              setRegistrationStep('details'); // Go back to details form on other errors
            }
          }
        } catch (error) {
          console.error('Registration error:', error);
          alert('Registration failed. Please try again.');
        }
      }
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return; // Prevent resending if timer is active

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, type: 'register' })
      });
      const data = await response.json();
      if (response.ok) {
        setNotification({ message: 'A new OTP has been sent!', product: 'Please check your inbox.', type: 'info' });
        setResendTimer(30); // Restart the timer
      } else {
        alert(data.error || 'Failed to resend OTP.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      alert('An error occurred while resending the OTP.');
    }
    setLoading(false);
  };
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 overflow-hidden">
      <div className="relative z-10 max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </h2>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && registrationStep === 'details' && (
                <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">👤 Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your full name" required={!isLogin} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white" placeholder="Enter your email address" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📱 Phone Number</label>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200 bg-gray-50 focus-within:bg-white">
                    <span className="px-4 py-3 text-gray-500 bg-gray-50 border-r border-gray-300">+91</span>
                    <input type="tel" value={phone.replace(/^\+91/, '')} onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); if (digits.length <= 10) { setPhone(`+91${digits}`); } }} className="w-full px-4 py-3 border-none focus:ring-0 bg-transparent" placeholder="Enter your 10-digit number" required={!isLogin} maxLength="10" />
                  </div>
                </div>
                </>              
              )}

              {isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📧 Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white" placeholder="Enter your email address" required />
                </div>
              )}
              
              { (isLogin || registrationStep === 'details') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🔒 Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white" placeholder={isLogin ? 'Enter your password' : 'Create a strong password'} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700">
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && registrationStep === 'otp' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">✉️ Verification Code</label>
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter OTP from your email" required maxLength="6" />
                  <div className="flex justify-between items-center mt-2">
                    <button type="button" onClick={() => setRegistrationStep('details')} className="text-sm text-blue-600 hover:underline">
                      &larr; Back to details
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0}
                      className="text-sm text-blue-600 hover:underline disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && registrationStep === 'details' && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="rounded text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-gray-600">
                      I accept the{' '}
                      <Link to="/support/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/support/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>
                </div>
              )}

              {isLogin && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-800">Forgot Password?</Link>
                </div>
              )}
              
              <button type="submit" disabled={loading || (!isLogin && registrationStep === 'details' && !termsAccepted)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <span className="animate-spin">⏳</span>
                    <span>{isLogin ? 'Signing In...' : (registrationStep === 'details' ? 'Sending OTP...' : 'Creating Account...')}</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>{isLogin ? '🚀' : '✨'}</span>
                    <span>{isLogin ? 'Sign In' : (registrationStep === 'details' ? 'Get OTP' : 'Create Account')}</span>
                  </span>
                )}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">or</span></div>
              </div>
              
              <p className="mt-4 text-gray-600">{isLogin ? "Don't have an account?" : "Already have an account?"}</p>
              <button onClick={() => { setIsLogin(!isLogin); setPassword(''); setRegistrationStep('details'); }} className="mt-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 hover:underline">
                {isLogin ? '🎯 Create New Account' : '🔑 Sign In Instead'}
              </button>
            </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl"><div className="text-2xl mb-2">🛡️</div><p className="text-sm text-gray-600 font-medium">Secure & Safe</p></div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl"><div className="text-2xl mb-2">🚚</div><p className="text-sm text-gray-600 font-medium">Fast Delivery</p></div>
          <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl"><div className="text-2xl mb-2">💎</div><p className="text-sm text-gray-600 font-medium">Quality Products</p></div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;