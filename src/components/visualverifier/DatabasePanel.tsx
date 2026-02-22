import { useState } from 'react';
import { getBrandDatabase } from '@/lib/analyzer';

const DatabasePanel = () => {
  const [open, setOpen] = useState(false);
  const data = getBrandDatabase();

  return (
    <section className="py-10 px-6 bg-secondary/40">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => setOpen(!open)}
          className="w-full bg-card border border-border rounded-2xl px-6 py-4 flex items-center justify-between hover:border-primary/40 transition-colors shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <span className="font-semibold text-foreground">Visual Signature Database</span>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{data.length} brands</span>
          </div>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div className="mt-2 bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Canonical Domain</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hash Preview</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Threshold</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Updated</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{row.brand}</td>
                      <td className="px-4 py-3 font-mono text-primary text-xs">{row.domain}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-0.5">
                          {row.hash.slice(0, 8).split('').map((b, j) => (
                            <div key={j} className={`w-2.5 h-2.5 rounded-sm ${b === '1' ? 'bg-primary' : 'bg-border'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground text-xs">{row.threshold}%</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{row.lastUpdated}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-safe text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-safe" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DatabasePanel;
