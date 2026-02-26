import type { Screenshots, BrandInfo } from '@/types/analysis';

interface Props {
  screenshots: Screenshots;
  brand: BrandInfo;
  suspiciousDomain: string;
}

const ScreenshotComparison = ({ screenshots, brand, suspiciousDomain }: Props) => {
  const hasAnyScreenshot = screenshots.suspicious || screenshots.official;

  if (!hasAnyScreenshot) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-foreground text-base mb-1">Visual Comparison</h3>
        <p className="text-sm text-muted-foreground">Screenshots are not available for this site.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-foreground text-base mb-1">Visual Comparison</h3>
      <p className="text-xs text-muted-foreground mb-5">
        Side-by-side rendering of the suspicious site vs the official site.
        {brand.isImpersonation && brand.name && ` The suspicious domain is impersonating ${brand.name}.`}
      </p>

      <div className={`grid gap-4 ${screenshots.official ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Suspicious site */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
            <span className="text-xs font-semibold text-destructive uppercase tracking-wide">Suspicious Site</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono mb-2 truncate">{suspiciousDomain}</p>
          {screenshots.suspicious ? (
            <div className="relative rounded-xl overflow-hidden border border-destructive/30 bg-secondary">
              <img
                src={screenshots.suspicious}
                alt={`Screenshot of suspicious site: ${suspiciousDomain}`}
                className="w-full object-cover object-top"
                style={{ maxHeight: '280px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden p-8 text-center text-xs text-muted-foreground">
                Screenshot not yet available
              </div>
              <div className="absolute top-2 right-2 bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full">
                SUSPICIOUS
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-secondary flex items-center justify-center p-8 text-xs text-muted-foreground" style={{ minHeight: '160px' }}>
              Screenshot unavailable
            </div>
          )}
        </div>

        {/* Official site (only shown when brand impersonation detected) */}
        {screenshots.official && brand.name && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-safe flex-shrink-0" />
              <span className="text-xs font-semibold text-safe uppercase tracking-wide">Official Site</span>
            </div>
            <p className="text-xs text-muted-foreground font-mono mb-2 truncate">{brand.officialUrl}</p>
            <div className="relative rounded-xl overflow-hidden border border-safe/30 bg-secondary">
              <img
                src={screenshots.official}
                alt={`Screenshot of official ${brand.name} site`}
                className="w-full object-cover object-top"
                style={{ maxHeight: '280px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden p-8 text-center text-xs text-muted-foreground">
                Screenshot not yet available
              </div>
              <div className="absolute top-2 right-2 bg-safe text-white text-xs font-bold px-2 py-0.5 rounded-full">
                OFFICIAL
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Screenshots provided by{' '}
        <a href="https://urlscan.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          URLScan.io
        </a>
      </p>
    </div>
  );
};

export default ScreenshotComparison;
