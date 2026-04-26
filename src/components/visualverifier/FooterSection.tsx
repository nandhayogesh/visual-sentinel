const FooterSection = () => (
  <footer className="bg-card border-t border-border text-foreground py-16 px-4 sm:px-6">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-primary-foreground" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-base">VisualVerifier</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Protecting users from visual deception through perceptual hashing, reputation feeds, and explainable risk scoring.
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Resources</div>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">API Reference</a>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Community</div>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Report False Positive</a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground max-w-2xl">
          VisualVerifier correlates visual similarity, infrastructure reputation, and phishing feeds to produce explainable decisions for security teams.
        </p>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} VisualVerifier. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default FooterSection;
