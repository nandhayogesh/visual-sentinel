// Shared TypeScript types for the Link Detector analysis results

export interface BrandInfo {
  detected: boolean;
  name?: string;
  officialUrl?: string;
  isImpersonation?: boolean;
}

export interface Verdict {
  score: number;               // 0–100 risk score
  label: 'SCAM' | 'SUSPICIOUS' | 'LOW RISK' | 'LIKELY LEGITIMATE';
  color: 'red' | 'orange' | 'yellow' | 'green';
  summary: string;
  riskFactors: string[];
}

export interface SSLCheck {
  valid: boolean;
  daysRemaining: number;
  issuer: string;
  domainMatch: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  error?: string;
}

export interface WhoisCheck {
  creationDate: string | null;
  domainAge: number | null;    // days since registration
  registrar: string | null;
  registrantCountry: string | null;
  error?: string;
}

export interface DNSCheck {
  hasARecord: boolean;
  ipAddresses: string[];
  hasMXRecord: boolean;
  mxRecords: string[];
  nameservers: string[];
  isCloudflareProxy: boolean;
  error?: string;
}

export interface HeadersCheck {
  hasHSTS: boolean;
  hasCSP: boolean;
  hasXFrameOptions: boolean;
  hasXContentTypeOptions: boolean;
  hasReferrerPolicy: boolean;
  statusCode: number | null;
  finalUrl: string;
  redirectChain: string[];
  redirectCount: number;
  server?: string | null;
  error?: string;
}

export interface GeoInfo {
  country: string;
  countryCode: string;
  city: string;
  isp: string;
  org: string;
  as: string;
}

export interface VirusTotalCheck {
  maliciousCount: number;
  suspiciousCount: number;
  harmlessCount?: number;
  undetectedCount?: number;
  totalEngines: number;
  detected: boolean;
  permalink?: string | null;
  error?: string;
}

export interface PhishTankCheck {
  inDatabase: boolean;
  isPhish: boolean;
  verified: boolean;
  phishId?: string | null;
  phishDetailUrl?: string | null;
  error?: string;
}

export interface SafeBrowsingCheck {
  isFlagged: boolean;
  threatType: string | null;
  platformType?: string;
  error?: string;
}

export interface URLScanCheck {
  malicious: boolean;
  score: number;
  categories: string[];
  ip: string | null;
  country: string | null;
  asnName?: string | null;
  tlsMismatch?: boolean;
  error?: string;
}

export interface AllChecks {
  ssl: SSLCheck;
  whois: WhoisCheck;
  dns: DNSCheck;
  headers: HeadersCheck;
  virustotal: VirusTotalCheck;
  phishtank: PhishTankCheck;
  safebrowsing: SafeBrowsingCheck;
  urlscan: URLScanCheck;
  geo: GeoInfo | null;
}

export interface Screenshots {
  suspicious: string | null;
  official: string | null;
}

export interface AnalysisResult {
  jobId: string;
  status: 'complete';
  url: string;
  domain: string;
  brand: BrandInfo;
  verdict: Verdict;
  screenshots: Screenshots;
  checks: AllChecks;
  riskFactors: string[];
}

export interface AnalysisProgress {
  status: 'running';
  progress: number;   // 0–100
  stage: string;
}

export interface AnalysisError {
  status: 'error';
  error: string;
}

export type AnalysisResponse = AnalysisResult | AnalysisProgress | AnalysisError;
