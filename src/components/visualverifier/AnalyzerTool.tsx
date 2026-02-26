import { useState, useCallback, useRef } from 'react';
import { submitAnalysis, pollAnalysis, parseDomain } from '@/lib/analyzer';
import type { AnalysisResult } from '@/types/analysis';
import ResultCard from './ResultCard';
import ScreenshotComparison from './ScreenshotComparison';

const QUICK_TESTS = [
  { label: 'flipkart-sale.xyz (scam)', url: 'flipkart-sale.xyz', color: 'destructive' as const },
  { label: 'paypal-secure-login.top', url: 'paypal-secure-login.top', color: 'destructive' as const },
  { label: 'shop-deals-online.info', url: 'shop-deals-online.info', color: 'warning' as const },
  { label: 'github.com', url: 'github.com', color: 'safe' as const },
];

// Progress stage messages shown in the analysis log
const STAGE_COLORS: Record<string, string> = {
  'Identifying brand':       'text-violet-300',
  'Running protocol':        'text-violet-300',
  'Checking PhishTank':      'text-violet-300',
  'Checking Google':         'text-violet-300',
  'Submitting to VirusTotal':'text-violet-300',
  'Rendering site':          'text-violet-300',
  'Capturing screenshot':    'text-violet-300',
  'Computing final':         'text-violet-300',
  'Analysis complete':       'text-emerald-400',
};

function stageColor(stage: string): string {
  const key = Object.keys(STAGE_COLORS).find(k => stage.startsWith(k));
  return key ? STAGE_COLORS[key] : 'text-white/50';
}

const AnalyzerTool = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logLines, setLogLines] = useState<{ text: string; color: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScreenshots, setShowScreenshots] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setIsAnalyzing(false);
    setLogLines([]);
    setProgress(0);
    setResult(null);
    setError(null);
    setShowScreenshots(false);
  }, []);

  const addLog = useCallback((text: string, color: string) => {
    const elapsed = ((Date.now() - startTimeRef.current) / 1000).toFixed(1);
    setLogLines(prev => [...prev, { text: `[+${elapsed}s] ${text}`, color }]);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!url.trim()) return;
    reset();
    setIsAnalyzing(true);
    startTimeRef.current = Date.now();

    const domain = parseDomain(url);
    addLog(`Parsing URL → domain: ${domain}`, 'text-white/50');
    addLog('Connecting to analysis backend…', 'text-violet-300');

    let jobId: string;
    try {
      jobId = await submitAnalysis(url.trim());
      addLog(`Job created: ${jobId}`, 'text-white/30');
    } catch (err) {
      setError(`Failed to start analysis: ${err instanceof Error ? err.message : String(err)}`);
      setIsAnalyzing(false);
      return;
    }

    // Poll every 3 seconds
    pollRef.current = setInterval(async () => {
      try {
        const response = await pollAnalysis(jobId);

        if (response.status === 'running') {
          setProgress(response.progress);
          addLog(response.stage, stageColor(response.stage));
          return;
        }

        // Done (complete or error)
        clearInterval(pollRef.current!);

        if (response.status === 'error') {
          addLog(`Analysis error: ${response.error}`, 'text-red-400');
          setError(response.error);
          setIsAnalyzing(false);
          return;
        }

        // Complete
        setProgress(100);
        const r = response;
        addLog('Analysis complete.', 'text-emerald-400');
        addLog(
          `Verdict: ${r.verdict.label} (risk score: ${r.verdict.score}/100)`,
          r.verdict.color === 'red' ? 'text-red-400'
            : r.verdict.color === 'orange' ? 'text-orange-400'
            : r.verdict.color === 'yellow' ? 'text-amber-400'
            : 'text-emerald-400'
        );
        setResult(r);
        setIsAnalyzing(false);
      } catch (err) {
        clearInterval(pollRef.current!);
        setError(`Polling error: ${err instanceof Error ? err.message : String(err)}`);
        setIsAnalyzing(false);
      }
    }, 3000);
  }, [url, reset, addLog]);

  return (
    <section id="analyzer" className="py-16 sm:py-24 px-4 sm:px-6 bg-secondary/40">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3 px-3 py-1 bg-primary/10 rounded-full">
            Link Analyzer
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-3">Analyze Any URL</h2>
          <p className="text-muted-foreground">
            Paste any suspicious link to check for phishing, impersonation, and scam patterns using real-time threat intelligence.
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-8 shadow-sm">

          {/* URL Input */}
          <div className="flex items-center gap-3 bg-secondary border border-border rounded-xl px-4 py-3 mb-4 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="w-4 h-4 text-muted-foreground flex-shrink-0">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://suspicious-site.com/page"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm font-mono"
              onKeyDown={e => e.key === 'Enter' && !isAnalyzing && runAnalysis()}
              disabled={isAnalyzing}
            />
            {url && !isAnalyzing && (
              <button onClick={() => { setUrl(''); reset(); }}
                className="text-muted-foreground hover:text-foreground transition-colors text-base leading-none flex-shrink-0">
                ×
              </button>
            )}
          </div>

          {/* Quick tests */}
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Try these examples</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TESTS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setUrl(t.url); reset(); }}
                  disabled={isAnalyzing}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors disabled:opacity-40 ${
                    t.color === 'destructive'
                      ? 'border-destructive/25 text-destructive hover:bg-destructive/5'
                      : t.color === 'warning'
                      ? 'border-yellow-400/30 text-yellow-600 hover:bg-yellow-50'
                      : 'border-safe/25 text-safe hover:bg-safe/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || !url.trim()}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-primary/90 hover:shadow-md"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
                Analyzing… {progress > 0 ? `${progress}%` : ''}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Analyze Link
              </span>
            )}
          </button>

          {/* Progress bar */}
          {isAnalyzing && progress > 0 && (
            <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Analysis log */}
        {logLines.length > 0 && (
          <div className="mt-4 bg-zinc-950 rounded-2xl p-5 max-h-64 overflow-y-auto font-mono text-xs space-y-1 animate-slide-up">
            <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2 text-white/30 text-xs">analysis log</span>
            </div>
            {logLines.map((line, i) => (
              <div key={i} className={`leading-relaxed ${line.color} ${
                i === logLines.length - 1 && isAnalyzing ? 'animate-pulse' : ''
              }`}>
                {line.text}
              </div>
            ))}
            {isAnalyzing && <span className="inline-block w-1.5 h-4 bg-violet-400 animate-blink" />}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-sm text-destructive animate-slide-up">
            <strong>Error:</strong> {error}
            <p className="text-xs mt-1 text-destructive/70">Make sure the backend server is running on port 3001.</p>
          </div>
        )}

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
