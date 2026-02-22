import { useState } from 'react';
import type { AnalysisResult } from '@/lib/analyzer';

interface Props {
  result: AnalysisResult;
  onShowHash: () => void;
}

const configs = {
  red: {
    glow: 'glow-border-red',
    icon: '🛑',
    heading: 'VISUAL CLONE DETECTED',
    color: 'text-destructive',
    bgAccent: 'bg-destructive/10',
  },
  yellow: {
    glow: 'glow-border-yellow',
    icon: '⚠️',
    heading: 'SUSPICIOUS PATTERN DETECTED',
    color: 'text-warning',
    bgAccent: 'bg-warning/10',
  },
  green: {
    glow: 'glow-border-green',
    icon: '✅',
    heading: 'LEGITIMATE SITE VERIFIED',
    color: 'text-safe',
    bgAccent: 'bg-safe/10',
  },
  grey: {
    glow: 'glow-border-grey',
    icon: '❓',
    heading: 'UNKNOWN SITE',
    color: 'text-unknown',
    bgAccent: 'bg-unknown/10',
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
    <div className={`glass-card ${cfg.glow} p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{cfg.icon}</span>
        <h3 className={`text-xl font-bold ${cfg.color}`}>{cfg.heading}</h3>
      </div>

      <p className="text-muted-foreground text-sm mb-4">{body}</p>

      {(result.type === 'red' || result.type === 'yellow') && (
        <>
          <button onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-primary hover:underline mb-3">
            {showDetails ? '▼' : '▶'} Threat Details
          </button>

          {showDetails && (
            <div className={`${cfg.bgAccent} rounded-lg p-4 text-xs font-mono space-y-1 mb-4`}>
              {result.type === 'red' ? (
                <>
                  <div>Hamming Distance: <span className="text-foreground">{result.hammingDistance}</span></div>
                  <div>Similarity: <span className="text-foreground">{result.similarity}%</span></div>
                  <div>Domain Mismatch: <span className="text-destructive">✗</span></div>
                  <div>Hash Match: <span className="text-safe">✓</span></div>
                  <div>Scam Confidence: <span className="text-destructive font-bold">HIGH</span></div>
                </>
              ) : (
                <>
                  <div>Template Match: <span className="text-foreground">{result.templateName}</span></div>
                  <div>Pattern Confidence: <span className="text-warning font-bold">MEDIUM</span></div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex gap-3 flex-wrap">
        {result.type === 'red' && (
          <>
            <button className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium">
              Report This URL
            </button>
            <button onClick={onShowHash}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm transition-colors">
              View Hash Comparison
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultCard;
