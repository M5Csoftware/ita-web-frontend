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
  KeyRound
} from 'lucide-react';
import { UserAccount, ALL_TAB_IDS } from '@/types/iata';

interface LoginViewProps {
  users: UserAccount[];
  onLogin: (user: UserAccount) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      let matched = users.find(
        (u) => u.username.toLowerCase() === trimmedUser && (u.password || '') === password
      );

      // Failsafe guarantee for admin / admin login
      if (!matched && trimmedUser === 'admin' && password === 'admin') {
        matched = {
          id: 'usr-admin',
          username: 'admin',
          password: 'admin',
          fullName: 'System Administrator',
          role: 'admin',
          email: 'admin@iata-cargo.org',
          stationCode: 'DEL (HQ)',
          isActive: true,
          permissions: ALL_TAB_IDS,
        };
      }

      if (matched) {
        if (!matched.isActive) {
          setErrorMsg('This account has been deactivated. Please contact your system administrator.');
          setIsLoading(false);
          return;
        }
        // Admin strictly has all permissions enabled
        if (matched.username.toLowerCase() === 'admin' || matched.role === 'admin') {
          matched = { ...matched, role: 'admin', permissions: ALL_TAB_IDS };
        }
        onLogin(matched);
      } else {
        setErrorMsg('Invalid username or password. You can use admin / admin to log in.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickLogin = (uname: string, pword: string) => {
    setUsername(uname);
    setPassword(pword);
    setErrorMsg('');
    const trimmed = uname.toLowerCase();
    let matched = users.find(
      (u) => u.username.toLowerCase() === trimmed && (u.password || '') === pword
    );
    if (!matched && trimmed === 'admin' && pword === 'admin') {
      matched = {
        id: 'usr-admin',
        username: 'admin',
        password: 'admin',
        fullName: 'System Administrator',
        role: 'admin',
        email: 'admin@iata-cargo.org',
        stationCode: 'DEL (HQ)',
        isActive: true,
        permissions: ALL_TAB_IDS,
      };
    }
    if (matched && matched.isActive) {
      if (matched.username.toLowerCase() === 'admin' || matched.role === 'admin') {
        matched = { ...matched, role: 'admin', permissions: ALL_TAB_IDS };
      }
      onLogin(matched);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Background ambient lighting */}
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

        {/* Login Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-7 sm:p-9 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold font-heading text-slate-900">Sign in to your station</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your credentials to access your permitted cargo modules
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
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
                  placeholder="e.g. admin"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5EAD] focus:border-transparent font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold font-heading text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
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
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2C5EAD] to-[#1591DC] hover:from-[#204580] hover:to-[#0f7ab9] text-white font-bold font-heading text-sm shadow-md shadow-[#2C5EAD]/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
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

          {/* Quick 1-Click Login Testing Chips */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-heading text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#1591DC]" />
                1-Click Quick Login
              </span>
              <span className="text-[10px] text-slate-400 font-mono">admin / admin</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin')}
                className="py-2 px-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-700 text-xs font-bold font-heading transition-all flex flex-col items-center gap-0.5 cursor-pointer text-center"
              >
                <span>👑 admin</span>
                <span className="text-[10px] font-mono text-purple-600 font-normal">All 10 Access</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user1', 'user1')}
                className="py-2 px-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#2C5EAD] text-xs font-bold font-heading transition-all flex flex-col items-center gap-0.5 cursor-pointer text-center"
              >
                <span>👤 user1</span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">user1 / user1</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user2', 'user2')}
                className="py-2 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold font-heading transition-all flex flex-col items-center gap-0.5 cursor-pointer text-center"
              >
                <span>👤 user2</span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">user2 / user2</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('user3', 'user3')}
                className="py-2 px-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold font-heading transition-all flex flex-col items-center gap-0.5 cursor-pointer text-center"
              >
                <span>👤 user3</span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">user3 / user3</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-xs text-slate-400 font-sans flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>IATA Resolution 600b Accredited Agency Portal</span>
        </div>
      </div>
    </div>
  );
};

