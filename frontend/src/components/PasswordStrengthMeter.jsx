import React from 'react';
import { analyzePassword } from '../utils/passwordStrength';
import { Clock, Zap, AlertTriangle } from 'lucide-react';

const SCORE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
const SCORE_BG    = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

export default function PasswordStrengthMeter({ password, showTips = true }) {
  if (!password) return null;
  const { label, score, percent, tips, entropy, crackTime } = analyzePassword(password);
  const segments = [0, 1, 2, 3, 4];

  return (
    <div className="mt-2 space-y-2">
      {/* Segmented bar */}
      <div className="flex gap-1 h-1.5">
        {segments.map(i => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? SCORE_COLORS[score] : '#1e293b' }}
          />
        ))}
      </div>

      {/* Label + metadata row */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold" style={{ color: SCORE_COLORS[score] }}>{label}</span>
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1">
            <Zap size={10} />
            {entropy} bits
          </span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {crackTime} to crack
          </span>
        </div>
      </div>

      {/* Tips */}
      {showTips && tips.length > 0 && (
        <ul className="space-y-1">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-amber-400/80">
              <AlertTriangle size={10} className="flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
