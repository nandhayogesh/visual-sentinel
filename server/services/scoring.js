'use strict';

/**
 * Risk scoring engine.
 * Aggregates signals from all checks into a 0–100 score and maps
 * it to a verdict label/color. Also detects brand impersonation.
 */

// ── Brand database ─────────────────────────────────────────────────────────
// Format: keyword (substring of domain) → { name, officialUrl, officialDomains? }
// officialDomains: full list of official regional/secondary domains for brands
// that operate under multiple TLDs. If omitted, only officialUrl is used.
const BRAND_MAP = {
  paypal: {
    name: 'PayPal',
    officialUrl: 'paypal.com',
    officialDomains: ['paypal.com', 'paypal.me', 'paypalobjects.com'],
  },
  amazon: {
    name: 'Amazon',
    officialUrl: 'amazon.com',
    officialDomains: [
      'amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.de', 'amazon.co.jp',
      'amazon.fr', 'amazon.ca', 'amazon.com.au', 'amazon.com.br', 'amazon.com.mx',
      'amazon.it', 'amazon.es', 'amazon.nl', 'amazon.pl', 'amazon.se', 'amazon.sg',
      'amazon.ae', 'amazon.sa', 'amazon.com.tr', 'amazon.at', 'amazon.be',
      'amazon.cn', 'amazon.eg', 'amazonprime.com',
    ],
  },
  google: {
    name: 'Google',
    officialUrl: 'google.com',
    officialDomains: [
      'google.com', 'google.co.in', 'google.co.uk', 'google.de', 'google.fr',
      'google.co.jp', 'google.com.au', 'google.ca', 'google.it', 'google.es',
      'google.com.br', 'google.com.mx', 'google.co.id', 'google.com.ar',
      'google.com.sg', 'google.co.za', 'google.co.nz', 'google.nl', 'google.pl',
      'google.se', 'google.no', 'google.dk', 'google.fi', 'google.at', 'google.be',
      'google.ch', 'google.pt', 'google.com.tr', 'google.ru', 'google.com.hk',
      'google.com.tw', 'google.co.th', 'google.com.ph', 'google.com.pk',
      'google.com.eg', 'google.com.ng', 'google.ie',
    ],
  },
  facebook: {
    name: 'Facebook',
    officialUrl: 'facebook.com',
    officialDomains: ['facebook.com', 'fb.com', 'fb.me', 'facebook.net'],
  },
  microsoft: {
    name: 'Microsoft',
    officialUrl: 'microsoft.com',
    officialDomains: [
      'microsoft.com', 'microsoftonline.com', 'office.com', 'office365.com',
      'outlook.com', 'live.com', 'hotmail.com', 'bing.com', 'azure.com',
      'azureedge.net', 'msn.com', 'windowsupdate.com',
    ],
  },
  apple: {
    name: 'Apple',
    officialUrl: 'apple.com',
    officialDomains: [
      'apple.com', 'icloud.com', 'itunes.com', 'applecomputerhardware.com',
    ],
  },
  netflix: {
    name: 'Netflix',
    officialUrl: 'netflix.com',
    officialDomains: ['netflix.com', 'nflxvideo.net', 'nflximg.net', 'nflxso.net'],
  },
  instagram: {
    name: 'Instagram',
    officialUrl: 'instagram.com',
    officialDomains: ['instagram.com', 'cdninstagram.com'],
  },
  twitter: {
    name: 'Twitter / X',
    officialUrl: 'x.com',
    officialDomains: ['twitter.com', 'x.com', 't.co'],
  },
  linkedin: {
    name: 'LinkedIn',
    officialUrl: 'linkedin.com',
    officialDomains: ['linkedin.com', 'licdn.com'],
  },
  whatsapp: {
    name: 'WhatsApp',
    officialUrl: 'whatsapp.com',
    officialDomains: ['whatsapp.com', 'whatsapp.net'],
  },
  flipkart: {
    name: 'Flipkart',
    officialUrl: 'flipkart.com',
    officialDomains: ['flipkart.com', 'fkimg.com', 'flixcart.com'],
  },
  ebay: {
    name: 'eBay',
    officialUrl: 'ebay.com',
    officialDomains: [
      'ebay.com', 'ebay.co.uk', 'ebay.de', 'ebay.fr', 'ebay.it',
      'ebay.es', 'ebay.com.au', 'ebay.ca', 'ebay.at', 'ebay.be',
      'ebay.nl', 'ebay.pl', 'ebay.ie', 'ebay.in',
    ],
  },
  wellsfargo: {
    name: 'Wells Fargo',
    officialUrl: 'wellsfargo.com',
    officialDomains: ['wellsfargo.com'],
  },
  chase: {
    name: 'Chase',
    officialUrl: 'chase.com',
    officialDomains: ['chase.com', 'jpmorgan.com', 'jpmorganchase.com'],
  },
  bankofamerica: {
    name: 'Bank of America',
    officialUrl: 'bankofamerica.com',
    officialDomains: ['bankofamerica.com', 'bac.com', 'merrilledge.com'],
  },
  steam: {
    name: 'Steam',
    officialUrl: 'store.steampowered.com',
    officialDomains: ['steampowered.com', 'steamcommunity.com', 'steamusercontent.com'],
  },
  dmv:       { name: 'DMV',       officialUrl: 'gov' },
  irs:       { name: 'IRS',       officialUrl: 'irs.gov' },
  dhl: {
    name: 'DHL',
    officialUrl: 'dhl.com',
    officialDomains: ['dhl.com', 'dhl.de', 'dhl.co.uk', 'dhl.fr', 'dhl.in'],
  },
  fedex: {
    name: 'FedEx',
    officialUrl: 'fedex.com',
    officialDomains: ['fedex.com', 'fedex.com.au', 'fedex.co.uk'],
  },
  ups: {
    name: 'UPS',
    officialUrl: 'ups.com',
    officialDomains: ['ups.com', 'ups.com.au', 'ups.co.uk'],
  },
  coinbase: {
    name: 'Coinbase',
    officialUrl: 'coinbase.com',
    officialDomains: ['coinbase.com', 'coinbasecloud.com'],
  },
  binance: {
    name: 'Binance',
    officialUrl: 'binance.com',
    officialDomains: ['binance.com', 'binance.us', 'binance.je', 'binance.org'],
  },
  github: {
    name: 'GitHub',
    officialUrl: 'github.com',
    officialDomains: ['github.com', 'github.io', 'githubusercontent.com', 'githubassets.com'],
  },
};

