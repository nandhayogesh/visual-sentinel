import { useScrollReveal } from '@/hooks/useScrollReveal';

const steps = [
  {
    num: '01',
    phase: 'Collect',
    title: 'Paste URL',
    desc: 'User submits a suspicious URL for analysis',
    output: 'Normalized domain',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    num: '02',
    phase: 'Collect',
    title: 'Headless Render',
    desc: 'Hidden browser loads the full page at 1080px',
    output: 'Rendered DOM',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    num: '03',
    phase: 'Collect',
    title: 'Screenshot',
    desc: 'Full-page visual snapshot captured automatically',
    output: 'Suspicious screenshot',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
  },
  {
    num: '04',
    phase: 'Correlate',
    title: 'pHash Generation',
    desc: 'DCT applied, 64-bit perceptual fingerprint computed',
    output: 'Perceptual hash',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    num: '05',
    phase: 'Correlate',
    title: 'DB Comparison',
    desc: 'Hamming distance measured vs stored brand hashes',
    output: 'Similarity score',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    num: '06',
    phase: 'Decide',
    title: 'Verdict',
    desc: 'Instant result with risk level and details shown',
    output: 'Risk + confidence + actions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const HowItWorks = () => {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-secondary/40" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3 px-3 py-1 bg-primary/10 rounded-full">Detection Pipeline</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            A connected six-step workflow from suspicious URL to analyst-ready decision.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative bg-card border border-border rounded-2xl p-5 sm:p-6 transition-all duration-500 hover:shadow-1 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {i < steps.length - 1 && (
                <div className="absolute left-[2.1rem] top-[4.2rem] bottom-[-1.1rem] w-px bg-border" aria-hidden="true" />
              )}

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/12 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground tracking-wider">STEP {step.num}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">{step.phase}</span>
                  </div>

                  <h3 className="font-semibold text-foreground text-base mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{step.desc}</p>
                  <p className="text-xs text-foreground/85">
                    Output: <span className="text-muted-foreground">{step.output}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card border border-border rounded-2xl p-5 sm:p-6">
          <h3 className="text-base font-semibold text-foreground mb-2">Confidence notes</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>Confidence drops when one or more threat feeds are temporarily unavailable.</li>
            <li>Brand impersonation verdicts are stronger when visual hash and reputation signals align.</li>
            <li>Newly registered domains can trigger caution even when some feeds are clean.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
