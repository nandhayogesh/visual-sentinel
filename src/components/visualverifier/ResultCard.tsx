import { useState } from 'react';
import type { AnalysisResult } from '@/lib/analyzer';

interface Props {
  result: AnalysisResult;
  onShowHash: () => void;
}

const configs = {
  red: {
    border: 'border-destructive/40',
    bg: 'bg-red-50',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    heading: 'Visual Clone Detected',
    badge: 'bg-destructive text-white',
    badgeLabel: 'SCAM',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  yellow: {
    border: 'border-warning/40',
    bg: 'bg-orange-50',
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    heading: 'Suspicious Pattern Detected',
    badge: 'bg-warning text-white',
    badgeLabel: 'WARNING',
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
    bg: 'bg-green-50',
    iconBg: 'bg-safe/10',
    iconColor: 'text-safe',
    heading: 'Legitimate Site Verified',
    badge: 'bg-safe text-white',
    badgeLabel: 'SAFE',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  grey: {
    border: 'border-unknown/30',
    bg: 'bg-secondary',
    iconBg: 'bg-unknown/10',
    iconColor: 'text-unknown',
    heading: 'Unknown Site',
    badge: 'bg-unknown text-white',
    badgeLabel: 'UNKNOWN',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
};

const ResultCard = ({ result, onShowHash }: Props) => {
  const [showDetails, setShowDetails] = useState(false);
  const cfg = configs[result.type];

  const body = result.type === 'red'
    ? `This page is ${result.similarity}% visually identical to ${result.brand}.com but is hosted on ${result.domain}. This is a confirmed impersonation scam.`
    : result.type === 'yellow'
    ? `This URL matches structural patterns found in known scam pages. No direct brand clone detected, but proceed with extreme caution.`
    : result.type === 'green'
    ? `Domain and visual fingerprint are in agreement. This is the authentic ${result.brand} website.`
    : `This site doesn't match any known brand or scam pattern in our database. Exercise caution with unknown sites.`;

  return (
    <div className={`bg-card border ${cfg.border} rounded-2xl p-6 shadow-sm`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center flex-shrink-0`}>
            {cfg.icon}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">{cfg.heading}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{result.domain}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badge} flex-shrink-0`}>
          {cfg.badgeLabel}
        </span>
      </div>

      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{body}</p>

      {(result.type === 'red' || result.type === 'yellow') && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 mb-3 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-90' : ''}`}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Threat Details
          </button>

          {showDetails && (
            <div className="bg-secondary border border-border rounded-xl p-4 text-xs font-mono space-y-1.5 mb-4">
              {result.type === 'red' ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Hamming Distance</span><span className="text-foreground font-semibold">{result.hammingDistance}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Similarity</span><span className="text-foreground font-semibold">{result.similarity}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Domain Match</span><span className="text-destructive font-semibold">No</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Hash Match</span><span className="text-safe font-semibold">Yes</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Confidence</span><span className="text-destructive font-bold">HIGH</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Template Match</span><span className="text-foreground font-semibold">{result.templateName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Pattern Confidence</span><span className="text-warning font-bold">MEDIUM</span></div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex gap-3 flex-wrap">
        {result.type === 'red' && (
          <>
            <button className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors">
              Report This URL
            </button>
            <button
              onClick={onShowHash}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 text-sm font-medium transition-colors"
            >
              View Hash Comparison
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
