import { useCountUp } from '@/hooks/useCountUp';
import ShieldIcon from './ShieldIcon';

const stats = [
  { label: 'Scam Sites Detected', target: 2847 },
  { label: 'Brand Signatures in DB', target: 12 },
  { label: 'Detection Accuracy', target: 943, suffix: '%', divisor: 10 },
];

const HeroSection = () => {
  const handleScroll = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animate-hero-gradient"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, hsl(239 84% 67% / 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, hsl(239 84% 30% / 0.1) 0%, hsl(222 47% 8%) 70%)',
          backgroundSize: '200% 200%',
        }}
      />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <ShieldIcon className="w-20 h-20 animate-pulse-glow" />
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight mb-4">
          Visual<span className="text-primary">Verifier</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
          Real-Time Visual Fingerprint Detection for E-Commerce Impersonation Scams
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-safe/10 border border-safe/30 mb-10">
          <span className="w-2 h-2 rounded-full bg-safe animate-blink" />
          <span className="text-safe text-sm font-medium tracking-wide">SYSTEM ONLINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {stats.map((s, i) => (
            <StatCounter key={i} {...s} />
          ))}
        </div>

        <button
          onClick={handleScroll}
          className="px-6 py-3 rounded-lg bg-secondary text-foreground border border-border hover:border-primary/50 transition-colors text-sm font-medium"
        >
          ↓ How It Works
        </button>
      </div>
    </section>
  );
};

function StatCounter({ label, target, suffix, divisor }: { label: string; target: number; suffix?: string; divisor?: number }) {
  const { count, ref } = useCountUp(target, 2000);
  const display = divisor ? (count / divisor).toFixed(1) : count.toLocaleString();

  return (
    <div ref={ref} className="glass-card p-5">
      <div className="text-3xl font-bold text-foreground font-mono">
        {display}{suffix}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default HeroSection;
