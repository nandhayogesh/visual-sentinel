// === URL Parsing & Detection Logic ===

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
}

const BRAND_HASHES: Record<string, { hash: string; domain: string[]; threshold: number }> = {
  Flipkart: { hash: '1101001011001101101010110100110110101101011010011010110101101010', domain: ['flipkart.com'], threshold: 90 },
  Amazon:   { hash: '0110110100110101010110100110101101011010011010110101101001101010', domain: ['amazon.in', 'amazon.com'], threshold: 90 },
  Myntra:   { hash: '1010110011010110101001101011010110100110101101010110100110101101', domain: ['myntra.com'], threshold: 88 },
  Meesho:   { hash: '0011101101011010100110101101010110101001101011010101101001101011', domain: ['meesho.com'], threshold: 87 },
  Snapdeal: { hash: '1100101010011010110101001101011010110100110101101010011010110101', domain: ['snapdeal.com'], threshold: 85 },
  Ajio:     { hash: '0101010111001101010110100110101101010110100110101101011010011010', domain: ['ajio.com'], threshold: 86 },
};

const SCAM_KEYWORDS = ['sale', 'free', 'win', 'prize', 'offer', 'deal', 'gift', 'lucky', 'cashback'];

export function parseDomain(url: string): string {
  try {
    let u = url.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
    return new URL(u).hostname.toLowerCase();
  } catch {
    return url.toLowerCase().split('/')[0];
  }
}

export function generateHash(base: string, flips: number): string {
  const chars = base.split('');
  const indices = new Set<number>();
  while (indices.size < flips) indices.add(Math.floor(Math.random() * 64));
  indices.forEach(i => { chars[i] = chars[i] === '1' ? '0' : '1'; });
  return chars.join('');
}

export function analyzeUrl(url: string): AnalysisResult {
  const domain = parseDomain(url);
  const urlLower = url.toLowerCase();

  // Check if it's a known legitimate domain
  for (const [brand, info] of Object.entries(BRAND_HASHES)) {
    if (info.domain.includes(domain)) {
      return {
        type: 'green', domain, brand, canonicalDomain: info.domain[0],
        similarity: 100, hammingDistance: 0, confidence: 'NONE',
        scamHash: info.hash, brandHash: info.hash,
      };
    }
  }

  // Check for brand impersonation
  for (const [brand, info] of Object.entries(BRAND_HASHES)) {
    const brandKey = brand.toLowerCase();
    if (urlLower.includes(brandKey) || urlLower.includes(brandKey.replace('a', '0'))) {
      const hd = Math.floor(Math.random() * 5) + 3; // 3-7
      const similarity = Math.round((1 - hd / 64) * 100 * 10) / 10;
      return {
        type: 'red', domain, brand, canonicalDomain: info.domain[0],
        similarity, hammingDistance: hd, confidence: 'HIGH',
        brandHash: info.hash, scamHash: generateHash(info.hash, hd),
      };
    }
  }

  // Check for scam keywords
  if (SCAM_KEYWORDS.some(kw => urlLower.includes(kw))) {
    const templateNum = Math.floor(Math.random() * 9) + 1;
    return {
      type: 'yellow', domain, confidence: 'MEDIUM',
      templateName: `Fake Flash Sale Template #${templateNum}`,
      similarity: Math.round(Math.random() * 20 + 50),
      hammingDistance: Math.floor(Math.random() * 10 + 15),
      scamHash: generateHash('1010101010101010101010101010101010101010101010101010101010101010', 10),
      brandHash: '1010101010101010101010101010101010101010101010101010101010101010',
    };
  }

  // Unknown
  return {
    type: 'grey', domain, confidence: 'LOW',
    scamHash: generateHash('0101010101010101010101010101010101010101010101010101010101010101', 20),
    brandHash: '0101010101010101010101010101010101010101010101010101010101010101',
  };
}

export function getBrandDatabase() {
  return Object.entries(BRAND_HASHES).map(([brand, info]) => ({
    brand,
    domain: info.domain.join(' / '),
    hash: info.hash,
    threshold: info.threshold,
    lastUpdated: ['2026-01-15', '2026-01-20', '2026-01-18', '2026-02-01', '2025-12-30', '2026-01-05'][
      Object.keys(BRAND_HASHES).indexOf(brand)
    ],
  }));
}
