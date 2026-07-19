import React from 'react';
import { User } from '../types';
import { Key } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  handleSignOut: () => void;
  showApiModal: boolean;
  setShowApiModal: (show: boolean) => void;
  isApiConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  handleSignOut,
  showApiModal,
  setShowApiModal,
  isApiConfigured,
}) => {
  return (
    <header className="border-b border-pitch-border bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pitch-emerald to-pitch-cyan flex items-center justify-center font-bold text-xl text-black shadow-lg">
          ⚽
        </div>
        <div>
          <h1 className="font-sporty font-extrabold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-pitch-emerald to-pitch-cyan">
            ArenaOS
          </h1>
          <p className="text-[11px] text-gray-400 font-semibold tracking-wider uppercase">
            FIFA World Cup 2026 Operations
          </p>
        </div>
      </div>

      {/* --- Profile Details & Logout --- */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[11px] text-gray-300 font-semibold">{currentUser.name}</span>
          <span className="text-[11px] font-extrabold text-pitch-emerald uppercase tracking-wider">
            {currentUser.role === 'fan' ? 'Fan Spectator' : currentUser.role === 'volunteer' ? 'Volunteer Staff' : 'Command Center Organizer'}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="px-3 py-1.5 bg-slate-900 border border-pitch-border hover:border-red-900/50 hover:bg-red-950/10 text-gray-300 hover:text-red-400 rounded-lg text-xs font-bold transition-all uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-emerald"
        >
          Sign Out
        </button>
      </div>

      {/* --- Gemini configuration widget --- */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowApiModal(!showApiModal)}
          className={`p-2 rounded-full border transition-all ${isApiConfigured ? 'border-pitch-emerald bg-pitch-emerald/10 text-pitch-emerald' : 'border-pitch-border hover:bg-white/5 text-gray-400'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pitch-cyan`}
          title="Configure Gemini API Key"
          aria-label="Configure Gemini API Key"
        >
          <Key className="w-4.5 h-4.5" />
        </button>
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[11px] text-gray-400">AI Engine Status</span>
          <span className={`text-xs font-bold ${isApiConfigured ? 'text-pitch-emerald' : 'text-pitch-gold'}`}>
            {isApiConfigured ? 'Gemini Pro Live' : 'Local Fallback AI'}
          </span>
        </div>
      </div>
    </header>
  );
};
