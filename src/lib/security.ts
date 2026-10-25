import type { IconName } from '../components/Icon';
import type { Resume } from './types';

interface Rule {
  test: RegExp;
  icon: IconName;
  /** one-line description used when the CV itself has nothing better to say about the skill */
  line: string;
}

/**
 * Common security / IT skills → an icon and a plain-language line. Order matters: the first match wins,
 * so more specific rules sit above broad ones. Anything unmatched falls back to a neutral icon.
 */
const RULES: Rule[] = [
  { test: /incident|forensic|dfir|playbook/i, icon: 'alert', line: 'Detect, contain and recover from security incidents fast' },
  { test: /soc\b|security operations|monitor|siem|sentinel|splunk|qradar|elastic/i, icon: 'radar', line: 'Around-the-clock monitoring and alert triage' },
  { test: /threat (intel|hunt)|threat detection|detection/i, icon: 'eye', line: 'Find attacker activity before it becomes a breach' },
  { test: /vulnerab|nessus|qualys|patch|scan/i, icon: 'bug', line: 'Find, prioritise and close weaknesses by risk' },
  { test: /pen(etration)? ?test|ethical hack|red team|burp|metasploit|kali/i, icon: 'target', line: 'Test defences the way a real attacker would' },
  { test: /zero trust/i, icon: 'shieldCheck', line: 'Never trust, always verify — every request' },
  { test: /identity|iam|access|okta|active directory|azure ad|entra|mfa|sso|pam/i, icon: 'key', line: 'Right people, right access, nothing more' },
  { test: /cloud|aws|azure|gcp|kubernetes|container/i, icon: 'cloud', line: 'Secure configuration across cloud workloads' },
  { test: /network|firewall|wireshark|ids|ips|vpn|tcp/i, icon: 'network', line: 'Segmented, monitored and hardened networks' },
  { test: /endpoint|edr|crowdstrike|defender|antivirus/i, icon: 'server', line: 'Protected and monitored devices and servers' },
  { test: /risk|grc|audit|assessment|third.party/i, icon: 'scale', line: 'Risk translated into decisions leaders can act on' },
  { test: /compliance|iso|nist|soc ?2|pci|hipaa|gdpr|policy|governance/i, icon: 'policy', line: 'Controls mapped to recognised frameworks' },
  { test: /encrypt|crypto|pki|tls/i, icon: 'lock', line: 'Data protected at rest and in transit' },
  { test: /privacy|data protection|dlp/i, icon: 'fingerprint', line: 'Personal data handled with care and consent' },
  { test: /awareness|training|phishing|culture/i, icon: 'users', line: 'People as the strongest line of defence' },
  { test: /python|bash|powershell|script|automation|soar|kql|sql/i, icon: 'code', line: 'Automation that removes repetitive work' },
  { test: /database|data/i, icon: 'database', line: 'Trusted, well-governed data' },
];

// varied stand-ins for skills nothing above recognises (keeps the placeholder from repeating itself)
const FALLBACK_LINES = [
  'What you do best, in one line',
  'Where you add the most value',
  'A capability you are known for',
  'Something you do every day',
  'A strength that sets you apart',
];

const FALLBACK_ICONS: IconName[] = ['shieldCheck', 'lock', 'fingerprint', 'network', 'eye', 'key', 'radar', 'server'];

export function iconFor(text: string, i = 0): IconName {
  return RULES.find((r) => r.test.test(text))?.icon ?? FALLBACK_ICONS[i % FALLBACK_ICONS.length];
}

/** Prefer a CV bullet that mentions the skill; otherwise the rule's line; otherwise a neutral line. */
export function describeSkill(skill: string, resume: Resume, i = 0): string {
  const word = skill
    .replace(/\(.*?\)/g, '')
    .split(/[\s&/]+/)
    .find((w) => w.length > 4);
  if (word) {
    const re = new RegExp(word.slice(0, 6), 'i');
    for (const job of resume.experience) {
      const hit = job.bullets.find((b) => re.test(b) && b.length < 90);
      if (hit) return hit.replace(/\.$/, '');
    }
  }
  return RULES.find((r) => r.test.test(skill))?.line ?? FALLBACK_LINES[i % FALLBACK_LINES.length];
}

/** "CISSP — Certified Information Systems…" → "CISSP"; "CompTIA Security+" stays. */
export function shortCert(cert: string): string {
  const head = cert.split(/\s+[—–-]\s+|\s*\(/)[0].trim();
  const abbr = cert.match(/\(([A-Z0-9+]{2,8})\)/)?.[1];
  if (head.length <= 22) return head;
  return abbr ?? head.split(/\s+/).slice(0, 3).join(' ');
}

/** Splits a short label into two balanced lines for the wheel and trust layer. */
export function twoLines(text: string): [string, string] {
  const words = text.split(/\s+/);
  if (words.length < 2) return [text, ''];
  let best = 1;
  let diff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (d < diff) {
      diff = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}
