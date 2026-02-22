import { useState } from 'react';
import { getBrandDatabase } from '@/lib/analyzer';

const DatabasePanel = () => {
  const [open, setOpen] = useState(false);
  const data = getBrandDatabase();

  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => setOpen(!open)}
          className="glass-card w-full p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
          <span className="font-bold text-foreground text-lg">📦 Visual Signature Database</span>
          <span className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {open && (
          <div className="glass-card mt-2 overflow-x-auto animate-slide-up">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="p-3">Brand</th>
                  <th className="p-3">Canonical Domain</th>
                  <th className="p-3">Hash Preview</th>
                  <th className="p-3">Threshold</th>
                  <th className="p-3">Last Updated</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{row.brand}</td>
                    <td className="p-3 font-mono text-primary text-xs">{row.domain}</td>
                    <td className="p-3">
                      <div className="flex gap-0.5">
                        {row.hash.slice(0, 8).split('').map((b, j) => (
                          <div key={j} className={`w-2.5 h-2.5 rounded-sm ${b === '1' ? 'bg-primary' : 'bg-secondary'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-foreground">{row.threshold}%</td>
                    <td className="p-3 text-muted-foreground">{row.lastUpdated}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 text-safe text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-safe" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default DatabasePanel;
