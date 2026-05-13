import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { analyzePassword } from '../utils/passwordStrength';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import SecurityDashboard from './SecurityDashboard';
import { useTheme } from '../context/ThemeContext';
import {
  Shield, LogOut, Plus, Search, Copy, Eye, EyeOff, Trash2,
  Globe, User, FileText, Loader2, Key, Lock, BarChart3,
  AlertTriangle, Repeat2, CheckCircle2, RefreshCw, Wand2,
  Sun, Moon
} from 'lucide-react';

// ─── Reuse badge ────────────────────────────────────────────────────────────
function ReuseBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
      <Repeat2 size={9} /> REUSED
    </span>
  );
}

// ─── Credential card ─────────────────────────────────────────────────────────
function CredCard({ cred, revealed, onReveal, onCopy, onDelete, reusedPasswords }) {
  const analysis = analyzePassword(cred.password || '');
  const isReused  = reusedPasswords.has(cred.password);
  const isWeak    = analysis.score <= 1;

  const borderColor = isReused || isWeak
    ? 'border-orange-500/30 hover:border-orange-500/50'
    : 'border-slate-800 hover:border-slate-700';

  return (
    <div className={`glass p-5 rounded-2xl border transition-all group ${borderColor}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-slate-700/50 flex-shrink-0">
            <Globe size={20} className="text-slate-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate text-base">{cred.website}</h3>
            <p className="text-slate-400 text-xs truncate">{cred.username}</p>
          </div>
        </div>
        <button
          onClick={() => onDelete(cred.id)}
          className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {isReused && <ReuseBadge />}
        {isWeak && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
            <AlertTriangle size={9} /> WEAK
          </span>
        )}
        {!isWeak && !isReused && analysis.score >= 3 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={9} /> STRONG
          </span>
        )}
      </div>

      {/* Password row */}
      <div className="bg-slate-900/80 rounded-lg p-2 flex items-center justify-between border border-slate-800/50">
        <span className="text-slate-500 text-xs font-medium ml-2">Password</span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm mr-2 text-blue-100 tracking-wider">
            {revealed ? cred.password : '••••••••••••'}
          </span>
          <button onClick={() => onReveal(cred.id)} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer">
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={() => onCopy(cred.password)} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer" title="Copy password">
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Inline strength bar */}
      <div className="mt-3">
        <PasswordStrengthMeter password={cred.password} showTips={false} />
      </div>

      {cred.notes && (
        <div className="mt-3 pt-3 border-t border-slate-800/50">
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            <span className="font-medium text-slate-500 mr-1">Notes:</span>{cred.notes}
          </p>
        </div>
      )}

      <div className="mt-3 text-[10px] text-slate-600 flex items-center gap-1">
        <Shield size={10} /> AES-256-GCM Encrypted · RSA-2048-OAEP Key Wrapped
      </div>
    </div>
  );
}

// ─── Add form (inline panel, matching previous version style) ─────────────────
function AddCredentialForm({ onSave, onClose }) {
  const [website, setWebsite]   = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);

  const generate = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~';
    let pwd = '';
    for (let i = 0; i < 20; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setPassword(pwd);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCredential({ website, username, password, notes });
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="glass p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key size={20} className="text-blue-400" /> Encrypt &amp; Store New Credential
        </h2>

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Website / App</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input required type="text" value={website} onChange={e => setWebsite(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none"
                placeholder="e.g. github.com" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Username / Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input required type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none"
                placeholder="your@email.com" />
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-slate-400">Password</label>
              <button type="button" onClick={generate}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                <Wand2 size={11} /> Generate Strong
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input required type="text" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white font-mono focus:border-blue-500 outline-none"
                placeholder="Enter or generate a password" />
            </div>
            <PasswordStrengthMeter password={password} showTips={true} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1">Secure Notes (Optional)</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-slate-500" size={16} />
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:border-blue-500 outline-none min-h-[80px] resize-y" />
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
              AES-GCM Encrypt &amp; Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard({ setAuth }) {
  const [credentials, setCredentials] = useState([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [revealed, setRevealed]       = useState({});
  const [activeTab, setActiveTab]     = useState('vault');
  const [copied, setCopied]           = useState(false);
  const { theme, toggleTheme }        = useTheme();

  useEffect(() => { fetchCreds(); }, []);

  const fetchCreds = async () => {
    setLoading(true);
    try { setCredentials(await api.getCredentials()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.clear(); setAuth(false); };
  const toggleReveal  = id => setRevealed(p => ({ ...p, [id]: !p[id] }));
  const copyToClip    = text => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const handleDelete  = async (id) => {
    if (!window.confirm('Delete this credential?')) return;
    await api.deleteCredential(id);
    fetchCreds();
  };

  // Detect reused passwords in-memory
  const pwCounts = credentials.reduce((acc, c) => {
    if (c.password) acc[c.password] = (acc[c.password] || 0) + 1;
    return acc;
  }, {});
  const reusedPasswords = new Set(Object.keys(pwCounts).filter(p => pwCounts[p] > 1));

  const filtered = credentials.filter(c =>
    c.website?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: 'vault',     label: 'Vault',     icon: Lock },
    { id: 'dashboard', label: 'Security',  icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {copied && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 size={16} /> Copied to clipboard!
        </div>
      )}

      {/* ── Header ── */}
      <header className="glass sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent leading-none">
                SecureVault
              </h1>
              <p className="text-[10px] text-slate-500">AES-256-GCM · PBKDF2 · RSA-2048</p>
            </div>
          </div>

          {/* Tab Nav */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-900/80 rounded-xl p-1 border border-slate-800">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}>
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </nav>

          {/* Right actions group */}
          <div className="flex items-center gap-2">
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer text-sm font-medium">
              <LogOut size={16} />
              <span className="hidden sm:inline">Lock Vault</span>
            </button>

            <button
              id="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer"
              style={{
                background: 'var(--sv-toggle-bg)',
                borderColor: 'var(--sv-toggle-border)',
              }}
            >
              {theme === 'dark'
                ? <Sun size={16} className="text-yellow-400" />
                : <Moon size={16} className="text-indigo-400" />
              }
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Vault Tab ── */}
        {activeTab === 'vault' && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input type="text" placeholder="Search vault…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
              <button onClick={() => setShowAdd(!showAdd)}
                className="relative z-10 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-900/20">
                <Plus size={20} /> New Credential
              </button>
            </div>

            {/* Inline Add Form */}
            {showAdd && (
              <AddCredentialForm
                onSave={() => { setShowAdd(false); fetchCreds(); }}
                onClose={() => setShowAdd(false)}
              />
            )}

            {/* Reuse banner */}
            {reusedPasswords.size > 0 && (
              <div className="mb-6 flex items-start gap-3 bg-orange-500/5 border border-orange-500/30 rounded-xl p-4">
                <Repeat2 size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-300">Password Reuse Detected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {reusedPasswords.size} password{reusedPasswords.size > 1 ? 's are' : ' is'} shared across multiple accounts.
                    This enables <strong className="text-orange-300">credential stuffing attacks</strong>.
                    Generate unique passwords for each site.
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20">
                <RefreshCw size={28} className="animate-spin text-blue-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <Shield size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-300">Vault is empty</h3>
                <p className="text-slate-500 text-sm mt-1">Click "New Credential" to securely store your first password.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(cred => (
                  <CredCard
                    key={cred.id}
                    cred={cred}
                    revealed={revealed[cred.id]}
                    onReveal={toggleReveal}
                    onCopy={copyToClip}
                    onDelete={handleDelete}
                    reusedPasswords={reusedPasswords}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Security Dashboard Tab ── */}
        {activeTab === 'dashboard' && <SecurityDashboard />}
      </main>
    </div>
  );
}
