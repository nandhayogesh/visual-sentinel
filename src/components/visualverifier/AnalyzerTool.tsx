import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { submitAnalysis, pollAnalysis, parseDomain, subscribeAnalysis } from '@/lib/analyzer';
import type { AnalysisResult, AnalysisProgress, AnalysisError, AllChecks } from '@/types/analysis';
import ResultCard from './ResultCard';
import ScreenshotComparison from './ScreenshotComparison';

const QUICK_TESTS = {
  risky: [
    { label: 'flipkart-sale.xyz', url: 'flipkart-sale.xyz' },
    { label: 'paypal-secure-login.top', url: 'paypal-secure-login.top' },
    { label: 'shop-deals-online.info', url: 'shop-deals-online.info' },
  ],
  legitimate: [
    { label: 'github.com', url: 'github.com' },
    { label: 'microsoft.com', url: 'microsoft.com' },
  ],
};

// Progress stage messages shown in the analysis log
const STAGE_COLORS: Record<string, string> = {
  'Identifying brand': 'text-accent',
  'Running protocol': 'text-accent',
  'SSL': 'text-accent',
  'WHOIS': 'text-accent',
  'DNS': 'text-accent',
  'Headers': 'text-accent',
  'Safe Browsing': 'text-accent',
  'OpenPhish': 'text-accent',
  'VirusTotal': 'text-accent',
  'URLScan': 'text-accent',
  'GeoIP': 'text-accent',
  'Checking PhishTank': 'text-accent',
  'Checking Google': 'text-accent',
  'Submitting to VirusTotal': 'text-accent',
  'Rendering site': 'text-accent',
  'Capturing screenshot': 'text-accent',
  'Computing final': 'text-accent',
  'Analysis complete': 'text-safe',
};

function stageColor(stage: string): string {
  const normalizedStage = stage.toLowerCase();
  const key = Object.keys(STAGE_COLORS).find(k => normalizedStage.startsWith(k.toLowerCase()));
  return key ? STAGE_COLORS[key] : 'text-muted-foreground';
}

type CheckKey = keyof AllChecks;
type PartialChecks = Partial<Record<CheckKey, unknown>>;

const CHECK_LABELS: Array<{ key: CheckKey; label: string }> = [
  { key: 'ssl', label: 'SSL' },
  { key: 'whois', label: 'WHOIS' },
  { key: 'dns', label: 'DNS' },
  { key: 'headers', label: 'Headers' },
  { key: 'safebrowsing', label: 'Safe Browsing' },
  { key: 'openphish', label: 'OpenPhish' },
  { key: 'virustotal', label: 'VirusTotal' },
  { key: 'urlscan', label: 'URLScan' },
  { key: 'geo', label: 'GeoIP' },
];

function formatCheckSummary(checkName: CheckKey, value: unknown): string {
  if (!value || typeof value !== 'object') {
    return 'Updated';
  }

  const record = value as Record<string, unknown>;

  if (typeof record.error === 'string') {
    return record.error;
  }

  switch (checkName) {
    case 'ssl':
      return record.valid === true ? `Valid (${String(record.daysRemaining ?? '?')} days remaining)` : 'Invalid or unavailable';
    case 'whois':
      return record.domainAge != null ? `${String(record.domainAge)} days old` : 'WHOIS unavailable';
    case 'dns':
      return Array.isArray(record.ipAddresses) ? `${record.ipAddresses.length} IP record(s)` : 'DNS resolved';
    case 'headers':
      return `${String([record.hasHSTS, record.hasCSP, record.hasXFrameOptions].filter(Boolean).length)} / 3 security headers present`;
    case 'safebrowsing':
      return record.isFlagged ? `Flagged: ${String(record.threatType ?? 'threat')}` : 'Clean';
    case 'openphish':
      return record.inFeed ? `Matched (${String(record.matchType ?? 'feed')})` : 'Not in feed';
    case 'virustotal':
      return `Malicious ${String(record.maliciousCount ?? 0)} / ${String(record.totalEngines ?? 0)} engines`;
    case 'urlscan':
      return record.score != null ? `Score ${String(record.score)}` : 'Scan complete';
    case 'geo':
      return record.city || record.country ? `${String(record.city ?? 'Unknown')}, ${String(record.country ?? 'Unknown')}` : 'Geo lookup complete';
    default:
      return 'Updated';
  }
}

function isAnalysisError(value: unknown): value is AnalysisError {
  return !!value && typeof value === 'object' && (value as AnalysisError).status === 'error';
}

