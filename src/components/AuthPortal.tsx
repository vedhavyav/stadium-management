import React from 'react';
import { User } from '../types';
import { AlertTriangle } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../utils/lang';

interface AuthPortalProps {
  authEmail: string;
  setAuthEmail: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  authName: string;
  setAuthName: (val: string) => void;
  authRole: 'fan' | 'volunteer' | 'organizer';
  setAuthRole: (role: 'fan' | 'volunteer' | 'organizer') => void;
  authLang: User['languagePref'];
  setAuthLang: (lang: User['languagePref']) => void;
  isSignUpMode: boolean;
  setIsSignUpMode: (mode: boolean) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  handleAuthSubmit: (e: React.FormEvent) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authName,
  setAuthName,
  authRole,
  setAuthRole,
  authLang,
  setAuthLang,
  isSignUpMode,
  setIsSignUpMode,
  authError,
  setAuthError,
  handleAuthSubmit,
}) => {
  return (
    <div className="min-h-screen bg-pitch-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Pitch Lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <ellipse cx="50" cy="50" rx="40" ry="45" fill="none" stroke="#FFF" strokeWidth="1" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#FFF" strokeWidth="1" />
        </svg>
      </div>

      <div className="glass-panel w-full max-w-md p-6 md:p-8 rounded-2xl border border-pitch-border shadow-2xl relative z-10 fade-in">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-pitch-emerald to-pitch-cyan flex items-center justify-center font-bold text-2xl text-black shadow-lg glow-emerald mb-3">
            ⚽
          </div>
          <h1 className="font-sporty font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-pitch-emerald to-pitch-cyan">
            ArenaOS Portal
          </h1>
          <p className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase mt-1">
            FIFA World Cup 2026 Smart Stadium
          </p>
        </div>

        {/* Form Switcher */}
        <div className="flex border-b border-pitch-border pb-3 mb-5 gap-4">
          <button
            type="button"
            onClick={() => { setIsSignUpMode(false); setAuthError(null); }}
            className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 ${!isSignUpMode ? 'border-pitch-emerald text-pitch-emerald' : 'border-transparent text-gray-400 hover:text-white'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-emerald`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUpMode(true); setAuthError(null); }}
            className={`flex-1 pb-2 text-xs font-bold transition-all border-b-2 ${isSignUpMode ? 'border-pitch-emerald text-pitch-emerald' : 'border-transparent text-gray-400 hover:text-white'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-emerald`}
          >
            Register Account
          </button>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2 slide-up">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 text-xs">
          {isSignUpMode && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-300 uppercase mb-1">Display Name</label>
              <input 
                type="text"
                placeholder="Diego Ramirez"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full bg-slate-900 border border-pitch-border rounded-lg px-3 py-2 text-xs focus-visible:outline-none focus-visible:border-pitch-emerald focus-visible:ring-2 focus-visible:ring-pitch-emerald text-gray-100 placeholder:text-gray-600"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase mb-1">Email Address</label>
            <input 
              type="email"
              placeholder="diego@stadium.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full bg-slate-900 border border-pitch-border rounded-lg px-3 py-2 text-xs focus-visible:outline-none focus-visible:border-pitch-emerald focus-visible:ring-2 focus-visible:ring-pitch-emerald text-gray-100 placeholder:text-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-300 uppercase mb-1">Password</label>
            <input 
              type="password"
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full bg-slate-900 border border-pitch-border rounded-lg px-3 py-2 text-xs focus-visible:outline-none focus-visible:border-pitch-emerald focus-visible:ring-2 focus-visible:ring-pitch-emerald text-gray-100 placeholder:text-gray-600"
              required
            />
          </div>

          {isSignUpMode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-300 uppercase mb-1">Choose Role</label>
                <select 
                  value={authRole}
                  onChange={(e) => setAuthRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-pitch-border rounded-lg px-2.5 py-2 text-xs focus-visible:outline-none focus-visible:border-pitch-emerald focus-visible:ring-2 focus-visible:ring-pitch-emerald text-gray-100"
                >
                  <option value="fan">Fan Spectator</option>
                  <option value="volunteer">Volunteer Staff</option>
                  <option value="organizer">Command Center</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 uppercase mb-1">Language</label>
                <select 
                  value={authLang}
                  onChange={(e) => setAuthLang(e.target.value as any)}
                  className="w-full bg-slate-900 border border-pitch-border rounded-lg px-2.5 py-2 text-xs focus-visible:outline-none focus-visible:border-pitch-emerald text-gray-100"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-pitch-emerald text-black py-2.5 rounded-lg text-xs font-bold hover:bg-pitch-emerald/90 transition-all uppercase mt-2 shadow-lg shadow-pitch-emerald/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-emerald"
          >
            {isSignUpMode ? 'Register New Profile' : 'Authenticate Credentials'}
          </button>
        </form>

        {/* Test credentials tips */}
        <div className="mt-6 border-t border-pitch-border/50 pt-4 text-[11px] text-gray-400">
          <span className="font-semibold block text-[11px] text-pitch-gold uppercase mb-1">💡 Pre-seeded testing accounts:</span>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Fan</strong>: <code className="text-gray-300">diego@stadium.com</code></li>
            <li><strong>Volunteer</strong>: <code className="text-gray-300">sarah@stadium.com</code></li>
            <li><strong>Organizer</strong>: <code className="text-gray-300">marcus@stadium.com</code></li>
          </ul>
          <p className="mt-2 text-gray-500 font-medium italic">Password for all is <code className="text-gray-400">password</code></p>
        </div>
      </div>
    </div>
  );
};
