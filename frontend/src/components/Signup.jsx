import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ username: '', email: '', code: '', password: '' });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateUsername = (username) => {
    if (username.length < 6) {
      return 'Username must be at least 6 characters long.';
    }
    if (!/[a-zA-Z]/.test(username)) {
      return 'Username must contain at least one letter.';
    }
    return '';
  };

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
    number: /[0-9]/.test(formData.password),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'username') {
      setErrors({ ...errors, username: validateUsername(value) });
    } else if (name === 'password') {
      setErrors({ ...errors, password: validatePassword(value) });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    const usernameError = validateUsername(formData.username);
    if (usernameError) {
      setErrors({ ...errors, username: usernameError });
      setIsLoading(false);
      return;
    }
    try {
      await authApi.register({ username: formData.username, email: formData.email });
      setSuccessMessage('Registration successful! Please verify your email with the OTP sent.');
      setStep(2);
      setErrors({});
    } catch (err) {
  const errorData = err.response?.data || {};
  setErrors({
    ...errors,
    username: errorData.username?.[0],
    email: errorData.email?.[0],
    general: errorData.detail || errorData.error || 'Registration failed'
  });
} finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
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
      await authApi.verifyOTP({
        email: formData.email,
        code: formData.code,
        password: formData.password,
      });
      setSuccessMessage('Account verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrors({ ...errors, general: err.response?.data?.error || 'Verification failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    try {
      await authApi.requestOTP({ email: formData.email, context: 'register' });
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">
            {step === 1 ? 'Sign Up' : 'Verify OTP'}
          </h1>
          <p className="text-slate-500 mt-2">
            {step === 1 ? 'Create your account to start managing books' : 'Enter the OTP sent to your email'}
          </p>
        </div>
        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}
        {errors.general && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all ${errors.username ? 'border-red-500' : ''}`}
                  required
                  disabled={isLoading}
                />
                {errors.username && <p className="text-red-700 text-sm mt-1">{errors.username}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed"
                disabled={isLoading || !!errors.username}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600">OTP Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all ${errors.password ? 'border-red-500' : ''}`}
                  required
                  disabled={isLoading}
                />
                {errors.password && <p className="text-red-700 text-sm mt-1">{errors.password}</p>}
                <ul className="text-sm mt-2 space-y-1 text-slate-600">
                  <li className={passwordCriteria.length ? 'text-green-600' : ''}>
                    {passwordCriteria.length ? '✓' : '-'} At least 8 characters
                  </li>
                  <li className={passwordCriteria.uppercase ? 'text-green-600' : ''}>
                    {passwordCriteria.uppercase ? '✓' : '-'} At least one uppercase letter
                  </li>
                  <li className={passwordCriteria.number ? 'text-green-600' : ''}>
                    {passwordCriteria.number ? '✓' : '-'} At least one number
                  </li>
                </ul>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-not-allowed"
                disabled={isLoading || !!errors.password}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                className="w-full mt-2 text-sm text-slate-600 hover:text-slate-800 hover:underline"
                disabled={isLoading}
              >
                Resend OTP
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-slate-600 hover:text-slate-800 hover:underline">
              Login
            </Link>
          </p>
          {step === 1 && (
            <p className="mt-2 text-center text-sm text-slate-600">
              Forgot password?{' '}
              <Link to="/forgot-password" className="text-slate-600 hover:text-slate-800 hover:underline">
                Reset Password
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;