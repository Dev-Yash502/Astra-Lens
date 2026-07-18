import React from 'react';
import { Key, LogOut } from 'lucide-react';
import logoImg from '../assets/logo_transparent.png';

export default function Navbar({ currentTab, setCurrentTab, user, onSignOut, onOpenConfig }) {
  return (
    <header className="glass-panel rounded-none border-t-0 border-x-0 sticky top-0 z-50 flex items-center justify-between px-8 py-5">
      <div 
        onClick={() => setCurrentTab('landing')}
        className="flex items-center cursor-pointer select-none"
      >
        <img src={logoImg} alt="Astra Lens Logo" className="h-12 w-auto object-contain animate-pulse" />
      </div>

      <nav className="hidden md:flex items-center gap-8 font-space">
        <span 
          onClick={() => setCurrentTab('landing')}
          className={`cursor-pointer transition-colors ${currentTab === 'landing' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'}`}
        >
          Home
        </span>
        {user && (
          <>
            <span 
              onClick={() => setCurrentTab('scan')}
              className={`cursor-pointer transition-colors ${currentTab === 'scan' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'}`}
            >
              Detector
            </span>
            <span 
              onClick={() => setCurrentTab('history')}
              className={`cursor-pointer transition-colors ${currentTab === 'history' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'}`}
            >
              Scan History
            </span>
          </>
        )}
        <span 
          onClick={() => setCurrentTab('about')}
          className={`cursor-pointer transition-colors ${currentTab === 'about' ? 'text-indigo-400' : 'text-zinc-400 hover:text-white'}`}
        >
          Manual & Viva FAQ
        </span>
      </nav>

      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenConfig}
          className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-zinc-400 hover:text-white"
          title="Configure Supabase Database"
        >
          <Key className="w-5 h-5" />
        </button>
        
        {user ? (
          <button 
            onClick={onSignOut}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all font-semibold"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        ) : (
          <button 
            onClick={() => { setCurrentTab('landing'); }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-semibold shadow-glow transition-all"
          >
            Get Started
          </button>
        )}
      </div>
    </header>
  );
}
