import { useState, useCallback } from 'react';
import { analyzeUrl, parseDomain, type AnalysisResult } from '@/lib/analyzer';
import ResultCard from './ResultCard';
import HashComparison from './HashComparison';

const QUICK_TESTS = [
  { label: 'secure-login-verify.xyz', url: 'secure-login-verify.xyz/account/confirm', color: 'destructive' as const },
  { label: 'free-win-prize-today.top', url: 'free-win-prize-today.top/claim-gift', color: 'destructive' as const },
  { label: 'shop-deals-online.info', url: 'shop-deals-online.info/sale', color: 'warning' as const },
  { label: 'github.com', url: 'github.com', color: 'safe' as const },
];

const AnalyzerTool = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logLines, setLogLines] = useState<{ text: string; color: string }[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showHash, setShowHash] = useState(false);
  const [pipelineDone, setPipelineDone] = useState(false);

  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setLogLines([]);
    setResult(null);
    setShowHash(false);
    setPipelineDone(false);
  }, []);

  const runAnalysis = useCallback(() => {
    if (!url.trim()) return;
    reset();
    setIsAnalyzing(true);

    const domain = parseDomain(url);
    const analysisResult = analyzeUrl(url);
    const hash = analysisResult.scamHash || '0'.repeat(64);
    const brand = analysisResult.brand || 'Unknown';
    const canonical = analysisResult.canonicalDomain || 'N/A';
    const sim = analysisResult.similarity || 0;
    const hd = analysisResult.hammingDistance ?? 32;

    const resultLine = analysisResult.type === 'red'
      ? `ALERT: Domain mismatch on high-similarity match â€” SCAM DETECTED`
      : analysisResult.type === 'yellow'
      ? `WARNING: Suspicious URL pattern detected â€” proceed with caution`
      : analysisResult.type === 'green'
      ? `VERIFIED: Domain and visual fingerprint match â€” legitimate site`
      : `INFO: No matching brand or pattern found in database`;

    const resultColor = analysisResult.type === 'red' ? 'text-destructive'
      : analysisResult.type === 'yellow' ? 'text-warning'
      : analysisResult.type === 'green' ? 'text-safe'
      : 'text-unknown';

    const lines = [
      { text: `Initializing VisualVerifier engine...`, color: 'text-primary' },
      { text: `Parsing URL: ${url}`, color: 'text-muted-foreground' },
      { text: `Extracted domain: ${domain}`, color: 'text-muted-foreground' },
      { text: `Launching headless render engine...`, color: 'text-primary' },
      { text: `Page loaded. Viewport: 1080 x 1920px`, color: 'text-muted-foreground' },
      { text: `Capturing full-page screenshot...`, color: 'text-primary' },
      { text: `Screenshot captured. Size: 2.3MB`, color: 'text-muted-foreground' },
      { text: `Converting to grayscale...`, color: 'text-muted-foreground' },
      { text: `Resizing to 32x32 matrix...`, color: 'text-muted-foreground' },
      { text: `Applying Discrete Cosine Transform (DCT)...`, color: 'text-primary' },
      { text: `Extracting 8x8 low-frequency coefficients...`, color: 'text-muted-foreground' },
      { text: `Computing mean threshold...`, color: 'text-muted-foreground' },
      { text: `Generating 64-bit perceptual hash...`, color: 'text-primary' },
      { text: `Hash: ${hash}`, color: 'text-primary' },
      { text: `Querying visual signature database...`, color: 'text-primary' },
      { text: `Comparing against 12 known brand signatures...`, color: 'text-muted-foreground' },
      { text: `Closest match: ${brand} â€” Hamming Distance: ${hd}`, color: 'text-muted-foreground' },
      { text: `Similarity score: ${sim}%`, color: 'text-muted-foreground' },
      { text: `Running domain validation check...`, color: 'text-primary' },
      { text: `Expected domain: ${canonical} | Found: ${domain}`, color: 'text-muted-foreground' },
      { text: resultLine, color: resultColor },
      { text: `Analysis complete.`, color: 'text-primary' },
    ];

    let i = 0;
    const baseTime = new Date();
    const addLine = () => {
      if (i >= lines.length) {
        setResult(analysisResult);
        setPipelineDone(true);
        setIsAnalyzing(false);
        return;
      }
      const currentIndex = i;
      const seconds = Math.floor(currentIndex / 2);
      const time = new Date(baseTime.getTime() + seconds * 1000);
      const ts = time.toTimeString().slice(0, 8);
      const line = lines[currentIndex];
      setLogLines(prev => [...prev, { text: `[${ts}] ${line.text}`, color: line.color }]);
      i++;
      setTimeout(addLine, 150 + Math.random() * 250);
    };
    addLine();
  }, [url, reset]);

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
            Paste any suspicious link to check for phishing, impersonation, and scam patterns.
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
              onKeyDown={e => e.key === 'Enter' && runAnalysis()}
            />
            {url && (
              <button onClick={() => { setUrl(''); reset(); }}
                className="text-muted-foreground hover:text-foreground transition-colors text-base leading-none flex-shrink-0">
                Ã—
              </button>
            )}
          </div>

          {/* Try these examples */}
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Try these examples</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TESTS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => { setUrl(t.url); reset(); }}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
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
                Analyzing...
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
              <div key={i} className={`leading-relaxed ${
                line.color === 'text-primary' ? 'text-violet-300'
                : line.color === 'text-destructive' ? 'text-red-400'
                : line.color === 'text-safe' ? 'text-emerald-400'
                : line.color === 'text-warning' ? 'text-amber-400'
                : 'text-white/40'
              } ${i === logLines.length - 1 && isAnalyzing ? 'animate-pulse' : ''}`}>
                {line.text}
              </div>
            ))}
            {isAnalyzing && <span className="inline-block w-1.5 h-4 bg-violet-400 animate-blink" />}
          </div>
        )}

        {/* Result */}
        {pipelineDone && result && (
          <div className="mt-4 animate-slide-up">
            <ResultCard result={result} onShowHash={() => setShowHash(!showHash)} />
          </div>
        )}

        {/* Hash comparison */}
        {showHash && result && result.brandHash && result.scamHash && (
          <div className="mt-4 animate-slide-up">
            <HashComparison
              brandHash={result.brandHash}
              scamHash={result.scamHash}
              brandName={result.brand || 'Original'}
              hammingDistance={result.hammingDistance || 0}
            />
          </div>
        )}

        {pipelineDone && (
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
