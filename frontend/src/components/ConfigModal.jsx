import React from 'react';
import { Shield } from 'lucide-react';

export default function ConfigModal({
  showConfigModal,
  supabaseUrl,
  setSupabaseUrl,
  supabaseAnonKey,
  setSupabaseAnonKey,
  onSaveConfig
}) {
  if (!showConfigModal) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="glass-panel p-8 max-w-lg w-full space-y-6">
        <div className="text-center">
          <Shield className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
          <h3 className="font-space text-2xl font-bold">Configure Supabase Project</h3>
          <p className="text-zinc-400 text-sm mt-1">
            Enter your Supabase credentials to enable auth, storage buckets, and PostgreSQL history lists.
          </p>
        </div>

        <form onSubmit={onSaveConfig} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-space">Supabase API URL</label>
            <input 
              type="url" 
              required 
              className="glass-input text-sm" 
              placeholder="https://your-project-id.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2 font-space">Supabase Anon/Public API Key</label>
            <textarea 
              required 
              rows={3}
              className="glass-input text-sm font-mono" 
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-bold font-space transition-all shadow-glow"
            >
              Save Credentials & Re-initialize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
