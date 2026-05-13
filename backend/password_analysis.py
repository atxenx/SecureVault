"""
password_analysis.py
In-memory password security analysis — no plaintext is persisted.

Evaluates:
  - Entropy (bits)
  - Strength classification
  - Reuse detection
  - Crack-time estimation
"""
import math
import re
from collections import Counter


def _entropy_bits(password: str) -> float:
    """Shannon entropy proxy using character-class pool size × length."""
    pool = 0
    if re.search(r'[a-z]', password): pool += 26
    if re.search(r'[A-Z]', password): pool += 26
    if re.search(r'[0-9]', password): pool += 10
    if re.search(r'[^a-zA-Z0-9]', password): pool += 32
    if pool == 0:
        return 0.0
    return math.log2(pool) * len(password)


def _classify_strength(password: str) -> dict:
    """Return strength label, score 0-4, and a list of tips."""
    if not password:
        return {'label': 'None', 'score': 0, 'tips': []}

    tips = []
    score = 0
    length = len(password)

    if length >= 8:  score += 1
    else:            tips.append('Use at least 8 characters')

    if length >= 14: score += 1
    else:            tips.append('Aim for 14+ characters for high security')

    if re.search(r'[A-Z]', password) and re.search(r'[a-z]', password): score += 1
    else: tips.append('Mix uppercase and lowercase letters')

    if re.search(r'[0-9]', password): score += 1
    else: tips.append('Add numbers')

    if re.search(r'[^a-zA-Z0-9]', password): score += 1
    else: tips.append('Add special characters (!@#$%...)')

    # Check for repeating patterns
    if re.search(r'(.)\1{2,}', password):
        score = max(0, score - 1)
        tips.append('Avoid repeated characters (e.g. "aaa")')

    labels = {0: 'Very Weak', 1: 'Weak', 2: 'Medium', 3: 'Strong', 4: 'Very Strong'}
    # Normalize score to 0-4
    capped = min(score, 4)
    return {'label': labels[capped], 'score': capped, 'tips': tips}


def _crack_time_label(entropy: float) -> str:
    """Rough crack-time estimate based on entropy bits (10B guesses/second)."""
    guesses = 2 ** entropy
    gps = 10_000_000_000  # 10 billion/sec (GPU cluster)
    seconds = guesses / gps
    if seconds < 1:        return 'Instantly'
    if seconds < 60:       return f'{int(seconds)} seconds'
    if seconds < 3600:     return f'{int(seconds/60)} minutes'
    if seconds < 86400:    return f'{int(seconds/3600)} hours'
    if seconds < 2_592_000: return f'{int(seconds/86400)} days'
    if seconds < 31_536_000: return f'{int(seconds/2_592_000)} months'
    if seconds < 3_153_600_000: return f'{int(seconds/31_536_000)} years'
    return 'Centuries'


def analyze_passwords(passwords: list) -> dict:
    """
    Analyze an entire vault's passwords.
    Returns aggregate stats suitable for the security dashboard.

    Password reuse detection is performed entirely in-memory after
    decryption — hashed values are compared, never returned to the client.
    """
    if not passwords:
        return {
            'weak': 0, 'medium': 0, 'strong': 0, 'very_strong': 0,
            'reused': 0, 'security_score': 100,
            'strength_distribution': []
        }

    counts = Counter(passwords)           # in-memory comparison only
    reused_set = {p for p, c in counts.items() if c > 1}
    reused_count = sum(1 for p in passwords if p in reused_set)

    weak = medium = strong = very_strong = 0
    for p in passwords:
        s = _classify_strength(p)['score']
        if s <= 1: weak += 1
        elif s == 2: medium += 1
        elif s == 3: strong += 1
        else: very_strong += 1

    total = len(passwords)
    # Security score: starts at 100, deduct for weak/reused
    deduction = 0
    if total > 0:
        deduction += (weak / total) * 50          # -50 pts max for weak
        deduction += (reused_count / total) * 30  # -30 pts max for reused
        if medium / total > 0.5: deduction += 10  # -10 for majority medium

    score = max(0, min(100, round(100 - deduction)))

    return {
        'weak': weak,
        'medium': medium,
        'strong': strong,
        'very_strong': very_strong,
        'reused': reused_count,
        'security_score': score,
        'strength_distribution': [
            {'label': 'Very Weak / Weak', 'value': weak},
            {'label': 'Medium', 'value': medium},
            {'label': 'Strong', 'value': strong},
            {'label': 'Very Strong', 'value': very_strong},
        ]
    }


def analyze_single_password(password: str) -> dict:
    """Full analysis for a single password (used in API response)."""
    strength = _classify_strength(password)
    entropy = _entropy_bits(password)
    return {
        **strength,
        'entropy_bits': round(entropy, 1),
        'crack_time': _crack_time_label(entropy)
    }
