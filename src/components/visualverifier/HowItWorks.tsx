import { useScrollReveal } from '@/hooks/useScrollReveal';

const steps = [
  { icon: '🔗', title: 'Share Link', desc: 'User pastes a suspicious URL' },
  { icon: '🌐', title: 'Headless Render', desc: 'Hidden WebView loads the full page' },
  { icon: '📷', title: 'Screenshot Capture', desc: 'Visual snapshot at 1080px viewport' },
  { icon: '🔍', title: 'pHash Generation', desc: 'DCT applied, 64-bit fingerprint computed' },
  { icon: '🗄️', title: 'DB Comparison', desc: 'Hamming distance vs stored hashes' },
  { icon: '🛡️', title: 'Domain Validation', desc: 'Visual match cross-checked with domain' },
  { icon: '🔔', title: 'Alert Issued', desc: 'Result shown to user instantly' },
];

const HowItWorks = () => {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="how-it-works" className="py-20 px-4" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-2">Detection Pipeline</h2>
        <p className="text-center text-muted-foreground mb-12">How VisualVerifier identifies impersonation scams</p>

        <div className="flex flex-col md:flex-row items-stretch gap-0 overflow-x-auto pb-4">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center flex-shrink-0">
              <div
                className={`glass-card p-5 w-48 text-center transition-all duration-500 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="text-xs font-mono text-primary mb-2">STEP {i + 1}</div>
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="font-semibold text-foreground text-sm mb-1">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.desc}</div>
              </div>

              {i < steps.length - 1 && (
                <svg className="w-8 h-4 md:w-10 md:h-6 text-primary mx-1 rotate-90 md:rotate-0 flex-shrink-0" viewBox="0 0 40 20">
                  <line x1="0" y1="10" x2="32" y2="10" stroke="currentColor" strokeWidth="2"
                    strokeDasharray="6 4" className="animate-dash-flow" />
                  <polygon points="32,5 40,10 32,15" fill="currentColor" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
