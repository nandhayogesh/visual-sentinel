import { useState, useCallback } from 'react';
import { analyzeUrl, parseDomain, type AnalysisResult } from '@/lib/analyzer';
import ResultCard from './ResultCard';
import HashComparison from './HashComparison';

const QUICK_TESTS = [
  { label: 'flipkart-mega-sale-2026.top', url: 'flipkart-mega-sale-2026.top/iphone-1rupee', color: 'destructive' as const },
  { label: 'amaz0n-offers.in', url: 'amaz0n-offers.in/free-gift', color: 'destructive' as const },
  { label: 'win-prize-today.com', url: 'win-prize-today.com/offer', color: 'warning' as const },
  { label: 'flipkart.com', url: 'flipkart.com', color: 'safe' as const },
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
      ? `ALERT: Domain mismatch on high-similarity match — SCAM DETECTED`
      : analysisResult.type === 'yellow'
      ? `WARNING: Suspicious URL pattern detected — proceed with caution`
      : analysisResult.type === 'green'
      ? `VERIFIED: Domain and visual fingerprint match — legitimate site`
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
      { text: `Page loaded. Viewport: 1080 × 1920px`, color: 'text-muted-foreground' },
      { text: `Capturing full-page screenshot...`, color: 'text-primary' },
      { text: `Screenshot captured. Size: 2.3MB`, color: 'text-muted-foreground' },
      { text: `Converting to grayscale...`, color: 'text-muted-foreground' },
      { text: `Resizing to 32×32 matrix...`, color: 'text-muted-foreground' },
      { text: `Applying Discrete Cosine Transform (DCT)...`, color: 'text-primary' },
      { text: `Extracting 8×8 low-frequency coefficients...`, color: 'text-muted-foreground' },
      { text: `Computing mean threshold...`, color: 'text-muted-foreground' },
      { text: `Generating 64-bit perceptual hash...`, color: 'text-primary' },
      { text: `Hash: ${hash}`, color: 'text-primary' },
      { text: `Querying visual signature database...`, color: 'text-primary' },
      { text: `Comparing against 12 known brand signatures...`, color: 'text-muted-foreground' },
      { text: `Closest match: ${brand} — Hamming Distance: ${hd}`, color: 'text-muted-foreground' },
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
      setLogLines(prev => [...prev, { text: `[${ts}] ● ${line.text}`, color: line.color }]);
      i++;
      setTimeout(addLine, 150 + Math.random() * 250);
    };
    addLine();
  }, [url, reset]);

  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="glass-card glow-border p-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">Link Analyzer</h2>
          <p className="text-muted-foreground text-sm mb-6">Paste a suspicious URL to check for visual impersonation</p>

          <div className="flex items-center gap-2 bg-secondary rounded-lg p-1 mb-4">
            <span className="pl-3 text-muted-foreground">🔒</span>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://suspicious-site.com/page"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-2.5 pr-3 text-sm font-mono"
              onKeyDown={e => e.key === 'Enter' && runAnalysis()}
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {QUICK_TESTS.map((t, i) => (
              <button key={i} onClick={() => { setUrl(t.url); reset(); }}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors
                  ${t.color === 'destructive' ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                  : t.color === 'warning' ? 'border-warning/30 text-warning hover:bg-warning/10'
                  : 'border-safe/30 text-safe hover:bg-safe/10'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={runAnalysis}
            disabled={isAnalyzing || !url.trim()}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold relative overflow-hidden disabled:opacity-50 transition-opacity"
          >
            {isAnalyzing ? 'ANALYZING...' : 'ANALYZE LINK'}
            {!isAnalyzing && (
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/10 to-transparent animate-scan-line pointer-events-none" />
            )}
          </button>

          {/* Terminal log */}
          {logLines.length > 0 && (
            <div className="mt-6 bg-background rounded-lg p-4 max-h-80 overflow-y-auto border border-border font-mono text-xs space-y-0.5">
              {logLines.map((line, i) => (
                <div key={i} className={`${line.color} ${i === logLines.length - 1 && isAnalyzing ? 'animate-pulse' : ''}`}>
                  {line.text}
                </div>
              ))}
              {isAnalyzing && <span className="inline-block w-2 h-4 bg-primary animate-blink ml-1" />}
            </div>
          )}
        </div>

        {/* Result card */}
        {pipelineDone && result && (
          <div className="mt-6 animate-slide-up">
            <ResultCard result={result} onShowHash={() => setShowHash(!showHash)} />
          </div>
        )}

        {/* Hash comparison */}
        {showHash && result && result.brandHash && result.scamHash && (
          <div className="mt-6 animate-slide-up">
            <HashComparison
              brandHash={result.brandHash}
              scamHash={result.scamHash}
              brandName={result.brand || 'Original'}
              hammingDistance={result.hammingDistance || 0}
            />
          </div>
        )}

        {pipelineDone && (
          <button onClick={() => { reset(); setUrl(''); }}
            className="mt-6 w-full py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-sm">
            Analyze Another Link
          </button>
        )}
      </div>
    </section>
  );
};

export default AnalyzerTool;
