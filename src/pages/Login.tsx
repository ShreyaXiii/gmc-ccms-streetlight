import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lightbulb,
  Lock,
  Mail,
  Shield,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  User,
  KeyRound,
  X,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { isSupabaseConfigured, getSupabaseStatus } from '../services/supabaseClient';

interface LoginProps {
  onReturnToLanding?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onReturnToLanding }) => {
  const { login, register, loginWithGoogle, forgotPassword, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Status feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot Password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const supabaseStatus = getSupabaseStatus();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setError('Please provide both official email and password.');
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Login failed. Please verify municipal credentials.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify and re-type.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const res = await register(regFullName, regEmail, regPassword, regConfirmPassword);
    if (res.success) {
      setSuccessMessage('Account registered successfully as Field Operator! You can now sign in.');
      setEmail(regEmail);
      setPassword('');
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setAuthMode('signin');
    } else {
      setError(res.error || 'Registration failed. Please check your details.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    const res = await loginWithGoogle();
    if (!res.success) {
      setError(res.error || 'Google authentication encountered an error.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotFeedback(null);
    setIsForgotSubmitting(true);

    const res = await forgotPassword(forgotEmail);
    setIsForgotSubmitting(false);

    if (res.success) {
      setForgotFeedback({ type: 'success', message: res.message });
    } else {
      setForgotFeedback({ type: 'error', message: res.message });
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setAuthMode('signin');
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Background radial gradients for smart city aesthetic */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {onReturnToLanding && (
          <div className="mb-4 text-center">
            <button
              onClick={onReturnToLanding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors shadow-sm"
            >
              <span>← Back to Public Landing Page</span>
            </button>
          </div>
        )}
        {/* Emblem & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-3 shadow-glow-cyan mb-3">
            <Lightbulb className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            GMC Central Control & Monitoring System
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            IoT Public Street Lighting Infrastructure — Gandhidham Municipal Corporation
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-mono">
            Seva First Hackathon 2026 • Government of Gujarat
          </div>
        </div>

        {/* Auth Mode Toggle Tabs (Sign In vs Create Account) */}
        <div className="mb-4 grid grid-cols-2 p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              authMode === 'signin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Main Authentication Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0F172A]/95 p-7 shadow-2xl backdrop-blur-md">
          {/* Header Title */}
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">
              {authMode === 'signin' ? 'Control Room Sign-In' : 'Register Operator Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {authMode === 'signin'
                ? 'Authenticate to access live telemetry and municipal controls'
                : 'Create an authorized field operator account for GMC CCMS'}
            </p>
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Continue with Google OAuth Button */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 py-2.5 px-4 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm hover:border-slate-600"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative mt-4 mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-500 font-mono">
                <span className="bg-[#0F172A] px-2">or with official email</span>
              </div>
            </div>
          </div>

          {/* Form 1: SIGN IN */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@gmc.gov.in"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotFeedback(null);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-2.5 text-sm font-semibold text-white shadow-glow-cyan transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating Session...</span>
                ) : (
                  <>
                    <span>Sign In to CCMS</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form 2: CREATE ACCOUNT */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Rajesh Kumar Patel"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="rajesh.patel@gmc.gov.in"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password (min 8 chars, mixed case & numbers)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full rounded-lg bg-slate-900 border pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors ${
                      regConfirmPassword && regConfirmPassword !== regPassword
                        ? 'border-rose-500 focus:border-rose-500'
                        : 'border-slate-700/80 focus:border-cyan-500'
                    }`}
                    required
                  />
                </div>
                {regConfirmPassword && regConfirmPassword !== regPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match</p>
                )}
              </div>

              <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 text-[11px] text-slate-400">
                <span className="font-semibold text-cyan-400">Security Notice: </span>
                New municipal registrations are granted <span className="font-semibold text-white">Operator</span> role by default. Administrator access requires promotion by an authorized Commissioner.
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-2.5 text-sm font-semibold text-white shadow-glow-cyan transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Registering Account...</span>
                ) : (
                  <>
                    <span>Create Operator Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Fill Buttons for Jury Presentation */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-cyan-400" />
                Pre-Seeded Roles (Hackathon)
              </span>
              <span className="text-[10px] text-slate-500">Click to fill</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@gmc.gov.in', 'GmcAdmin@2026')}
                className="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-colors group"
              >
                <div className="font-semibold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Administrator
                  </span>
                  <span className="text-[9px] px-1 rounded bg-cyan-950 border border-cyan-800/60 text-cyan-300 font-mono">
                    Full Access
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">admin@gmc.gov.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('operator@gmc.gov.in', 'GmcOperator@2026')}
                className="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-colors group"
              >
                <div className="font-semibold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Operator
                  </span>
                  <span className="text-[9px] px-1 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-300 font-mono">
                    Restricted
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">operator@gmc.gov.in</div>
              </button>
            </div>
          </div>
        </div>

        {/* Backend & OAuth Status Note */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Backend Authentication:{' '}
            <span className={isSupabaseConfigured ? 'text-emerald-400 font-semibold' : 'text-cyan-400 font-semibold'}>
              {isSupabaseConfigured ? 'Live Supabase Cloud Connected' : 'Local Demonstration Mode Active'}
            </span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0F172A] p-6 shadow-2xl">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Municipal Password</h3>
                <p className="text-xs text-slate-400">Receive password recovery credentials</p>
              </div>
            </div>

            {forgotFeedback && (
              <div
                className={`mb-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
                  forgotFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {forgotFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <span>{forgotFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Registered Official Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@gmc.gov.in"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-glow-cyan transition-all disabled:opacity-50"
                >
                  {isForgotSubmitting ? 'Sending Request...' : 'Send Recovery Instructions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


