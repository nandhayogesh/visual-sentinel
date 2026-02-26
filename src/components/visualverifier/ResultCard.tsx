import { useState } from 'react';
import type { AnalysisResult } from '@/types/analysis';

interface Props {
  result: AnalysisResult;
  onShowScreenshots: () => void;
}

// Map verdict color to UI config
const configs = {
  red: {
    border: 'border-destructive/40',
    bg: 'bg-destructive/5',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    badge: 'bg-destructive text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  orange: {
    border: 'border-orange-400/40',
    bg: 'bg-orange-400/5',
    iconBg: 'bg-orange-400/10',
    iconColor: 'text-orange-400',
    badge: 'bg-orange-500 text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  yellow: {
    border: 'border-amber-400/40',
    bg: 'bg-amber-400/5',
    iconBg: 'bg-amber-400/10',
    iconColor: 'text-amber-400',
    badge: 'bg-amber-500 text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  green: {
    border: 'border-safe/40',
    bg: 'bg-safe/5',
    iconBg: 'bg-safe/10',
    iconColor: 'text-safe',
    badge: 'bg-safe text-white',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
};

// Render a single check row in the details panel
function CheckRow({ label, value, status }: { label: string; value: string; status?: 'good' | 'bad' | 'warn' | 'neutral' }) {
  const color = status === 'good' ? 'text-safe' : status === 'bad' ? 'text-destructive' : status === 'warn' ? 'text-amber-400' : 'text-foreground';
  return (
    <div className="flex justify-between items-start gap-4 py-1 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={`text-xs font-semibold text-right ${color}`}>{value}</span>
    </div>
  );
}

const ResultCard = ({ result, onShowScreenshots }: Props) => {
  const [showDetails, setShowDetails] = useState(false);
  const cfg = configs[result.verdict.color] ?? configs.green;
  const { checks, verdict, brand, domain, riskFactors } = result;

  // Build check rows for the details panel
  const sslStatus = checks.ssl?.valid ? 'good' : 'bad';
  const sslLabel = checks.ssl?.valid
    ? `Valid (${checks.ssl.daysRemaining}d remaining)`
    : checks.ssl?.error
    ? 'Failed to check'
    : 'Invalid / Missing';

  const ageStatus: 'bad' | 'warn' | 'good' = (checks.whois?.domainAge ?? 9999) < 30 ? 'bad'
    : (checks.whois?.domainAge ?? 9999) < 90 ? 'warn' : 'good';
  const ageLabel = checks.whois?.domainAge != null
    ? `${checks.whois.domainAge} days old`
    : checks.whois?.error ? 'Unavailable' : 'Unknown';

  const vtStatus: 'bad' | 'warn' | 'good' = checks.virustotal?.maliciousCount > 0 ? 'bad'
    : checks.virustotal?.suspiciousCount > 0 ? 'warn' : 'good';
  const vtLabel = checks.virustotal?.error
    ? 'Not checked'
    : `${checks.virustotal?.maliciousCount ?? 0} malicious / ${checks.virustotal?.totalEngines ?? 0} engines`;

  const phishLabel = checks.phishtank?.error
    ? 'Not checked'
    : checks.phishtank?.isPhish ? 'Listed as phishing' : checks.phishtank?.inDatabase ? 'In database (unverified)' : 'Not listed';
  const phishStatus: 'bad' | 'good' = checks.phishtank?.isPhish ? 'bad' : 'good';

  const sbLabel = checks.safebrowsing?.error
    ? 'Not checked'
    : checks.safebrowsing?.isFlagged ? `Flagged: ${checks.safebrowsing.threatType}` : 'Clean';
  const sbStatus: 'bad' | 'good' = checks.safebrowsing?.isFlagged ? 'bad' : 'good';

  const mxLabel = checks.dns?.hasMXRecord ? 'Present' : 'Missing (not a real business)';
  const mxStatus: 'bad' | 'good' = checks.dns?.hasMXRecord ? 'good' : 'bad';

  const headerCount = [checks.headers?.hasHSTS, checks.headers?.hasCSP, checks.headers?.hasXFrameOptions].filter(Boolean).length;
  const headerStatus: 'bad' | 'warn' | 'good' = headerCount === 0 ? 'bad' : headerCount < 3 ? 'warn' : 'good';

  const hasScreenshots = result.screenshots.suspicious || result.screenshots.official;

  return (
    <div className={`bg-card border ${cfg.border} rounded-2xl p-6 shadow-sm ${cfg.bg}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center flex-shrink-0`}>
            {cfg.icon}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">{verdict.label}</h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{domain}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge}`}>
            {verdict.label}
          </span>
          <span className="text-xs text-muted-foreground">Risk: {verdict.score}/100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              verdict.score >= 70 ? 'bg-destructive' :
              verdict.score >= 40 ? 'bg-orange-500' :
              verdict.score >= 20 ? 'bg-amber-400' : 'bg-safe'
            }`}
            style={{ width: `${verdict.score}%` }}
          />
        </div>
      </div>

      {/* Brand impersonation badge */}
      {brand.detected && brand.isImpersonation && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          Impersonating <strong>{brand.name}</strong> — official site is <span className="font-mono">{brand.officialUrl}</span>
        </div>
      )}

      {/* Summary */}
      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{verdict.summary}</p>

      {/* Risk factors */}
      {riskFactors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Risk Factors Detected</p>
          <ul className="space-y-1.5">
            {riskFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                <span className="text-destructive flex-shrink-0 mt-0.5">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Collapsible details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 mb-3 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {showDetails ? 'Hide' : 'Show'} Technical Details
      </button>

      {showDetails && (
        <div className="bg-secondary border border-border rounded-xl p-4 mb-4 space-y-0.5">
          <CheckRow label="SSL Certificate" value={sslLabel} status={sslStatus} />
          <CheckRow label="SSL Issuer" value={checks.ssl?.issuer || 'Unknown'} />
          <CheckRow label="Domain Age" value={ageLabel} status={ageStatus} />
          <CheckRow label="Registrar" value={checks.whois?.registrar || 'Unknown'} />
          <CheckRow label="Registrant Country" value={checks.whois?.registrantCountry || 'Unknown'} />
          <CheckRow label="MX Record" value={mxLabel} status={mxStatus} />
          <CheckRow label="IP Address" value={checks.dns?.ipAddresses?.[0] || 'Unknown'} />
          {checks.geo && <CheckRow label="IP Location" value={`${checks.geo.city}, ${checks.geo.country}`} />}
          {checks.geo && <CheckRow label="ISP" value={checks.geo.isp || 'Unknown'} />}
          <CheckRow label="VirusTotal" value={vtLabel} status={vtStatus} />
          <CheckRow label="PhishTank" value={phishLabel} status={phishStatus} />
          <CheckRow label="Google Safe Browsing" value={sbLabel} status={sbStatus} />
          <CheckRow label="Security Headers" value={`${headerCount}/3 present`} status={headerStatus} />
          <CheckRow label="HTTPS Redirect Count" value={String(checks.headers?.redirectCount ?? 0)} />
          {checks.urlscan?.ip && (
            <CheckRow label="URLScan Server IP" value={`${checks.urlscan.ip} (${checks.urlscan.country || '?'})`} />
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap">
        {hasScreenshots && (
          <button
            onClick={onShowScreenshots}
            className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Visual Comparison
          </button>
        )}
        {(verdict.color === 'red' || verdict.color === 'orange') && (
          <a
            href={`https://www.phishtank.com/add_web_phish.php`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors"
          >
            Report to PhishTank
          </a>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
