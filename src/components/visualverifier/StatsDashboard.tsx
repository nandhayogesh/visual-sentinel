import { useCountUp } from '@/hooks/useCountUp';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const sparklinePaths = [
  'M0,20 L5,18 L10,15 L15,19 L20,12 L25,14 L30,8 L35,10 L40,5 L45,7 L50,3',
  'M0,18 L5,15 L10,17 L15,10 L20,13 L25,8 L30,11 L35,6 L40,9 L45,4 L50,7',
  'M0,15 L5,12 L10,18 L15,14 L20,16 L25,10 L30,13 L35,8 L40,11 L45,5 L50,9',
  'M0,10 L10,10 L20,10 L30,10 L40,10 L50,10',
];

const stats = [
  { label: 'Total Scans Today', target: 1284, sparkline: 0 },
  { label: 'Scams Blocked', target: 847, sparkline: 1 },
  { label: 'New Patterns Found', target: 23, sparkline: 2 },
  { label: 'DB Last Synced', target: 0, sparkline: 3, display: '2 min ago' },
];

const StatsDashboard = () => {
  const { ref, visible } = useScrollReveal();

  return (
    <section className="py-16 px-4" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-10">Live Statistics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
};

function StatCard({ label, target, sparkline, display, visible }: {
  label: string; target: number; sparkline: number; display?: string; visible: boolean;
}) {
  const { count, ref } = useCountUp(target, 2000);

  return (
    <div ref={ref}
      className={`glass-card p-5 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-2xl font-bold text-foreground font-mono">
        {display || count.toLocaleString()}
      </div>
      <svg viewBox="0 0 50 24" className="w-full h-6 mt-2">
        <path d={sparklinePaths[sparkline]} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
      </svg>
    </div>
  );
}

export default StatsDashboard;
