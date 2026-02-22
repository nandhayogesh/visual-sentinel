// === URL Heuristic Detection Logic ===
// No hardcoded brand database — all analysis is done via URL pattern heuristics.

export interface AnalysisResult {
  type: 'red' | 'yellow' | 'green' | 'grey';
  domain: string;
  brand?: string;
  canonicalDomain?: string;
  similarity?: number;
  hammingDistance?: number;
  scamHash?: string;
  brandHash?: string;
  templateName?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  reasons?: string[];
}

const HIGH_RISK_KEYWORDS = [
  'free', 'win', 'prize', 'lucky', 'winner', 'gift', 'reward', 'cash',
  'claim', 'congratulations', 'verify', 'confirm', 'suspend', 'alert',
  'urgent', 'limited', 'offer', 'deal', 'discount', 'coupon', 'promo',
  'login', 'signin', 'account', 'secure', 'update', 'click', 'paypal',
  'wallet', 'password', 'credential', 'billing', 'invoice',
];

const MEDIUM_RISK_KEYWORDS = [
  'sale', 'shop', 'buy', 'order', 'cheap', 'best', 'official', 'support',
  'help', 'service', 'customer', 'info', 'news', 'blog', 'download',
];

const SUSPICOUS_TLDS = ['.xyz', '.top', '.click', '.gq', '.tk', '.ml', '.cf', '.ga', '.pw', '.fit', '.info', '.biz'];

const LEET_PATTERN = /[0-9](?=[a-z])|[a-z](?=[0-9])/i;

export function parseDomain(url: string): string {
  try {
    let u = url.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
    return new URL(u).hostname.toLowerCase();
  } catch {
    return url.toLowerCase().split('/')[0];
  }
}

export function generateHash(seed: string, length = 64): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h) + seed.charCodeAt(i); h |= 0; }
  let result = '';
  for (let i = 0; i < length; i++) { h = ((h << 5) - h) + i; h |= 0; result += Math.abs(h) % 2; }
  return result;
}

export function computeHammingDistance(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) d++;
  return d;
}

export function analyzeUrl(url: string): AnalysisResult {
  const domain = parseDomain(url);
  const urlLower = url.toLowerCase();
  const reasons: string[] = [];

  // --- Structural red flags ---
  const subdomainParts = domain.split('.');
  const tld = '.' + subdomainParts.slice(-1)[0];
  const subdepth = subdomainParts.length - 2; // depth beyond domain.tld

  if (subdepth >= 3) reasons.push(`Deeply nested subdomain (${subdepth} levels)`);
  if (domain.split('-').length - 1 >= 3) reasons.push('Excessive hyphens in domain');
  if (LEET_PATTERN.test(domain.replace(/\./g, ''))) reasons.push('Digit-letter substitution detected (leet-speak)');
  if (domain.length > 40) reasons.push('Unusually long domain name');
  if (SUSPICOUS_TLDS.some(t => domain.endsWith(t))) reasons.push(`Suspicious TLD: ${tld}`);
  if (/(-secure|-login|-verify|-account|-billing|-support)/.test(domain)) reasons.push('Security-spoofing keyword in domain');

  // --- Keyword analysis ---
  const highMatches = HIGH_RISK_KEYWORDS.filter(kw => urlLower.includes(kw));
  const medMatches = MEDIUM_RISK_KEYWORDS.filter(kw => urlLower.includes(kw));
  if (highMatches.length > 0) reasons.push(`High-risk keywords: ${highMatches.slice(0, 3).join(', ')}`);
  if (medMatches.length > 1) reasons.push(`Suspicious keywords: ${medMatches.slice(0, 3).join(', ')}`);

  // --- Generate hashes for visual comparison ---
  const urlHash = generateHash(domain);
  const baseHash = generateHash(domain.replace(/[0-9]/g, '').replace(/-/g, ''));
  const hammingDistance = computeHammingDistance(urlHash, baseHash);

  // --- Score & verdict ---
  const structuralFlags = [subdepth >= 3, domain.split('-').length - 1 >= 3, LEET_PATTERN.test(domain), domain.length > 40, SUSPICOUS_TLDS.some(t => domain.endsWith(t)), /(-secure|-login|-verify|-account|-billing|-support)/.test(domain)].filter(Boolean).length;

  if (structuralFlags >= 2 || (structuralFlags >= 1 && highMatches.length >= 2)) {
    return {
      type: 'red', domain, confidence: 'HIGH', reasons,
      similarity: Math.round((1 - hammingDistance / 64) * 100),
      hammingDistance, scamHash: urlHash, brandHash: baseHash,
    };
  }

  if (structuralFlags >= 1 || highMatches.length >= 2) {
    return {
      type: 'yellow', domain, confidence: 'MEDIUM', reasons,
      similarity: Math.round((1 - hammingDistance / 64) * 100),
      hammingDistance, scamHash: urlHash, brandHash: baseHash,
    };
  }

  if (medMatches.length >= 1 || highMatches.length === 1) {
    return {
      type: 'yellow', domain, confidence: 'LOW', reasons,
      similarity: Math.round((1 - hammingDistance / 64) * 100),
      hammingDistance, scamHash: urlHash, brandHash: baseHash,
    };
  }

  // Clean URL
  return {
    type: 'green', domain, confidence: 'NONE', reasons: ['No suspicious patterns detected'],
    similarity: 100, hammingDistance: 0,
    scamHash: urlHash, brandHash: urlHash,
  };
}

// No brand database — removed to avoid mock data.
export function getBrandDatabase() {
  return [];
}
