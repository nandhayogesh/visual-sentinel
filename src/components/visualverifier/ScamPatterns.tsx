import { useScrollReveal } from '@/hooks/useScrollReveal';

const templates = [
  { name: 'Fake Flash Sale Template #3', tags: ['E-Commerce', 'Clone'], matched: 47, level: 'CRITICAL', lastSeen: '3 days ago', gradient: 'from-destructive/20 to-primary/10' },
  { name: 'Prize Wheel Phishing #12', tags: ['Phishing', 'Social'], matched: 89, level: 'CRITICAL', lastSeen: '1 day ago', gradient: 'from-warning/20 to-destructive/10' },
  { name: 'Fake Checkout Page #5', tags: ['E-Commerce', 'Payment'], matched: 34, level: 'HIGH', lastSeen: '5 days ago', gradient: 'from-primary/20 to-safe/10' },
  { name: 'Login Harvester Template #8', tags: ['Credential', 'Clone'], matched: 62, level: 'CRITICAL', lastSeen: '2 days ago', gradient: 'from-destructive/30 to-warning/10' },
  { name: 'Fake App Download #2', tags: ['Malware', 'Mobile'], matched: 18, level: 'HIGH', lastSeen: '1 week ago', gradient: 'from-warning/20 to-primary/10' },
  { name: 'Cashback Lure Template #6', tags: ['E-Commerce', 'Social'], matched: 29, level: 'MEDIUM', lastSeen: '4 days ago', gradient: 'from-primary/10 to-unknown/10' },
];

const levelColors: Record<string, string> = {
  CRITICAL: 'bg-destructive/20 text-destructive',
  HIGH: 'bg-warning/20 text-warning',
  MEDIUM: 'bg-unknown/20 text-unknown',
};

const ScamPatterns = () => {
  const { ref, visible } = useScrollReveal();

  return (
    <section className="py-16 px-4" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-2">Scam Pattern Library</h2>
        <p className="text-center text-muted-foreground mb-10">Known scam templates tracked by VisualVerifier</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <div key={i}
              className={`glass-card p-5 transition-all duration-500 hover:border-primary/30 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* CSS gradient thumbnail */}
              <div className={`h-20 rounded-lg bg-gradient-to-br ${t.gradient} mb-4 flex items-center justify-center`}>
                <div className="grid grid-cols-4 gap-1 opacity-40">
                  {Array.from({ length: 12 }).map((_, j) => (
                    <div key={j} className="w-3 h-2 bg-foreground/20 rounded-sm" />
                  ))}
                </div>
              </div>

              <h4 className="font-semibold text-foreground text-sm mb-2">{t.name}</h4>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {t.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {tag}
                  </span>
                ))}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${levelColors[t.level]}`}>
                  {t.level}
                </span>
              </div>

              <div className="text-xs text-muted-foreground">🎯 Matched {t.matched} scam sites</div>
              <div className="text-xs text-muted-foreground mt-1">Last seen: {t.lastSeen}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScamPatterns;
