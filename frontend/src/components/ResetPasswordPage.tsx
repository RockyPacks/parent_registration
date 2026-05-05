import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth';
import { supabase } from '../services/supabase';
import knitIcon from '../../assets/knit-icon.png';
import PasswordInput from './ui/PasswordInput';

interface ResetPasswordPageProps {
  onPasswordReset: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onPasswordReset }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    // Extract tokens from hash and set session manually before cleaning the URL.
    // With implicit flow, Supabase puts access_token/refresh_token in the hash.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    const establishSession = async () => {
      if (accessToken && refreshToken) {
        // Explicitly set the session from the URL tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setSessionError('This reset link has expired or already been used. Please request a new one.');
        } else {
          setSessionReady(true);
        }
      } else {
        // No tokens in hash — check if there's already an active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
        } else {
          setSessionError('This reset link has expired or already been used. Please request a new one.');
        }
      }
      // Clean the hash from the URL after we've extracted what we need
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    establishSession();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(password);
      setSuccess(true);
      setTimeout(() => onPasswordReset(), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <img src={knitIcon} alt="Knit Logo" className="w-20 h-auto" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Set new password
        </h2>
        {sessionReady && !sessionError && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-lg sm:px-10">
          {/* Session error - link expired */}
          {sessionError && (
            <div className="text-center">
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <p className="text-sm font-medium text-red-800">{sessionError}</p>
              </div>
              <button
                onClick={onPasswordReset}
                className="font-medium text-blue-600 hover:text-blue-500 text-sm"
              >
                Back to sign in
              </button>
            </div>
          )}

          {/* Loading while session is being established */}
          {!sessionReady && !sessionError && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Verifying reset link...</p>
            </div>
          )}

          {/* Success state */}
          {success && (
            <div className="text-center">
              <div className="rounded-md bg-green-50 p-4 mb-4">
                <p className="text-sm font-medium text-green-800">
                  Password updated successfully! Redirecting to login...
                </p>
              </div>
            </div>
          )}

          {/* Password form - only show when session is ready and not yet succeeded */}
          {sessionReady && !sessionError && !success && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New password
              </label>
              <div className="mt-1">
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Min 8 characters, with uppercase, lowercase, and a special character.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm new password
              </label>
              <div className="mt-1">
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
