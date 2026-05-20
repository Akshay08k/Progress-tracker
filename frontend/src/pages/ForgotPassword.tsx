import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { showToast } from '../store/uiSlice';
import { auth } from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { IoMailOutline, IoArrowBackOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

export const ForgotPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      dispatch(showToast({ message: 'Please enter your email address.', type: 'error' }));
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      dispatch(showToast({ message: 'Reset email sent!', type: 'success' }));
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Failed to send reset email.';
      dispatch(showToast({ message: errMsg, type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Reset password</h2>
          <p className="text-text-secondary mt-1">Enter your email to receive a reset link</p>
        </div>

        {/* Card */}
        <div className="bg-background-surface rounded-2xl shadow-lg border border-border p-8">
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <IoCheckmarkCircleOutline className="text-green-500 text-3xl" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary">Check your email</h3>
              <p className="text-sm text-text-secondary">
                We sent a password reset link to <b className="text-text-primary">{email}</b>
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 px-6 py-2.5 rounded-xl text-white font-medium text-sm transition-colors"
              >
                <IoArrowBackOutline />
                <span>Back to Login</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/50">
                    <IoMailOutline className="text-lg" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-2.5 border border-border rounded-xl text-sm text-text-primary bg-background-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-text-secondary/40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 py-2.5 rounded-xl text-white font-medium text-sm transition-colors shadow-lg"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent font-medium transition-colors"
                >
                  <IoArrowBackOutline />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