/**
 * Detect brand impersonation for the given domain.
 * Returns BrandInfo-compatible object.
 */
function detectBrand(domain) {
  const d = domain.toLowerCase();

  for (const [keyword, brand] of Object.entries(BRAND_MAP)) {
    if (!d.includes(keyword)) continue;

    // Build the full set of official domains to check against
    const officialList = brand.officialDomains
      ? brand.officialDomains.map(od => od.toLowerCase())
      : [brand.officialUrl.toLowerCase()];

    // Check if the domain exactly matches any official domain,
    // or is a direct subdomain of any official domain (e.g. www.amazon.in)
    const isOfficial = officialList.some(
      od => d === od || d.endsWith('.' + od)
    );

    if (isOfficial) {
      // Genuine official site — brand detected, no impersonation
      return { detected: true, name: brand.name, officialUrl: brand.officialUrl, isImpersonation: false };
    }

    // Domain contains brand keyword but is NOT any known official domain
    return { detected: true, name: brand.name, officialUrl: brand.officialUrl, isImpersonation: true };
  }

  return { detected: false };
}

/**
 * Compute risk score (0–100) and verdict from all check results.
 * Returns: { score, label, color, summary, riskFactors }
 */
function computeVerdict({ ssl, whois, dns, headers, virustotal, safebrowsing, openphish, urlscan, brand, visualHash = null }) {
  let score = 0;
  const riskFactors = [];

  // ── VirusTotal ────────────────────────────────────────────────────────────
  if (!virustotal.error) {
    if (virustotal.maliciousCount > 0) {
      score += 40;
      riskFactors.push(`Flagged as malicious by ${virustotal.maliciousCount} VirusTotal engine(s)`);
    } else if (virustotal.suspiciousCount > 0) {
      score += 20;
      riskFactors.push(`Flagged as suspicious by ${virustotal.suspiciousCount} VirusTotal engine(s)`);
    }
  }

  // ── Google Safe Browsing ──────────────────────────────────────────────────
  if (!safebrowsing.error && safebrowsing.isFlagged) {
    score += 35;
    riskFactors.push(`Google Safe Browsing: ${formatThreatType(safebrowsing.threatType)}`);
  }

  // ── OpenPhish ─────────────────────────────────────────────────────────────
  if (!openphish.error && openphish.inFeed) {
    if (openphish.matchType === 'exact') {
      score += 40;
      riskFactors.push('URL found in OpenPhish phishing feed (exact match)');
    } else if (openphish.matchType === 'domain') {
      score += 25;
      riskFactors.push('Domain found in OpenPhish phishing feed');
    }
  }

  // ── URLScan ───────────────────────────────────────────────────────────────
  if (!urlscan.error && urlscan.malicious) {
    score += 25;
    riskFactors.push('URLScan.io classified this page as malicious');
  }

  // ── Brand impersonation ───────────────────────────────────────────────────
  if (brand.detected && brand.isImpersonation) {
    score += 30;
    riskFactors.push(`Impersonating ${brand.name} (official site: ${brand.officialUrl})`);
  }

  // ── Visual similarity (pHash) ─────────────────────────────────────────────
  if (visualHash) {
    if (visualHash.similarityPercent >= 80) {
      score += 20;
      riskFactors.push(`Visual appearance is ${visualHash.similarityPercent}% similar to official ${brand.name || 'brand'} site`);
    } else if (visualHash.similarityPercent >= 60) {
      score += 10;
      riskFactors.push(`Visual layout is ${visualHash.similarityPercent}% similar to official ${brand.name || 'brand'} site`);
    }
  }

  // ── Domain age ────────────────────────────────────────────────────────────
  if (!whois.error && whois.domainAge !== null) {
    if (whois.domainAge < 30) {
      score += 25;
      riskFactors.push(`Domain registered only ${whois.domainAge} day(s) ago`);
    } else if (whois.domainAge < 90) {
      score += 10;
      riskFactors.push(`Domain is relatively new (${whois.domainAge} days old)`);
    }
  }

  // ── SSL ────────────────────────────────────────────────────────────────────
  if (!ssl.error) {
    if (!ssl.valid) {
      score += 20;
      riskFactors.push('SSL certificate is invalid or missing');
    } else if (!ssl.domainMatch) {
      score += 15;
      riskFactors.push('SSL certificate domain mismatch');
    }
  }

  // ── MX records ────────────────────────────────────────────────────────────
  if (!dns.error && !dns.hasMXRecord) {
    score += 10;
    riskFactors.push('No MX records — domain has no email infrastructure');
  }

  // ── Security headers ──────────────────────────────────────────────────────
  if (!headers.error) {
    const headerCount = [headers.hasHSTS, headers.hasCSP, headers.hasXFrameOptions].filter(Boolean).length;
    if (headerCount === 0) {
      score += 5;
      riskFactors.push('No security headers present (HSTS, CSP, X-Frame-Options all missing)');
    }
  }

  // Cap at 100
  score = Math.min(100, score);

  // Determine verdict
  let label, color;
  if (score >= 70) {
    label = 'SCAM';
    color = 'red';
  } else if (score >= 40) {
    label = 'SUSPICIOUS';
    color = 'orange';
  } else if (score >= 20) {
    label = 'LOW RISK';
    color = 'yellow';
  } else {
    label = 'LIKELY LEGITIMATE';
    color = 'green';
  }

  const summary = buildSummary(label, riskFactors, brand);

  return { score, label, color, summary, riskFactors };
}

