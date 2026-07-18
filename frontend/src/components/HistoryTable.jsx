import React from 'react';
import { History, ShieldAlert, CheckCircle } from 'lucide-react';

export default function HistoryTable({
  historyList,
  historyLoading,
  totalScans,
  fakeCount,
  onRefresh,
  onLoadResult
}) {
  return (
    <div className="w-full max-w-5xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold font-space bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-2">
            Scan History Database
          </h2>
          <p className="text-zinc-400 text-sm">Persisted scan history loaded dynamically from Supabase PostgreSQL</p>
        </div>
        <button 
          onClick={onRefresh}
          className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-semibold flex items-center gap-2"
        >
          Refresh Database
        </button>
      </div>

      {/* Quick Analytics Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <span className="text-zinc-400 text-xs font-semibold font-space uppercase tracking-wider block mb-1">Total Scans</span>
            <span className="text-3xl font-extrabold text-white">{totalScans}</span>
          </div>
          <History className="w-8 h-8 text-indigo-500 opacity-60" />
        </div>
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <span className="text-zinc-400 text-xs font-semibold font-space uppercase tracking-wider block mb-1">AI Generated</span>
            <span className="text-3xl font-extrabold text-rose-400">{fakeCount}</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-rose-500 opacity-60" />
        </div>
        <div className="glass-panel p-6 flex items-center justify-between">
          <div>
            <span className="text-zinc-400 text-xs font-semibold font-space uppercase tracking-wider block mb-1">Authentic (Real)</span>
            <span className="text-3xl font-extrabold text-emerald-400">{totalScans - fakeCount}</span>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500 opacity-60" />
        </div>
      </div>

      {historyLoading ? (
        <div className="text-center py-20 text-zinc-500 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
          Loading history data...
        </div>
      ) : historyList.length === 0 ? (
        <div className="glass-panel p-16 text-center text-zinc-500">
          📁 No scans recorded yet. Select 'Detector' above to perform your first classification scan.
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-zinc-400 text-xs uppercase tracking-wider font-space">
                  <th className="px-6 py-4">Filename</th>
                  <th className="px-6 py-4">Prediction</th>
                  <th className="px-6 py-4">Confidence</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {historyList.map((scan) => (
                  <tr key={scan.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-semibold text-white max-w-[200px] truncate" title={scan.filename}>
                      {scan.filename}
                    </td>
                    <td className="px-6 py-4">
                      {scan.prediction === 'REAL' ? (
                        <span className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-bold font-space uppercase">
                          Real
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-bold font-space uppercase">
                          AI Generated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-300">
                      {(scan.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(scan.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onLoadResult(scan)}
                        className="px-3.5 py-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-xs font-bold font-space"
                      >
                        Load Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
