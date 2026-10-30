import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lightbulb, Lock, Mail, Shield, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured, getSupabaseStatus } from '../services/supabaseClient';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const supabaseStatus = getSupabaseStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Login failed. Please verify credentials.');
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background radial gradients for smart city aesthetic */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Emblem & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-3 shadow-glow-cyan mb-4">
            <Lightbulb className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            GMC Central Control & Monitoring System
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            IoT Public Street Lighting Infrastructure — Seva First Hackathon 2026
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-mono">
            Gandhidham Municipal Corporation (Gujarat)
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0F172A]/90 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Operator Sign-In</h2>
            <p className="text-xs text-slate-400">
              Enter your credentials to access the municipal control center
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="name@gmc.gov.in"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700/80 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operator Password
              </label>
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
                  <span>Access Control Room</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons for Jury Presentation */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              Demo Operator Accounts (Hackathon)
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@gmc.gov.in', 'GmcAdmin@2026')}
                className="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-colors"
              >
                <div className="font-semibold text-white flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                  Admin
                </div>
                <div className="text-[10px] text-slate-400 truncate">admin@gmc.gov.in</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('operator@gmc.gov.in', 'GmcOperator@2026')}
                className="text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 transition-colors"
              >
                <div className="font-semibold text-white flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  Operator
                </div>
                <div className="text-[10px] text-slate-400 truncate">operator@gmc.gov.in</div>
              </button>
            </div>
          </div>
        </div>

        {/* Backend Status Note */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Backend Status:{' '}
            <span className={isSupabaseConfigured ? 'text-emerald-400' : 'text-cyan-400'}>
              {isSupabaseConfigured ? 'Live Supabase Auth Connected' : 'Local Demonstration Mode Active'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