function buildSummary(label, riskFactors, brand) {
  if (label === 'SCAM') {
    if (brand.detected && brand.isImpersonation) {
      return `This site is impersonating ${brand.name} and has been flagged by multiple threat intelligence sources. Do not enter any credentials or personal information.`;
    }
    return 'Multiple threat signals indicate this is a malicious site. Avoid visiting this URL and do not submit any personal information.';
  }
  if (label === 'SUSPICIOUS') {
    if (brand.detected && brand.isImpersonation) {
      return `This site appears to be impersonating ${brand.name}. Exercise extreme caution and do not enter any credentials.`;
    }
    return `This URL shows suspicious characteristics (${riskFactors.length} risk factor${riskFactors.length !== 1 ? 's' : ''} detected). Exercise caution before proceeding.`;
  }
  if (label === 'LOW RISK') {
    if (brand.detected && !brand.isImpersonation) {
      return `This is an official ${brand.name} website. A few minor signals were detected (likely infrastructure-level) but no threat indicators. Safe to proceed.`;
    }
    return 'A few minor risk signals were detected. The site appears mostly safe but proceed with normal caution.';
  }
  // LIKELY LEGITIMATE
  if (brand.detected && !brand.isImpersonation) {
    return `This is a verified official ${brand.name} website. No threat indicators detected.`;
  }
  return 'No significant threat indicators detected. This URL appears to be legitimate.';
}

function formatThreatType(type) {
  if (!type) return 'threat detected';
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = { detectBrand, computeVerdict };
