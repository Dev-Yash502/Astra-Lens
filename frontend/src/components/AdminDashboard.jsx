import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Cpu, Activity, Clock, FileText, ExternalLink, Calendar, Search } from 'lucide-react';

export default function AdminDashboard({ token, onViewScan }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('users'); // Default directly to Registered Accounts view!
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch users
      const usersRes = await fetch('/api/admin/users', { headers });
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch all scans
      const scansRes = await fetch('/api/admin/scans', { headers });
      const scansData = await scansRes.json();
      setScans(scansData);
    } catch (error) {
      console.error("Failed to load admin dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredScans = Array.isArray(scans) ? scans.filter(s => 
    (s.filename || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.prediction || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.user_id && s.user_id.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  const filteredUsers = Array.isArray(users) ? users.filter(u => 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  if (loading) {
    return (
      <div className="w-full max-w-5xl flex flex-col items-center py-20">
        <Activity className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-400 font-space">Loading secure administrative analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h2 className="text-4xl font-extrabold font-space bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-3">
          Administrative Center
        </h2>
        <p className="text-zinc-400">
          Monitor system activities, classification statistics, registered users, and active scan logs.
        </p>
      </div>

      {/* Grid of stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-zinc-500 text-xs uppercase tracking-wider font-space">Total Users</span>
              <span className="block text-2xl font-bold font-space mt-0.5">{stats.total_users}</span>
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-zinc-500 text-xs uppercase tracking-wider font-space">Total Scans</span>
              <span className="block text-2xl font-bold font-space mt-0.5">{stats.total_scans}</span>
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-zinc-500 text-xs uppercase tracking-wider font-space">Fake Ratio</span>
              <span className="block text-2xl font-bold font-space mt-0.5">
                {stats.total_scans > 0 
                  ? `${((stats.fake_count / stats.total_scans) * 100).toFixed(1)}%` 
                  : '0%'}
              </span>
            </div>
          </div>

          <div className="glass-panel p-6 flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-zinc-500 text-xs uppercase tracking-wider font-space">Avg Latency</span>
              <span className="block text-2xl font-bold font-space mt-0.5">{stats.avg_processing_time_ms} ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-navigation & Search bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex border-b border-white/5 font-space w-full md:w-auto">
          <button
            onClick={() => { setActiveSubTab('scans'); setSearchQuery(''); }}
            className={`pb-3 px-6 text-sm font-bold transition-all relative ${activeSubTab === 'scans' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            System Scan Logs
          </button>
          <button
            onClick={() => { setActiveSubTab('users'); setSearchQuery(''); }}
            className={`pb-3 px-6 text-sm font-bold transition-all relative ${activeSubTab === 'users' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Registered Accounts
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder={activeSubTab === 'scans' ? "Search by filename, prediction..." : "Search by email, name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10 py-3 text-sm w-full bg-zinc-950/60"
          />
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="glass-panel p-6 overflow-hidden">
        {activeSubTab === 'scans' ? (
          /* SCAN LOGS TABLE */
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse font-space">
              <thead>
                <tr className="border-b border-white/10 text-xs text-zinc-500 uppercase">
                  <th className="py-4 px-4">Image Preview</th>
                  <th className="py-4 px-4">Filename</th>
                  <th className="py-4 px-4">Verdict</th>
                  <th className="py-4 px-4">Confidence</th>
                  <th className="py-4 px-4">User ID</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                {filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-zinc-500">No matching scan logs found.</td>
                  </tr>
                ) : (
                  filteredScans.map((scan) => {
                    const isReal = scan.prediction === 'REAL';
                    const badgeColor = isReal 
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                      : 'border-rose-500/20 bg-rose-500/5 text-rose-400';
                    
                    const imgSrc = scan.orig_b64 
                      ? `data:image/jpeg;base64,${scan.orig_b64}` 
                      : (scan.orig_url_fallback || scan.image_url);

                    return (
                      <tr key={scan.id || scan.created_at} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4">
                          <img src={imgSrc} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                        </td>
                        <td className="py-4 px-4 font-semibold max-w-[200px] truncate" title={scan.filename}>
                          {scan.filename}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${badgeColor}`}>
                            {scan.prediction}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-indigo-400">
                          {(scan.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="py-4 px-4 text-xs font-mono text-zinc-500" title={scan.user_id}>
                          {scan.user_id ? `${scan.user_id.slice(0, 8)}...` : 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => onViewScan(scan)}
                            className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 transition-all text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* REGISTERED USERS TABLE */
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse font-space">
              <thead>
                <tr className="border-b border-white/10 text-xs text-zinc-500 uppercase">
                  <th className="py-4 px-4">Full Name</th>
                  <th className="py-4 px-4">Email Address</th>
                  <th className="py-4 px-4">Registered Date</th>
                  <th className="py-4 px-4">Last Activity</th>
                  <th className="py-4 px-4 text-right">Identifier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-500">No matching accounts found.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const formatDateStr = (dateVal) => {
                      if (!dateVal) return 'N/A';
                      try {
                        const d = new Date(dateVal);
                        return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleDateString(undefined, { dateStyle: 'medium' });
                      } catch {
                        return String(dateVal);
                      }
                    };
                    const formattedReg = formatDateStr(u.created_at);
                    const formattedLog = formatDateStr(u.last_sign_in_at);

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-bold text-white">
                          {u.full_name || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-indigo-400 font-semibold">
                          {u.email}
                        </td>
                        <td className="py-4 px-4 text-zinc-400 inline-flex items-center gap-1.5 pt-6">
                          <Calendar className="w-4 h-4 text-zinc-500" /> {formattedReg}
                        </td>
                        <td className="py-4 px-4 text-zinc-400">
                          {formattedLog}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-xs text-zinc-600">
                          {u.id}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
