/**
 * passwordStrength.js  — Client-side password strength analysis
 * Mirrors the server-side logic so the UI can give instant feedback.
 */

function entropyBits(password) {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;
  if (pool === 0) return 0;
  return Math.log2(pool) * password.length;
}

function crackTimeLabel(entropy) {
  const guesses = Math.pow(2, entropy);
  const gps = 1e10; // 10 billion/sec
  const s = guesses / gps;
  if (s < 1)          return 'Instantly';
  if (s < 60)         return `${Math.round(s)} seconds`;
  if (s < 3600)       return `${Math.round(s / 60)} minutes`;
  if (s < 86400)      return `${Math.round(s / 3600)} hours`;
  if (s < 2_592_000)  return `${Math.round(s / 86400)} days`;
  if (s < 31_536_000) return `${Math.round(s / 2_592_000)} months`;
  if (s < 3_153_600_000) return `${Math.round(s / 31_536_000)} years`;
  return 'Centuries';
}

export function analyzePassword(password) {
  if (!password) return { label: 'None', score: 0, percent: 0, color: '#334155', tips: [], entropy: 0, crackTime: '—' };

  let score = 0;
  const tips = [];

  if (password.length >= 8)  score++; else tips.push('Use at least 8 characters');
  if (password.length >= 14) score++; else tips.push('Aim for 14+ characters');
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++; else tips.push('Mix uppercase and lowercase');
  if (/[0-9]/.test(password)) score++; else tips.push('Add numbers');
  if (/[^a-zA-Z0-9]/.test(password)) score++; else tips.push('Add special characters (!@#$...)');
  if (/(.)\1{2,}/.test(password)) { score = Math.max(0, score - 1); tips.push('Avoid repeated characters'); }

  const capped = Math.min(score, 4);
  const labels  = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  const colors  = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
  const entropy = entropyBits(password);

  return {
    label:      labels[capped],
    score:      capped,
    percent:    capped * 25,
    color:      colors[capped],
    tips,
    entropy:    Math.round(entropy * 10) / 10,
    crackTime:  crackTimeLabel(entropy),
  };
}