function isAnalysisProgress(value: unknown): value is AnalysisProgress {
  return !!value && typeof value === 'object' && (value as AnalysisProgress).status === 'running';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function validateUrlInput(raw: string): string | null {
  const value = raw.trim();
  if (!value) return 'Enter a URL or domain to analyze.';
  if (value.length > 2048) return 'URL is too long. Maximum length is 2048 characters.';

  try {
    const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const parsed = new URL(normalized);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'Only http and https URLs are supported.';
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return 'Enter a valid domain or URL.';
    }
  } catch {
    return 'Enter a valid domain or URL.';
  }

  return null;
}

const AnalyzerTool = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logLines, setLogLines] = useState<{ text: string; color: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Waiting to start');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScreenshots, setShowScreenshots] = useState(false);
  const [showAdvancedLog, setShowAdvancedLog] = useState(false);
  const [partialChecks, setPartialChecks] = useState<PartialChecks>({});

  const streamRef = useRef<NonNullable<ReturnType<typeof subscribeAnalysis>> | null>(null);
  const pollingCancelledRef = useRef(false);
  const pollingStartedRef = useRef(false);
  const terminalHandledRef = useRef(false);
  const sessionIdRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  const validationError = useMemo(() => validateUrlInput(url), [url]);
  const normalizedDomain = useMemo(() => {
    if (!url.trim()) return '';
    return parseDomain(url);
  }, [url]);

  const pipelineSteps = [
    { key: 'queued', label: 'Queued', threshold: 5 },
    { key: 'collect', label: 'Collecting signals', threshold: 35 },
    { key: 'correlate', label: 'Correlating evidence', threshold: 65 },
    { key: 'score', label: 'Scoring risk', threshold: 90 },
    { key: 'finalize', label: 'Finalizing result', threshold: 100 },
  ];

  const closeSession = useCallback(() => {
    pollingCancelledRef.current = true;
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    closeSession();
    setIsAnalyzing(false);
    setLogLines([]);
    setProgress(0);
    setStage('Waiting to start');
    setResult(null);
    setError(null);
    setShowScreenshots(false);
    setShowAdvancedLog(false);
    setPartialChecks({});
  }, [closeSession]);

  const addLog = useCallback((text: string, color: string) => {
    const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
    setLogLines(prev => [...prev, { text: `[+${elapsed}s] ${text}`, color }]);
  }, []);

  const finishSuccess = useCallback((analysis: AnalysisResult) => {
    if (terminalHandledRef.current || sessionIdRef.current === 0) return;
    terminalHandledRef.current = true;
    closeSession();
    setProgress(100);
    setStage('Analysis complete');
    setResult(analysis);
    addLog('Analysis complete.', 'text-safe');
    addLog(
      `Verdict: ${analysis.verdict.label} (risk score: ${analysis.verdict.score}/100)`,
      analysis.verdict.color === 'red' ? 'text-red-400'
        : analysis.verdict.color === 'orange' ? 'text-orange-400'
        : analysis.verdict.color === 'yellow' ? 'text-amber-400'
        : 'text-emerald-400'
    );
    setIsAnalyzing(false);
  }, [addLog, closeSession]);

  const finishError = useCallback((message: string) => {
    if (terminalHandledRef.current || sessionIdRef.current === 0) return;
    terminalHandledRef.current = true;
    closeSession();
    addLog(`Analysis error: ${message}`, 'text-red-400');
    setError(message);
    setIsAnalyzing(false);
  }, [addLog, closeSession]);

  const updateProgress = useCallback((nextProgress: number, nextStage: string) => {
    setProgress(prev => Math.max(prev, nextProgress));
    setStage(nextStage);
    addLog(nextStage, stageColor(nextStage));
  }, [addLog]);

  const startPollingFallback = useCallback(async (jobId: string, sessionId: number) => {
    if (pollingStartedRef.current || terminalHandledRef.current) return;
    pollingStartedRef.current = true;
    addLog('Live stream unavailable; falling back to polling.', 'text-muted-foreground');

    while (!pollingCancelledRef.current && sessionIdRef.current === sessionId && !terminalHandledRef.current) {
      try {
        const response = await pollAnalysis(jobId);

        if (pollingCancelledRef.current || sessionIdRef.current !== sessionId || terminalHandledRef.current) {
          return;
        }

        if (response.status === 'running') {
          updateProgress(response.progress, response.stage);
          await sleep(3000);
          continue;
        }

        if (isAnalysisError(response)) {
          finishError(response.error);
          return;
        }

        finishSuccess(response);
        return;
      } catch (err) {
        finishError(`Polling error: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
    }
  }, [finishError, finishSuccess, updateProgress, addLog]);

  const runAnalysis = useCallback(async () => {
    const invalid = validateUrlInput(url);
    if (invalid) {
      setError(invalid);
      return;
    }

    reset();
    setIsAnalyzing(true);
    pollingCancelledRef.current = false;
    pollingStartedRef.current = false;
    terminalHandledRef.current = false;
    const sessionId = sessionIdRef.current + 1;
    sessionIdRef.current = sessionId;
    startTimeRef.current = Date.now();
    setStage('Queued');

    const domain = parseDomain(url);
    addLog(`Parsing URL -> domain: ${domain}`, 'text-muted-foreground');
    addLog('Connecting to live analysis stream...', 'text-accent');

    let jobId: string;
    try {
      jobId = await submitAnalysis(url.trim());
      addLog(`Job created: ${jobId}`, 'text-muted-foreground');
    } catch (err) {
      finishError(`Failed to start analysis: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    const connection = subscribeAnalysis(jobId, {
      onSnapshot: snapshot => {
        if (sessionIdRef.current !== sessionId || terminalHandledRef.current) return;

        if (isAnalysisProgress(snapshot)) {
          setProgress(snapshot.progress);
          setStage(snapshot.stage);
          if (snapshot.partialChecks) {
            setPartialChecks(snapshot.partialChecks as PartialChecks);
          }
          return;
        }

        if (snapshot.status === 'complete' && snapshot.result) {
          finishSuccess(snapshot.result);
          return;
        }

        if (isAnalysisError(snapshot)) {
          finishError(snapshot.error);
        }
      },
      onProgress: update => {
        if (sessionIdRef.current !== sessionId || terminalHandledRef.current) return;

        if (typeof update.progress === 'number') {
          setProgress(prev => Math.max(prev, update.progress));
        }

        if (update.stage) {
          setStage(update.stage);
          addLog(update.stage, stageColor(update.stage));
        }

        if (update.partialChecks) {
          setPartialChecks(prev => ({ ...prev, ...update.partialChecks }));
        }

        if (update.checkName && update.check !== undefined) {
          setPartialChecks(prev => ({ ...prev, [update.checkName as CheckKey]: update.check }));
          addLog(`${String(update.checkName).toUpperCase()}: ${formatCheckSummary(update.checkName as CheckKey, update.check)}`, 'text-muted-foreground');
        }
      },
      onComplete: analysis => {
        if (sessionIdRef.current !== sessionId || terminalHandledRef.current) return;
        finishSuccess(analysis);
      },
      onError: backendError => {
        if (sessionIdRef.current !== sessionId || terminalHandledRef.current) return;
        finishError(backendError.error);
      },
      onTransportError: () => {
        if (sessionIdRef.current !== sessionId || terminalHandledRef.current) return;
        void startPollingFallback(jobId, sessionId);
      },
    });

    if (connection) {
      streamRef.current = connection;
      addLog('Connected to live analysis stream.', 'text-muted-foreground');
      return;
    }

    void startPollingFallback(jobId, sessionId);
  }, [addLog, finishError, finishSuccess, reset, startPollingFallback, url]);

  useEffect(() => () => {
    closeSession();
  }, [closeSession]);

  return (
    <section id="analyzer" className="py-16 sm:py-24 px-4 sm:px-6 bg-secondary/40">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3 px-3 py-1 bg-primary/15 rounded-full">
            Link Analyzer
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Analyze URL Risk with Evidence</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Submit a suspicious URL to evaluate phishing risk, confidence, and recommended response actions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input and controls */}
          <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-1">
            <label htmlFor="analysis-url" className="block text-sm font-semibold text-foreground mb-2">
              URL to analyze
            </label>
            <p className="text-xs text-muted-foreground mb-3" id="analysis-url-helper">
              Paste a full URL or domain. We normalize it before scanning.
            </p>

            <div className="flex items-center gap-3 bg-secondary border border-border rounded-xl px-4 py-3 mb-2 transition-all focus-within:border-primary focus-within:shadow-focus">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted-foreground flex-shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="analysis-url"
                type="text"
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                aria-describedby="analysis-url-helper"
                placeholder="https://example.com/login"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm font-mono"
                onKeyDown={e => e.key === 'Enter' && !isAnalyzing && runAnalysis()}
                disabled={isAnalyzing}
              />
              {url && !isAnalyzing && (
                <button
                  onClick={() => {
                    setUrl('');
                    reset();
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors text-base leading-none flex-shrink-0 focus-visible-ring rounded"
                  aria-label="Clear URL"
                >
                  x
                </button>
              )}
            </div>

            {url.trim() && !validationError && (
              <p className="text-xs text-muted-foreground mb-2">Normalized domain: <span className="font-mono text-foreground">{normalizedDomain}</span></p>
            )}
            {validationError && !isAnalyzing && (
              <p className="text-xs text-destructive mb-2" role="alert">{validationError}</p>
            )}

            <div className="mb-4 mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Risky examples</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TESTS.risky.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUrl(t.url);
                      reset();
                    }}
                    disabled={isAnalyzing}
                    className="text-xs px-3 py-1.5 rounded-full border border-destructive/35 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 focus-visible-ring"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Legitimate examples</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TESTS.legitimate.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUrl(t.url);
                      reset();
                    }}
                    disabled={isAnalyzing}
                    className="text-xs px-3 py-1.5 rounded-full border border-safe/35 text-safe hover:bg-safe/10 transition-colors disabled:opacity-40 focus-visible-ring"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || !!validationError}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:brightness-105 focus-visible-ring"
              aria-busy={isAnalyzing}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                  </svg>
                  Analyzing {progress > 0 ? `${progress}%` : ''}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Analyze URL
                </span>
              )}
            </button>

            <p className="text-xs text-muted-foreground mt-3">
              No account required. Typical completion time is 15 to 30 seconds.
            </p>
          </div>

          {/* Progress and system state */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-1">
            <h3 className="text-base font-semibold text-foreground mb-2">Analysis progress</h3>
            <p className="text-sm text-muted-foreground mb-4" aria-live="polite">
              {isAnalyzing ? stage : 'Run an analysis to view live progress and evidence.'}
            </p>

            <div className="space-y-2 mb-4">
              {pipelineSteps.map((step, idx) => {
                const reached = progress >= step.threshold;
                const active = isAnalyzing && progress < step.threshold && idx > 0 && progress >= pipelineSteps[idx - 1].threshold;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${reached ? 'bg-primary' : active ? 'bg-accent' : 'bg-border'}`} />
                    <span className={`text-sm ${reached ? 'text-foreground' : active ? 'text-accent' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Progress: {progress}%</p>

            {Object.keys(partialChecks).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Partial results</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CHECK_LABELS.map(({ key, label }) => {
                    const value = partialChecks[key];
                    const ready = value !== undefined;
                    return (
                      <div key={key} className={`rounded-xl border px-3 py-2 ${ready ? 'border-primary/20 bg-primary/5' : 'border-border bg-secondary/50'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">{label}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${ready ? 'text-safe' : 'text-muted-foreground'}`}>
                            {ready ? 'Ready' : 'Waiting'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{ready ? formatCheckSummary(key, value) : 'Awaiting signal'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive animate-slide-up">
                <strong>Analysis issue:</strong> {error}
                <p className="text-xs mt-1 text-destructive/80">If this persists, verify the backend server is reachable on port 3001.</p>
              </div>
            )}

            {logLines.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowAdvancedLog(v => !v)}
                  className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors focus-visible-ring rounded"
                >
                  {showAdvancedLog ? 'Hide' : 'Show'} advanced analysis log
                </button>

                {showAdvancedLog && (
                  <div className="mt-2 bg-surface-1 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-1 border border-border/80">
                    {logLines.map((line, i) => (
                      <div key={i} className={`leading-relaxed ${line.color} ${i === logLines.length - 1 && isAnalyzing ? 'animate-pulse' : ''}`}>
                        {line.text}
                      </div>
                    ))}
                    {isAnalyzing && <span className="inline-block w-1.5 h-4 bg-accent animate-blink" />}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Result card */}
        {result && (
          <div className="mt-4 animate-slide-up space-y-4">
            <ResultCard
              result={result}
              onShowScreenshots={() => setShowScreenshots(!showScreenshots)}
            />

            {/* Screenshot comparison */}
            {showScreenshots && (
              <ScreenshotComparison
                screenshots={result.screenshots}
                brand={result.brand}
                suspiciousDomain={result.domain}
              />
            )}
          </div>
        )}

        {result && (
          <button
            onClick={() => { reset(); setUrl(''); }}
            className="mt-4 w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-secondary transition-all text-sm font-medium"
          >
            Analyze Another Link
          </button>
        )}
      </div>
    </section>
  );
};

export default AnalyzerTool;
