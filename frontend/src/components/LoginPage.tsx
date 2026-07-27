// LoginPage.tsx
import React, { useState } from 'react';
import { authService } from '../services/auth';
import knitIcon from '../../assets/knit-icon.png';
import PasswordInput from './ui/PasswordInput';

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  onSwitchToInquiry: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onSwitchToSignup,
  onForgotPassword,
  onSwitchToInquiry
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const schoolLogo = knitIcon;
  const schoolName = '';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      await authService.login(email, password);
      onLogin();
    } catch (err: any) {
      setError(
        err.message || 'Failed to sign in. Please check your credentials.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Logo + Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-5 transition-all duration-300 hover:shadow-2xl">
            <img
              src={schoolLogo}
              alt={schoolName ? `${schoolName} Logo` : 'Knit Logo'}
              className="w-32 h-32 object-contain drop-shadow-lg"
            />
          </div>
        </div>

        <h2 className="text-center text-4xl font-extrabold tracking-tight text-slate-900">
          Sign in to your Knit Portal
        </h2>

        {schoolName && (
          <p className="mt-3 text-center text-sm font-medium text-slate-500">
            {schoolName}
          </p>
        )}
      </div>

      {/* Login Card */}
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-gray-200 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700"
              >
                Email address
              </label>

              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="mt-2">
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />

                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="font-semibold text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-xl border border-transparent bg-blue-600 py-3 px-4 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer"
              >
                Sign in
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>

              <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-wider select-none">
                Or
              </span>

              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Inquiry Text */}
            <div className="text-center">
              <p className="text-sm text-gray-500 max-w-[300px] mx-auto leading-relaxed mb-4">
                Not ready for a full enrollment application? Submit a quick
                inquiry to express your interest and connect with the school.
              </p>
            </div>

            {/* Inquiry Button */}
            <div>
              <button
                type="button"
                onClick={onSwitchToInquiry}
                className="flex w-full justify-center items-center gap-2 rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all cursor-pointer"
              >
                <svg
                  className="w-4 h-4 text-purple-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>

                <span>Submit a School Inquiry</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Knit. All rights reserved.</p>

        <p className="mt-2">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="font-semibold text-blue-600 hover:text-blue-500 cursor-pointer"
          >
            Sign up
          </button>
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
