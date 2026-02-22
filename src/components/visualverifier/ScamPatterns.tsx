import { useScrollReveal } from '@/hooks/useScrollReveal';

const categories = [
  {
    title: 'Credential Harvesting',
    description: 'Pages mimicking login portals to steal usernames, passwords, or 2FA codes from unsuspecting users.',
    tags: ['Phishing', 'Login Clone', 'Credential'],
    signals: ['Fake login form', 'Domain spoofing', 'SSL abuse'],
    level: 'CRITICAL',
    color: 'rose',
  },
  {
    title: 'Prize & Lottery Scams',
    description: 'Sites claiming users have won prizes, requiring personal details or payment to "claim" rewards.',
    tags: ['Social Engineering', 'Lottery', 'Lure'],
    signals: ['Win/prize keywords', 'Urgency tactics', 'Payment upfront'],
    level: 'CRITICAL',
    color: 'orange',
  },
  {
    title: 'Fake Checkout Pages',
    description: 'Counterfeit payment or checkout flows designed to capture card details under the guise of a purchase.',
    tags: ['Payment Fraud', 'Clone', 'Card Theft'],
    signals: ['Fake payment form', 'Lookalike domain', 'HTTPS abuse'],
    level: 'HIGH',
    color: 'teal',
  },
  {
    title: 'Malware Distribution',
    description: 'Pages that prompt users to download software updates, apps, or files that contain malicious payloads.',
    tags: ['Malware', 'Download', 'Drive-by'],
    signals: ['Forced download', 'Fake update prompt', 'Suspicious TLD'],
    level: 'CRITICAL',
    color: 'rose',
  },
  {
    title: 'Account Suspension Lures',
    description: 'Fake "your account will be suspended" alerts designed to trick users into entering credentials.',
    tags: ['Social Engineering', 'Impersonation', 'Alert'],
    signals: ['Urgency language', 'Brand impersonation', 'Verify/confirm keywords'],
    level: 'HIGH',
    color: 'orange',
  },
  {
    title: 'Survey & Cashback Traps',
    description: 'Multi-step survey funnels that collect PII or lead to subscription traps with hidden charges.',
    tags: ['PII Harvesting', 'Survey', 'Subscription'],
    signals: ['Cashback keyword', 'Excessive redirects', 'PII collection'],
    level: 'MEDIUM',
    color: 'teal',
  },
];

const levelStyles: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-600 border border-red-200',
  HIGH: 'bg-orange-50 text-orange-600 border border-orange-200',
  MEDIUM: 'bg-secondary text-muted-foreground border border-border',
};

const thumbnailBg: Record<string, string> = {
  rose: 'from-rose-100 to-pink-50',
  orange: 'from-orange-100 to-amber-50',
  teal: 'from-teal-50 to-cyan-50',
};

const ScamPatterns = () => {
  const { ref, visible } = useScrollReveal();

  return (
    <section id="patterns" className="py-16 sm:py-24 px-4 sm:px-6 bg-background" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3 px-3 py-1 bg-primary/10 rounded-full">Pattern Library</span>
          <h2 className="text-4xl font-black text-foreground mb-3">Scam Pattern Categories</h2>
          <p className="text-muted-foreground text-lg">Common threat archetypes detected by VisualVerifier's heuristic engine</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((t, i) => (
            <div
              key={i}
              className={`bg-card border border-border rounded-2xl p-5 transition-all duration-500 hover:shadow-md hover:-translate-y-0.5 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Thumbnail */}
              <div className={`h-20 rounded-xl bg-gradient-to-br ${thumbnailBg[t.color]} mb-4 flex items-center justify-center`}>
                <div className="flex gap-2 opacity-30">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="w-2 h-8 bg-gray-400 rounded-sm" style={{ height: `${20 + j * 8}px` }} />
                  ))}
                </div>
              </div>

              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-foreground text-sm leading-tight">{t.title}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${levelStyles[t.level]}`}>{t.level}</span>
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed mb-3">{t.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {t.tags.map(tag => (
                  <span key={tag} className="text-[11px] px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="border-t border-border/60 pt-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Detection Signals</p>
                <ul className="space-y-1">
                  {t.signals.map(s => (
                    <li key={s} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary/50 flex-shrink-0" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScamPatterns;
