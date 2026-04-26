import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, hsl(222 20% 15% / 0.18))' }} />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-semibold tracking-[0.16em] uppercase text-primary mb-4 px-3 py-1 rounded-full bg-primary/15">
              Threat Intelligence Platform
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-[1.08] mb-5 sm:mb-6">
              Verify suspicious URLs before users click
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-xl">
              Correlate visual similarity, domain intelligence, and threat reputation feeds to detect phishing and impersonation attempts with explainable risk scoring.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => navigate('/analyzer')}
                className="btn-accent text-base px-7 py-3 w-full sm:w-auto justify-center"
              >
                Analyze URL
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className="btn-outline text-base px-7 py-3 w-full sm:w-auto justify-center"
              >
                View Detection Method
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              No account required. Typical analysis finishes in 15 to 30 seconds.
            </p>
          </div>

          <div className="hidden sm:block lg:w-[420px]">
            <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Live verdict preview</p>
              <div className="rounded-xl border border-border bg-secondary p-3 mb-3">
                <p className="text-xs text-muted-foreground mb-1">URL</p>
                <p className="text-sm font-mono text-foreground">https://secure-check-login.top</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl border border-destructive/35 bg-destructive/10 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Risk level</p>
                  <p className="text-sm font-semibold text-destructive">High</p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                  <p className="text-sm font-semibold text-primary">89 / 100</p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary p-3">
                <p className="text-xs text-muted-foreground mb-1">Top evidence</p>
                <ul className="text-xs text-foreground space-y-1.5">
                  <li>Brand impersonation detected</li>
                  <li>OpenPhish exact feed match</li>
                  <li>Domain age 6 days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
