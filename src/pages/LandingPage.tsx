import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GMCLogo } from '../components/common/GMCLogo';
import { LandingMap } from '../components/landing/LandingMap';
import { DemoModal, InfoModal } from '../components/landing/LandingModals';
import {
  Lock,
  ArrowRight,
  Play,
  Activity,
  Lightbulb,
  ShieldCheck,
  Leaf,
  MapPin,
  BarChart3,
  Shield,
  Zap,
  Wrench,
  Menu,
  X,
  CheckCircle2,
  Mail,
  User,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { getSupabaseStatus } from '../services/supabaseClient';

interface LandingPageProps {
  onEnterDashboard: (roleOverride?: 'administrator' | 'operator') => void;
  onOpenMap: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard, onOpenMap }) => {
  const { isAuthenticated, user, login, register, loginWithGoogle, forgotPassword, logout, isLoading } =
    useAuth();

  // Navigation & Modal states
  const [activeNav, setActiveNav] = useState<'Home' | 'About' | 'Features' | 'How It Works' | 'Contact'>('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; body: React.ReactNode } | null>(null);

  // Authentication Modal state (for unauthenticated visitors)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');

  // Sign In inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Forgot password sub-view
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Status feedback
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const supabaseStatus = getSupabaseStatus();

  // Handler for Access Dashboard buttons
  const handleAccessDashboard = () => {
    if (isAuthenticated) {
      onEnterDashboard(user?.role);
    } else {
      setAuthError(null);
      setAuthSuccess(null);
      setIsAuthModalOpen(true);
    }
  };

  // 1-Click Quick Demo Login Handler
  const handleQuickDemoLogin = async (role: 'admin' | 'operator') => {
    setAuthError(null);
    setAuthSuccess(null);
    if (role === 'admin') {
      setLoginEmail('admin@gmc.gov.in');
      setLoginPassword('admin123');
      const res = await login('admin@gmc.gov.in', 'admin123');
      if (res.success) {
        setIsAuthModalOpen(false);
        onEnterDashboard('administrator');
      } else {
        setAuthError(res.error || 'Failed to sign in as Admin.');
      }
    } else {
      setLoginEmail('operator@gmc.gov.in');
      setLoginPassword('operator123');
      const res = await login('operator@gmc.gov.in', 'operator123');
      if (res.success) {
        setIsAuthModalOpen(false);
        onEnterDashboard('operator');
      } else {
        setAuthError(res.error || 'Failed to sign in as Operator.');
      }
    }
  };

  // Sign In submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!loginEmail || !loginPassword) {
      setAuthError('Please enter both email address and password.');
      return;
    }

    const res = await login(loginEmail, loginPassword);
    if (res.success) {
      setIsAuthModalOpen(false);
      onEnterDashboard(res.role);
    } else {
      setAuthError(res.error || 'Sign in failed. Please verify credentials.');
    }
  };

  // Register submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (regPassword !== regConfirmPassword) {
      setAuthError('Passwords do not match. Please verify and re-type.');
      return;
    }

    if (regPassword.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    const res = await register(regFullName, regEmail, regPassword, regConfirmPassword);
    if (res.success) {
      setIsAuthModalOpen(false);
      onEnterDashboard('operator');
    } else {
      setAuthError(res.error || 'Registration failed. Please check your details.');
    }
  };

  // Google OAuth submit
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    const res = await loginWithGoogle();
    if (!res.success) {
      setAuthError(res.error || 'Google authentication encountered an error.');
    }
  };

  // Forgot password submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotStatus({ type: 'error', message: 'Please enter your registered email.' });
      return;
    }

    const res = await forgotPassword(forgotEmail);
    if (res.success) {
      setForgotStatus({
        type: 'success',
        message: 'Password reset link sent to your email. Please check your inbox.',
      });
    } else {
      setForgotStatus({
        type: 'error',
        message: res.message || 'Could not initiate password reset.',
      });
    }
  };

  // Open info modals
  const handleOpenInfo = (title: string, content: React.ReactNode) => {
    setInfoModalContent({ title, body: content });
  };

  return (
    <div className="min-h-screen bg-[#03152D] text-slate-100 font-sans selection:bg-[#12C8F4] selection:text-[#03152D] overflow-x-hidden">
      {/* ========================================================
          1. HEADER / NAVIGATION BAR
         ======================================================== */}
      <header className="sticky top-0 z-40 w-full bg-[#03152D]/95 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left Brand with Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveNav('Home')}>
            <GMCLogo size={46} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">GMC CCMS</span>
              </div>
              <p className="text-[11px] text-[#C7D2E0] font-medium leading-tight">
                Gandhidham Municipal Corporation
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {(['Home', 'About', 'Features', 'How It Works', 'Contact'] as const).map((item) => {
              const isActive = activeNav === item;
              return (
                <button
                  key={item}
                  onClick={() => {
                    setActiveNav(item);
                    if (item === 'About') {
                      handleOpenInfo(
                        'About GMC CCMS',
                        <div>
                          <p className="mb-3">
                            The Gandhidham Municipal Corporation (GMC) Centralized Control & Monitoring System (CCMS) is an enterprise IoT platform engineered for municipal public lighting across Gandhidham, Kandla Port, and Adipur.
                          </p>
                          <p>
                            Developed for the Seva First Hackathon 2026 under the Government of Gujarat smart city governance mission.
                          </p>
                        </div>
                      );
                    } else if (item === 'Features') {
                      const el = document.getElementById('features-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    } else if (item === 'How It Works') {
                      handleOpenInfo(
                        'How It Works â€” IoT Architecture',
                        <div>
                          <p className="mb-2"><strong>1. Hardware Gateway:</strong> ESP32 controllers continuously monitor voltage, current, and ambient light (LDR photocell).</p>
                          <p className="mb-2"><strong>2. Real-Time Telemetry:</strong> Incoming sensor readings update the cloud control room every 2 seconds via MQTT/REST.</p>
                          <p className="mb-2"><strong>3. Intelligent Safeguards:</strong> Autonomous open-circuit, daytime light detection, and overcurrent tripping.</p>
                          <p><strong>4. Role-Based Municipal Access:</strong> Complete oversight for Administrators and streamlined field dispatch for Operators.</p>
                        </div>
                      );
                    } else if (item === 'Contact') {
                      handleOpenInfo(
                        'Contact Gandhidham Municipal Corporation',
                        <div>
                          <p className="mb-2"><strong>Control Room:</strong> GMC Central Engineering Bhavan, Gandhidham, Kutch, Gujarat 370201</p>
                          <p className="mb-2"><strong>Email:</strong> ccms-support@gmc.gov.in / admin@gmc.gov.in</p>
                          <p><strong>Emergency Lighting Helpline:</strong> 1800-233-GMC (Toll Free)</p>
                        </div>
                      );
                    }
                  }}
                  className={`relative py-1 transition-colors ${
                    isActive ? 'text-[#12C8F4] font-semibold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {item}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#12C8F4] rounded-full shadow-[0_0_8px_#12C8F4]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Access Dashboard */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAccessDashboard}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-md hover:shadow-cyan-500/25 transition-all"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Control Room ({user.role})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleAccessDashboard}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] text-white text-xs font-semibold shadow-md hover:shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <Lock className="h-3.5 w-3.5 text-white" />
                <span>Access Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#051833] border-b border-slate-800 px-4 py-4 space-y-3">
            {(['Home', 'About', 'Features', 'How It Works', 'Contact'] as const).map((item) => (
              <button
                key={item}
                onClick={() => {
                  setActiveNav(item);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left py-2 px-3 rounded-md text-sm ${
                  activeNav === item ? 'bg-cyan-500/10 text-[#12C8F4] font-bold' : 'text-slate-300'
                }`}
              >
                {item}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-700/60">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleAccessDashboard();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#0284C7] text-white text-xs font-bold"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Access Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          2. HERO SECTION
         ======================================================== */}
      <section className="relative w-full min-h-[460px] md:min-h-[500px] lg:min-h-[520px] flex items-center overflow-hidden border-b border-slate-800/60">
        {/* Background Streetlight Night Photograph */}
        <div className="absolute inset-0 z-0">
          <img
            src="/reference.jpg"
            alt="Modern illuminated urban street with LED streetlights at night"
            className="w-full h-full object-cover object-[80%_22%] scale-105 filter brightness-95"
          />
          {/* Smooth Dark Navy Gradient Overlay from Left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#03152D] via-[#03152D]/95 via-45% to-transparent to-90%" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#03152D] via-transparent to-transparent" />
        </div>

        {/* Hero Left Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
          <div className="max-w-xl text-left">
            {/* Small Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#071D39]/90 border border-slate-700/80 text-[11px] font-medium text-slate-200 shadow-sm backdrop-blur-md mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              <span>IoT Powered Â· Smart City Initiative</span>
            </div>

            {/* Main Bold Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
              <span className="text-white block">Smarter Streets.</span>
              <span className="text-[#12C8F4] block">Brighter Futures.</span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#C7D2E0] font-normal leading-relaxed mb-8 max-w-lg">
              An intelligent IoT-powered streetlight monitoring and centralized control platform for a safer, smarter and more energy-efficient Gandhidham.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleAccessDashboard}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#12C8F4] hover:bg-[#38BDF8] active:bg-[#0284C7] text-[#03152D] text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5"
              >
                <span>Explore Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#071D39]/80 hover:bg-[#071D39] border border-slate-600/70 hover:border-slate-500 text-white text-xs sm:text-sm font-semibold shadow-sm backdrop-blur-md transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-white text-white" />
                <span>Watch Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. FOUR FEATURE CARDS
         ======================================================== */}
      <section id="features-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Real-Time Monitoring */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#081A36]/90 border border-slate-800 hover:border-[#12C8F4]/40 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-[#0A2244] border border-[#12C8F4]/30 text-[#12C8F4] group-hover:shadow-[0_0_12px_rgba(18,200,244,0.4)] transition-all">
              <Activity className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white group-hover:text-[#12C8F4] transition-colors">
                Real-Time Monitoring
              </h3>
              <p className="text-xs text-[#C7D2E0] mt-0.5">Track every streetlight instantly.</p>
            </div>
          </div>

          {/* Card 2: Smart Control */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#081A36]/90 border border-slate-800 hover:border-[#12C8F4]/40 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-[#0A2244] border border-[#12C8F4]/30 text-[#12C8F4] group-hover:shadow-[0_0_12px_rgba(18,200,244,0.4)] transition-all">
              <Lightbulb className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white group-hover:text-[#12C8F4] transition-colors">
                Smart Control
              </h3>
              <p className="text-xs text-[#C7D2E0] mt-0.5">Manage lights remotely with ease.</p>
            </div>
          </div>

          {/* Card 3: Intelligent Fault Detection */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#081A36]/90 border border-slate-800 hover:border-[#12C8F4]/40 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-[#0A2244] border border-[#12C8F4]/30 text-[#12C8F4] group-hover:shadow-[0_0_12px_rgba(18,200,244,0.4)] transition-all">
              <ShieldCheck className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white group-hover:text-[#12C8F4] transition-colors">
                Intelligent Fault Detection
              </h3>
              <p className="text-xs text-[#C7D2E0] mt-0.5">Get alerts, fix faster.</p>
            </div>
          </div>

          {/* Card 4: Energy Efficient */}
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#081A36]/90 border border-slate-800 hover:border-[#12C8F4]/40 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-[#0A2244] border border-[#12C8F4]/30 text-[#12C8F4] group-hover:shadow-[0_0_12px_rgba(18,200,244,0.4)] transition-all">
              <Leaf className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white group-hover:text-[#12C8F4] transition-colors">
                Energy Efficient
              </h3>
              <p className="text-xs text-[#C7D2E0] mt-0.5">Build a sustainable city.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. GANDHIDHAM INTERACTIVE MAP & OUR IMPACT SECTION
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Explore Gandhidham */}
          <div className="lg:col-span-7 rounded-2xl bg-[#081A36]/80 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-md text-left flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#0A2548] text-[#12C8F4]">
                <MapPin className="h-5 w-5 fill-[#12C8F4]/20 text-[#12C8F4]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Explore Gandhidham</h3>
                <p className="text-xs text-[#C7D2E0] mt-0.5">
                  View streetlight locations and status on live map
                </p>
              </div>
            </div>

            {/* Interactive Leaflet Satellite Map */}
            <LandingMap onOpenMap={onOpenMap} />
          </div>

          {/* Right Column (5 cols): Our Impact */}
          <div className="lg:col-span-5 rounded-2xl bg-[#081A36]/80 border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-md text-left relative overflow-hidden flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start gap-3 mb-6 relative z-10">
              <div className="p-2 rounded-lg bg-[#0A2548] text-[#12C8F4]">
                <BarChart3 className="h-5 w-5 text-[#12C8F4]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Our Impact</h3>
              </div>
            </div>

            {/* 4 Impact List Items */}
            <div className="space-y-4 relative z-10 my-auto">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-[#0A2548] flex items-center justify-center text-[#12C8F4] flex-shrink-0">
                  <Shield className="h-4 w-4 text-[#12C8F4]" />
                </div>
                <span className="text-sm font-medium text-white">Safer City</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-[#0A2548] flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Zap className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-white">Lower Energy Consumption</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-[#0A2548] flex items-center justify-center text-[#12C8F4] flex-shrink-0">
                  <Wrench className="h-4 w-4 text-[#12C8F4]" />
                </div>
                <span className="text-sm font-medium text-white">Faster Maintenance</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-[#0A2548] flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <Leaf className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-white">Greener Environment</span>
              </div>
            </div>

            {/* Background Aesthetic: Glowing Blue Neon Arc & City Skyline Silhouette */}
            <div className="absolute right-0 bottom-0 w-52 h-44 pointer-events-none opacity-85 overflow-hidden">
              <svg viewBox="0 0 200 160" className="w-full h-full" fill="none">
                {/* Glowing Circular Arc Ring */}
                <path
                  d="M 190,160 A 110,110 0 0,0 60,160"
                  stroke="#12C8F4"
                  strokeWidth="2.5"
                  strokeOpacity="0.8"
                  filter="drop-shadow(0 0 8px #12C8F4)"
                />
                <path
                  d="M 190,160 A 115,115 0 0,0 55,160"
                  stroke="#0284C7"
                  strokeWidth="1"
                  strokeOpacity="0.4"
                />

                {/* City Skyscrapers Silhouette */}
                <g fill="#071933" opacity="0.95">
                  <rect x="80" y="110" width="16" height="50" rx="1" />
                  <rect x="100" y="90" width="18" height="70" rx="1" />
                  <polygon points="109,75 102,90 116,90" fill="#0A2244" />
                  <rect x="122" y="100" width="14" height="60" rx="1" />
                  <rect x="140" y="80" width="22" height="80" rx="1" />
                  <polygon points="151,62 144,80 158,80" fill="#0A2244" />
                  <rect x="166" y="105" width="20" height="55" rx="1" />
                </g>
                {/* Little Cyan Building Windows */}
                <g fill="#12C8F4" opacity="0.6">
                  <circle cx="106" cy="98" r="0.8" />
                  <circle cx="112" cy="98" r="0.8" />
                  <circle cx="106" cy="106" r="0.8" />
                  <circle cx="112" cy="106" r="0.8" />
                  <circle cx="147" cy="90" r="0.8" />
                  <circle cx="155" cy="90" r="0.8" />
                  <circle cx="147" cy="100" r="0.8" />
                  <circle cx="155" cy="100" r="0.8" />
                  <circle cx="147" cy="110" r="0.8" />
                  <circle cx="155" cy="110" r="0.8" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. BOTTOM CALL-TO-ACTION (CTA) SECTION
         ======================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14">
        <div className="relative rounded-2xl bg-gradient-to-r from-[#061A36] via-[#092248] to-[#061A36] border border-cyan-500/25 p-6 sm:p-8 md:p-10 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          {/* Subtle City Skyline Silhouette Graphic on Left */}
          <div className="absolute left-0 bottom-0 h-full w-64 pointer-events-none opacity-40">
            <svg viewBox="0 0 240 100" className="w-full h-full" preserveAspectRatio="none" fill="none">
              <g fill="#0284C7" opacity="0.3">
                <rect x="10" y="30" width="22" height="70" />
                <rect x="36" y="15" width="26" height="85" />
                <polygon points="49,0 39,15 59,15" />
                <rect x="66" y="40" width="18" height="60" />
                <rect x="88" y="20" width="30" height="80" />
                <polygon points="103,5 92,20 114,20" />
                <rect x="122" y="45" width="20" height="55" />
                <rect x="146" y="25" width="28" height="75" />
              </g>
            </svg>
          </div>

          {/* Center Text */}
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Take Control of Smart Street Lighting
            </h2>
            <p className="text-xs sm:text-sm text-[#C7D2E0] mt-1.5 font-normal">
              Experience the power of LUMEN â€“ Smart, Connected, and Sustainable.
            </p>
          </div>

          {/* Right Action Button */}
          <div className="relative z-10 flex-shrink-0 w-full md:w-auto">
            <button
              onClick={handleAccessDashboard}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#12C8F4] hover:bg-[#38BDF8] active:bg-[#0284C7] text-[#03152D] text-xs sm:text-sm font-bold shadow-lg shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <span>Enter the Control Center</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. FOOTER
         ======================================================== */}
      <footer className="w-full bg-[#020E1E] border-t border-slate-800/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#C7D2E0]">
          {/* Left Text */}
          <div className="flex items-center gap-2 font-medium">
            <span className="text-white font-bold">GMC CCMS</span>
            <span className="text-slate-600">|</span>
            <span>Gandhidham Municipal Corporation</span>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() =>
                handleOpenInfo(
                  'Privacy Policy',
                  <p>
                    Gandhidham Municipal Corporation (GMC) protects all citizen and municipal telemetry data in accordance with the Digital Personal Data Protection Act (DPDP) and Government of Gujarat cybersecurity guidelines. CCMS sensor data is strictly used for public infrastructure maintenance.
                  </p>
                )
              }
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() =>
                handleOpenInfo(
                  'Terms of Use',
                  <p>
                    Authorized municipal personnel only. All supervisory controls, streetlight switching, and threshold configurations are recorded in compliance with GMC audit regulations. Unauthorized access is prohibited.
                  </p>
                )
              }
              className="hover:text-white transition-colors"
            >
              Terms of Use
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() =>
                handleOpenInfo(
                  'Contact Municipal Support',
                  <div>
                    <p className="mb-2"><strong>Gandhidham Municipal Corporation</strong></p>
                    <p className="mb-1">Central Control Room, Gujarat, India</p>
                    <p className="mb-1">Email: contact@gmc.gov.in</p>
                    <p>Helpline: +91 2836 220000</p>
                  </div>
                )
              }
              className="hover:text-white transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================
          AUTHENTICATION MODAL (For Unauthenticated Visitors)
         ======================================================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-left">
          <div className="relative w-full max-w-md rounded-2xl bg-[#091528] border border-cyan-500/30 p-6 md:p-8 shadow-2xl overflow-hidden">
            {/* Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <GMCLogo size={36} />
                <div>
                  <h3 className="text-base font-bold text-white">GMC CCMS Portal</h3>
                  <p className="text-[11px] text-slate-400">Gandhidham Municipal Corporation</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error & Success Feedback */}
            {authError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Tabs: Sign In / Create Account */}
            {!isForgotPasswordOpen ? (
              <div className="mt-5">
                <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mb-5">
                  <button
                    onClick={() => {
                      setAuthTab('signin');
                      setAuthError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      authTab === 'signin'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthTab('register');
                      setAuthError(null);
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      authTab === 'register'
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* SIGN IN FORM */}
                {authTab === 'signin' && (
                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Official Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="e.g. admin@gmc.gov.in"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#060D1A] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">Password</label>
                        <button
                          type="button"
                          onClick={() => setIsForgotPasswordOpen(true)}
                          className="text-[11px] text-cyan-400 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#060D1A] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.99] text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Sign In to CCMS</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* CREATE ACCOUNT FORM */}
                {authTab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="e.g. Rajesh Sharma"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060D1A] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="rajesh@gmc.gov.in"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060D1A] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Password (min 8 chars)
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060D1A] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#060D1A] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.99] text-xs font-bold text-slate-950 shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Create Operator Account</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Continue with Google */}
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-[#0B1528] hover:bg-[#0E1E38] border border-slate-700 text-xs font-semibold text-white transition-all flex items-center justify-center gap-3 shadow-sm"
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
                  {!supabaseStatus.configured && (
                    <p className="text-[10px] text-slate-500 text-center mt-2">
                      Local simulation active (Google OAuth requires live Supabase client ID).
                    </p>
                  )}
                </div>

                {/* 1-Click Demo Login Shortcuts */}
                <div className="mt-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-xs">
                  <div className="font-semibold text-cyan-300 mb-2 flex items-center justify-between">
                    <span>Quick Demo Sign In (1-Click):</span>
                    <span className="text-[10px] text-cyan-400 font-mono">SEVA FIRST 2026</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('admin')}
                      className="px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-[11px] font-bold text-cyan-200 transition-all text-left flex flex-col"
                    >
                      <span className="text-white flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        Admin Portal
                      </span>
                      <span className="text-[10px] text-cyan-400/90 font-mono mt-0.5">admin@gmc.gov.in</span>
                      <span className="text-[9px] text-slate-400 font-mono">Pass: admin123</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('operator')}
                      className="px-3 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/40 text-[11px] font-bold text-blue-200 transition-all text-left flex flex-col"
                    >
                      <span className="text-white flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-blue-400" />
                        Operator Portal
                      </span>
                      <span className="text-[10px] text-blue-400/90 font-mono mt-0.5">operator@gmc.gov.in</span>
                      <span className="text-[9px] text-slate-400 font-mono">Pass: operator123</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* FORGOT PASSWORD SUB-VIEW */
              <div className="mt-5 space-y-4">
                <h4 className="text-sm font-bold text-white">Reset Municipal Password</h4>
                <p className="text-xs text-slate-400">
                  Enter your registered official email. We will send you instructions to reset your access credentials.
                </p>

                {forgotStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                      forgotStatus.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span>{forgotStatus.message}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your-name@gmc.gov.in"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#060D1A] border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordOpen(false);
                        setForgotStatus(null);
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          DEMO & INFO MODALS
         ======================================================== */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onEnterDashboard={handleAccessDashboard}
      />

      {infoModalContent && (
        <InfoModal
          title={infoModalContent.title}
          isOpen={true}
          onClose={() => setInfoModalContent(null)}
        >
          {infoModalContent.body}
        </InfoModal>
      )}
    </div>
  );
};

