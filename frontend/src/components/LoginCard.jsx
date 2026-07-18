import React from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';

export default function LoginCard({
  authView,
  setAuthView,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  authError,
  setAuthError,
  authSuccess,
  setAuthSuccess,
  onAuthSubmit
}) {
  return (
    <div className="flex-1 w-full max-w-md">
      <div className="glass-panel p-8">
        <div className="flex border-b border-white/10 mb-8 font-space">
          <button 
            onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}
            className={`flex-1 pb-4 text-center font-bold transition-colors ${authView === 'login' ? 'border-b-2 border-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setAuthView('signup'); setAuthError(''); setAuthSuccess(''); }}
            className={`flex-1 pb-4 text-center font-bold transition-colors ${authView === 'signup' ? 'border-b-2 border-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Register
          </button>
        </div>

        {authError && (
          <div className="p-4 mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" /> {authError}
          </div>
        )}
        {authSuccess && (
          <div className="p-4 mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" /> {authSuccess}
          </div>
        )}

        <form onSubmit={onAuthSubmit} className="space-y-6">
          {authView === 'signup' && (
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Full Name / Username</label>
              <input 
                type="text" 
                required 
                className="glass-input" 
                placeholder="Enter full name or username"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              {authView === 'signup' ? 'Email Address' : 'Email or Username'}
            </label>
            <input 
              type="text" 
              required 
              className="glass-input" 
              placeholder={authView === 'signup' ? 'name@domain.com' : 'Enter email or username'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Password</label>
            <input 
              type="password" 
              required 
              className="glass-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-bold font-space transition-all shadow-glow"
          >
            {authView === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
