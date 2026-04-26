import type { AnalysisResult } from '@/types/analysis';

export type RiskLevel = 'high' | 'medium' | 'low' | 'minimal';

export interface EvidenceItem {
  id: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  explanation: string;
  source: 'ssl' | 'whois' | 'dns' | 'headers' | 'virustotal' | 'openphish' | 'safebrowsing' | 'urlscan' | 'visualHash';
}

export interface RecommendedAction {
  id: string;
  label: string;
  priority: 'primary' | 'secondary';
  rationale: string;
  href?: string;
}

export interface AnalysisPresentationModel {
  domain: string;
  brandName?: string;
  isImpersonation: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
  confidenceScore: number;
  verdictLabel: string;
  summary: string;
  evidenceTop: EvidenceItem[];
  recommendations: RecommendedAction[];
  hasPartialSignals: boolean;
}

function mapRiskLevel(color: AnalysisResult['verdict']['color']): RiskLevel {
  if (color === 'red') return 'high';
  if (color === 'orange') return 'medium';
  if (color === 'yellow') return 'low';
  return 'minimal';
}

function getConfidenceScore(result: AnalysisResult): number {
  const missingSignals = [
    result.checks.virustotal?.error,
    result.checks.openphish?.error,
    result.checks.safebrowsing?.error,
    result.checks.urlscan?.error,
    result.checks.ssl?.error,
    result.checks.whois?.error,
    result.checks.dns?.error,
    result.checks.headers?.error,
  ].filter(Boolean).length;

  let score = 100 - (missingSignals * 10);

  const corroborationHits = [
    result.checks.openphish?.inFeed,
    result.checks.safebrowsing?.isFlagged,
    (result.checks.virustotal?.maliciousCount ?? 0) > 0,
    result.checks.urlscan?.malicious,
    result.brand.isImpersonation,
  ].filter(Boolean).length;

  if (result.verdict.color === 'red' && corroborationHits <= 1) score -= 8;
  if (result.brand.detected && !result.screenshots.official) score -= 5;

  return Math.max(20, Math.min(99, score));
}

function buildEvidence(result: AnalysisResult): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];

  if (result.brand.isImpersonation && result.brand.name) {
    evidence.push({
      id: 'impersonation',
      title: 'Brand impersonation detected',
      impact: 'high',
      explanation: `The analyzed domain appears to imitate ${result.brand.name}.`,
      source: 'visualHash',
    });
  }

  if ((result.checks.virustotal?.maliciousCount ?? 0) > 0) {
    evidence.push({
      id: 'virustotal',
      title: 'Malicious engine detections',
      impact: 'high',
      explanation: `${result.checks.virustotal.maliciousCount} engines marked this domain as malicious.`,
      source: 'virustotal',
    });
  }

  if (result.checks.safebrowsing?.isFlagged) {
    evidence.push({
      id: 'safebrowsing',
      title: 'Google Safe Browsing flag',
      impact: 'high',
      explanation: `Threat type reported: ${result.checks.safebrowsing.threatType ?? 'Unknown'}.`,
      source: 'safebrowsing',
    });
  }

  if (result.checks.openphish?.inFeed) {
    evidence.push({
      id: 'openphish',
      title: 'OpenPhish feed match',
      impact: result.checks.openphish.matchType === 'exact' ? 'high' : 'medium',
      explanation: result.checks.openphish.matchType === 'exact'
        ? 'Exact URL match found in OpenPhish.'
        : 'Domain-level match found in OpenPhish.',
      source: 'openphish',
    });
  }

  if ((result.checks.whois?.domainAge ?? 10000) < 30) {
    evidence.push({
      id: 'domain-age',
      title: 'Very new domain registration',
      impact: 'medium',
      explanation: `Domain age is ${result.checks.whois?.domainAge ?? 'unknown'} days.`,
      source: 'whois',
    });
  }

  if (!result.checks.ssl?.valid) {
    evidence.push({
      id: 'ssl',
      title: 'SSL certificate issues',
      impact: 'medium',
      explanation: 'Certificate is missing, invalid, or failed validation.',
      source: 'ssl',
    });
  }

  if (!result.checks.dns?.hasMXRecord) {
    evidence.push({
      id: 'mx',
      title: 'No MX record for domain',
      impact: 'low',
      explanation: 'Legitimate organizations usually have mail infrastructure configured.',
      source: 'dns',
    });
  }

  if (evidence.length < 3) {
    result.riskFactors.slice(0, 3 - evidence.length).forEach((factor, idx) => {
      evidence.push({
        id: `factor-${idx}`,
        title: 'Additional risk signal',
        impact: 'low',
        explanation: factor,
        source: 'headers',
      });
    });
  }

  return evidence.slice(0, 3);
}

function buildRecommendations(riskLevel: RiskLevel, domain: string): RecommendedAction[] {
  const reportUrl = 'https://safebrowsing.google.com/safebrowsing/report_phish/';

  if (riskLevel === 'high') {
    return [
      {
        id: 'block',
        label: `Block ${domain} in email/web filters`,
        priority: 'primary',
        rationale: 'Prevents additional user exposure while investigation continues.',
      },
      {
        id: 'escalate',
        label: 'Escalate to security operations',
        priority: 'secondary',
        rationale: 'High-risk verdict should be triaged as an active threat.',
      },
      {
        id: 'report',
        label: 'Report phishing to Safe Browsing',
        priority: 'secondary',
        rationale: 'Increases ecosystem protection and takedown chances.',
        href: reportUrl,
      },
    ];
  }

  if (riskLevel === 'medium') {
    return [
      {
        id: 'sandbox',
        label: 'Review in isolated browser sandbox',
        priority: 'primary',
        rationale: 'Further validation before broad blocking helps reduce false positives.',
      },
      {
        id: 'verify-owner',
        label: 'Verify domain ownership and legitimacy',
        priority: 'secondary',
        rationale: 'Registration and infrastructure checks may clarify intent.',
      },
      {
        id: 'report',
        label: 'Submit for phishing review',
        priority: 'secondary',
        rationale: 'Shared reporting helps external intelligence systems.',
        href: reportUrl,
      },
    ];
  }

  return [
    {
      id: 'monitor',
      label: 'Keep domain under passive monitoring',
      priority: 'primary',
      rationale: 'Current risk is low but threat posture can change over time.',
    },
    {
      id: 'educate',
      label: 'Continue user awareness guidance',
      priority: 'secondary',
      rationale: 'User verification behavior still reduces social engineering success.',
    },
  ];
}

export function buildAnalysisPresentationModel(result: AnalysisResult): AnalysisPresentationModel {
  const riskLevel = mapRiskLevel(result.verdict.color);
  const confidenceScore = getConfidenceScore(result);

  const hasPartialSignals = [
    result.checks.virustotal?.error,
    result.checks.openphish?.error,
    result.checks.safebrowsing?.error,
    result.checks.urlscan?.error,
    result.checks.ssl?.error,
    result.checks.whois?.error,
    result.checks.dns?.error,
    result.checks.headers?.error,
  ].some(Boolean);

  return {
    domain: result.domain,
    brandName: result.brand.name,
    isImpersonation: !!result.brand.isImpersonation,
    riskScore: result.verdict.score,
    riskLevel,
    confidenceScore,
    verdictLabel: result.verdict.label,
    summary: result.verdict.summary,
    evidenceTop: buildEvidence(result),
    recommendations: buildRecommendations(riskLevel, result.domain),
    hasPartialSignals,
  };
}
