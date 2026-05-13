import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import {
  ShieldCheck, ShieldAlert, ShieldOff, AlertTriangle,
  Activity, Clock, Lock, BarChart3, Repeat2, Star, RefreshCw, Wifi, WifiOff
} from 'lucide-react';

// ── Score ring using foreignObject to avoid SVG text rotation bugs ──────────
function ScoreRing({ score }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = score >= 80 ? '#10b981' : score >= 55 ? '#eab308' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 55 ? 'Fair' : 'Needs Work';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={r} strokeWidth="8" stroke="#1e293b" fill="none" />
          <circle
            cx="55" cy="55" r={r} strokeWidth="8" fill="none"
            stroke={color}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="flex flex-col items-center z-10">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">/ 100</span>
        </div>
      </div>
      <p className="text-base font-bold" style={{ color }}>{label}</p>
      <p className="text-xs text-slate-500">Vault Security Score</p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, colorClass, sublabel }) {
  return (
    <div className="glass p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

function ActivityItem({ action, details, timestamp, ip }) {
  const icons = {
    LOGIN:             <Clock size={14} className="text-blue-400" />,
    REGISTER:         <Star size={14} className="text-emerald-400" />,
    ADD_CREDENTIAL:   <Lock size={14} className="text-green-400" />,
    DELETE_CREDENTIAL:<AlertTriangle size={14} className="text-red-400" />,
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0">
      <div className="mt-0.5 flex-shrink-0">
        {icons[action] || <Activity size={14} className="text-slate-500" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 font-medium">{details || action}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {ip} · {new Date(timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function SecurityDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      setError(e.message || 'Failed to load security stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Loading ──
  if (loading) return (
    <div className="flex flex-col justify-center items-center py-24 gap-4">
      <RefreshCw size={32} className="animate-spin text-blue-400" />
      <p className="text-slate-400 text-sm">Decrypting vault for analysis…</p>
    </div>
  );

  // ── Error state ──
  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400">
        <WifiOff size={28} />
      </div>
      <div className="text-center">
        <p className="text-red-300 font-semibold">Could not load Security Dashboard</p>
        <p className="text-slate-500 text-sm mt-1">{error}</p>
        <p className="text-slate-600 text-xs mt-2">Make sure the backend is running on port 5001</p>
      </div>
      <button onClick={load}
        className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer">
        <RefreshCw size={15} /> Try Again
      </button>
    </div>
  );

  // ── Empty / no data ──
  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-blue-400" size={26} /> Security Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">Real-time analysis of your vault's security posture</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 px-4 py-2.5 rounded-xl transition-all cursor-pointer">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Score card ── */}
      <div className="glass rounded-2xl border border-slate-800 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <ScoreRing score={stats.security_score} />

        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <ShieldCheck size={24} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">Vault Encryption Active</p>
              <p className="text-xs text-slate-400 mt-0.5">{stats.encryption_algo}</p>
              <p className="text-xs text-slate-500 mt-0.5">KDF: {stats.kdf}</p>
            </div>
          </div>

          {stats.last_login && (
            <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <Clock size={22} className="text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-300">Last Successful Login</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(stats.last_login).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Lock}       label="Total Stored"     value={stats.total}
          colorClass="bg-blue-500/10 text-blue-400"     sublabel="Encrypted credentials" />
        <StatCard icon={ShieldOff}  label="Weak Passwords"   value={stats.weak}
          colorClass="bg-red-500/10 text-red-400"       sublabel="Immediate risk" />
        <StatCard icon={Repeat2}    label="Reused Passwords" value={stats.reused}
          colorClass="bg-orange-500/10 text-orange-400" sublabel="Stuffing risk" />
        <StatCard icon={ShieldCheck} label="Strong Passwords" value={stats.strong + stats.very_strong}
          colorClass="bg-emerald-500/10 text-emerald-400" sublabel="Best practices" />
      </div>

      {/* ── Warnings ── */}
      {(stats.weak > 0 || stats.reused > 0) && (
        <div className="space-y-3">
          {stats.weak > 0 && (
            <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/30 rounded-xl p-4">
              <ShieldAlert size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {stats.weak} weak password{stats.weak > 1 ? 's' : ''} detected
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Weak passwords are vulnerable to brute-force and dictionary attacks.
                  Use the password generator to create high-entropy replacements.
                </p>
              </div>
            </div>
          )}
          {stats.reused > 0 && (
            <div className="flex items-start gap-3 bg-orange-500/5 border border-orange-500/30 rounded-xl p-4">
              <Repeat2 size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-300">
                  {stats.reused} credential{stats.reused > 1 ? 's' : ''} share the same password
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Password reuse enables <strong className="text-orange-300">credential stuffing attacks</strong> —
                  one breached site compromises all accounts sharing that password.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Strength distribution ── */}
      {stats.total > 0 && (
        <div className="glass rounded-2xl border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-5 flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-400" /> Strength Distribution
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Very Weak / Weak', value: stats.weak,        bg: 'bg-red-500' },
              { label: 'Medium',           value: stats.medium,      bg: 'bg-yellow-500' },
              { label: 'Strong',           value: stats.strong,      bg: 'bg-green-500' },
              { label: 'Very Strong',      value: stats.very_strong, bg: 'bg-emerald-500' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-28 text-xs text-slate-400 flex-shrink-0">{row.label}</span>
                <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${row.bg} rounded-full transition-all duration-700`}
                    style={{ width: stats.total ? `${(row.value / stats.total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity log ── */}
      {stats.activity?.length > 0 && (
        <div className="glass rounded-2xl border border-slate-800 p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" /> Recent Vault Activity
          </h3>
          {stats.activity.map((log, i) => <ActivityItem key={i} {...log} />)}
        </div>
      )}
    </div>
  );
}
