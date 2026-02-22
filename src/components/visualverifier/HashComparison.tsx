interface Props {
  brandHash: string;
  scamHash: string;
  brandName: string;
  hammingDistance: number;
}

const HashGrid = ({ hash, compHash, label }: { hash: string; compHash: string; label: string }) => (
  <div>
    <div className="text-sm font-semibold text-foreground mb-2 text-center">{label}</div>
    <div className="grid grid-cols-8 gap-1 mx-auto w-fit mb-2">
      {hash.split('').map((bit, i) => {
        const diff = bit !== compHash[i];
        return (
          <div key={i}
            className={`w-5 h-5 rounded-sm transition-all ${
              diff ? 'bg-destructive animate-pulse' :
              bit === '1' ? 'bg-primary' : 'bg-secondary'
            }`}
          />
        );
      })}
    </div>
    <div className="font-mono text-[10px] text-muted-foreground text-center break-all max-w-[200px] mx-auto">
      {hash}
    </div>
  </div>
);

const HashComparison = ({ brandHash, scamHash, brandName, hammingDistance }: Props) => {
  const similarity = Math.round((1 - hammingDistance / 64) * 100);
  const gaugePercent = (hammingDistance / 64) * 100;
  const gaugeColor = hammingDistance <= 10 ? 'bg-destructive' : hammingDistance <= 20 ? 'bg-warning' : 'bg-safe';

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold text-foreground mb-6 text-center">Visual Hash Comparison</h3>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mb-8">
        <HashGrid hash={brandHash} compHash={scamHash} label={`${brandName} (Original)`} />
        <div className="text-2xl text-muted-foreground">⟷</div>
        <HashGrid hash={scamHash} compHash={brandHash} label="Scam Site" />
      </div>

      {/* Hamming Distance Gauge */}
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>0 (Identical)</span>
          <span>64 (Unique)</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden relative">
          <div className={`h-full ${gaugeColor} rounded-full transition-all duration-1000`}
            style={{ width: `${gaugePercent}%` }} />
        </div>
        <div className="text-center mt-2 text-sm font-mono text-muted-foreground">
          Hamming Distance: <span className="text-foreground font-bold">{hammingDistance}</span> / 64 —{' '}
          <span className={hammingDistance <= 10 ? 'text-destructive' : hammingDistance <= 20 ? 'text-warning' : 'text-safe'}>
            {similarity}% match
          </span>
        </div>
      </div>
    </div>
  );
};

export default HashComparison;
