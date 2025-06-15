import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: '', code: '', password: '' });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter.';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number.';
    }
    return '';
  };

  const passwordCriteria = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number:/[0-9]/.test(formData.password),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'password') {
      setErrors({ ...errors, password: validatePassword(value) });
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    try {
      await authApi.requestOTP({ email: formData.email, context: 'forgot_password' });
      setSuccessMessage('OTP sent successfully! Please check your email.');
      setStep(2);
      setErrors({});
    } catch (err) {
      setErrors({
        ...errors,
        general: err.response?.data?.error || 'Failed to send OTP.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setErrors({ ...errors, password: passwordError });
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setSuccessMessage('');
    try {
      await authApi.resetPassword({
        email: formData.email,
        code: formData.code,
        password: formData.password,
      });
      setSuccessMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrors({ ...errors, general: err.response?.data?.error || 'Password reset failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    try {
      await authApi.requestOTP({ email: formData.email, context: 'forgot_password' });
      setSuccessMessage('OTP resent successfully!');
    } catch (err) {
      setErrors({ ...errors, general: err.response?.data?.error || 'Failed to resend OTP.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
        </h2>
        {successMessage && (
          <p className="text-green-600 bg-green-100 border border-green-400 rounded-md p-3 mb-4 text-sm text-center">
            {successMessage}
          </p>
        )}
        {errors.general && (
          <p className="text-red-500 bg-red-100 border border-red-400 rounded-md p-3 mb-4 text-sm text-center">
            {errors.general}
          </p>
        )}
        {step === 1 ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">OTP Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : ''}`}
                required
                disabled={isLoading}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              <ul className="text-sm mt-2 space-y-1">
                <li className={`flex items-center ${passwordCriteria.length ? 'text-green-600' : 'text-gray-600'}`}>
                  {passwordCriteria.length ? '✅' : '⬜'} At least 8 characters
                </li>
                <li className={`flex items-center ${passwordCriteria.uppercase ? 'text-green-600' : 'text-gray-600'}`}>
                  {passwordCriteria.uppercase ? '✅' : '⬜'} At least one uppercase letter
                </li>
                <li className={`flex items-center ${passwordCriteria.number ? 'text-green-600' : 'text-gray-600'}`}>
                  {passwordCriteria.number ? '✅' : '⬜'} At least one number
                </li>
              </ul>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
              disabled={isLoading || !!errors.password}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
            <button
              type="button"
              onClick={handleResendOTP}
              className="w-full mt-2 text-blue-600 hover:underline text-sm"
              disabled={isLoading}
            >
              Resend OTP
            </button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-gray-600">
          Remembered your password?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;