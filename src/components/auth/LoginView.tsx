'use client';

import React, { useState } from 'react';
import {
  PlaneTakeoff,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Mail,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount, ALL_TAB_IDS } from '@/types/iata';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface LoginViewProps {
  users: UserAccount[];
  onLogin: (user: UserAccount, token?: string) => void;
}

type Mode = 'signin' | 'signup';

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin }) => {
  const [mode, setMode] = useState<Mode>('signin');

  // Sign-in state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign-up state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupStation, setSignupStation] = useState('DEL');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /* ------------------------------------------------------------------ */
  /*                     SIGN IN  →  POST /api/auth/login                */
  /* ------------------------------------------------------------------ */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Invalid username or password.');
      }

      // Backend returns { success, token, user }
      let apiUser: UserAccount = data.user;

      // Enforce admin full-access rule on the client too
      if (apiUser.role === 'admin' || apiUser.username.toLowerCase() === 'admin') {
        apiUser = { ...apiUser, role: 'admin', permissions: ALL_TAB_IDS };
      }

      // Persist token for subsequent authenticated calls
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('iata_token', data.token);
        localStorage.setItem('iata_user', JSON.stringify(apiUser));
      }

      onLogin(apiUser, data.token);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Check that the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*                  SIGN UP  →  POST /api/users                        */
  /* ------------------------------------------------------------------ */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSignupSuccess('');

    if (signupUsername.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (signupFullName.trim().length < 2) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (signupPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupUsername.trim().toLowerCase(),
          password: signupPassword,
          fullName: signupFullName.trim(),
          email: signupEmail.trim(),
          stationCode: signupStation.trim() || 'DEL',
          role: 'user',
          isActive: true,
          permissions: ['dashboard'],
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || `Request failed (${res.status})`);
      }

      setSignupSuccess(
        `Account "${data.user?.username || signupUsername}" created successfully. You can now sign in.`
      );

      // Pre-fill sign-in username
      setUsername(data.user?.username || signupUsername.trim().toLowerCase());

      setSignupUsername('');
      setSignupFullName('');
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');

      setTimeout(() => {
        setMode('signin');
        setSignupSuccess('');
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrorMsg('');
    setSignupSuccess('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#2C5EAD]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#1591DC]/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-400">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2C5EAD] to-[#1591DC] text-white shadow-lg shadow-[#2C5EAD]/30 mb-4">
            <PlaneTakeoff className="w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 tracking-tight">
              IATA AWB Platform
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1591DC]/10 text-[#2C5EAD] font-bold border border-[#1591DC]/30">
              Res 600b
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            Air Cargo Operations, e-AWB EDI &amp; CASS Settlement
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-6">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold font-heading transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#2C5EAD] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold font-heading transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#2C5EAD] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold font-heading text-slate-900">
              {mode === 'signin' ? 'Sign in to your station' : 'Create a new station account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'signin'
                ? 'Enter your credentials to access your permitted cargo modules'
                : 'Register a new user. Default access is the Dashboard only — an admin can grant more modules later.'}
            </p>
          </div>

          {/* Banners */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
          {signupSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{signupSuccess}</span>
            </div>
          )}

          {/* ---------------------- SIGN IN ---------------------- */}
          {mode === 'signin' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:from-[#204580] hover:to-[#0f7ab9] text-white font-bold font-heading text-sm shadow-md shadow-[#2C5EAD]/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Authenticating Station...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ---------------------- SIGN UP ---------------------- */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="e.g. jdoe"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@station.com"
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5 uppercase tracking-wider">
                    Station Code
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupStation}
                      onChange={(e) => setSignupStation(e.target.value.toUpperCase())}
                      placeholder="DEL"
                      maxLength={6}
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-heading text-slate-700 mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold font-heading text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-6 text-xs text-slate-400 font-sans flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>IATA Resolution 600b Accredited Agency Portal</span>
        </div>
      </div>
    </div>
  );
};