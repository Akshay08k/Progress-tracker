import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { showToast } from '../store/uiSlice';
import { auth } from '../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { IoMailOutline, IoArrowBackOutline } from 'react-icons/io5';

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
      dispatch(showToast({ message: 'Password recovery email sent successfully!', type: 'success' }));
    } catch (error: unknown) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : 'Failed to dispatch reset email.';
      dispatch(showToast({ message: errMsg, type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center px-4 relative overflow-hidden bg-woven-grid">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }}></div>

      <div 
        className="w-full max-w-md bg-background-surface border-4 border-double border-accent/40 rounded-2xl shadow-floating p-8 relative"
        style={{ clipPath: 'polygon(0% 2%, 99% 0%, 98% 97%, 2% 99%)' }}
      >
        <div className="absolute inset-2 border border-dashed border-accent/30 rounded-xl pointer-events-none"></div>

        <div className="text-center mb-6 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-accent border-2 border-double border-white flex items-center justify-center shadow-orbital mx-auto mb-3 animate-float-slow">
            <span className="text-white font-extrabold text-lg font-mono-stats">S</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-text-primary uppercase font-mono-stats">
            RESTORE CANVAS
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            "Recover access to your stitches and habits in a single touch."
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4 relative z-10 py-4">
            <div className="w-12 h-12 bg-green-500/10 border-2 border-dashed border-green-500 text-green-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold font-mono-stats">
              ✓
            </div>
            <h3 className="text-base font-bold text-text-primary uppercase">Reset Link Dispatched</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              We have forwarded a password recovery link to <b>{email}</b>. Please inspect your inbox (and spam directory) and execute the instructions.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center justify-center gap-2 bg-accent border border-white px-6 py-2.5 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-orbital"
            >
              <IoArrowBackOutline />
              <span>Back to Login</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5 tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary/60">
                  <IoMailOutline className="text-base" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent border-2 border-double border-white py-3 rounded-lg text-white font-extrabold text-xs tracking-wider uppercase shadow-orbital hover:shadow-floating transition-all active:scale-95 duration-200 mt-2"
            >
              {loading ? 'Sending Recovery Link...' : 'Dispatch Reset Email'}
            </button>

            <div className="text-center mt-6">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-accent font-bold hover:underline"
              >
                <IoArrowBackOutline />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
