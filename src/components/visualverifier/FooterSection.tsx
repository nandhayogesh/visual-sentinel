import ShieldIcon from './ShieldIcon';

const FooterSection = () => (
  <footer className="border-t border-border py-12 px-4">
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <ShieldIcon className="w-6 h-6" />
            <span className="font-bold text-foreground">VisualVerifier</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Protecting users from visual deception, one hash at a time.
          </p>
        </div>

        <div className="flex gap-12">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Resources</div>
            <a href="#" className="block text-sm text-foreground hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="block text-sm text-foreground hover:text-primary transition-colors">API Reference</a>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Community</div>
            <a href="#" className="block text-sm text-foreground hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="block text-sm text-foreground hover:text-primary transition-colors">Report False Positive</a>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 mb-6">
        <p className="text-xs text-warning/80">
          ⚠️ This is a prototype simulation for academic/demonstration purposes. No real network requests,
          screenshot capture, or hash computation occurs. All analysis is simulated via JavaScript logic.
        </p>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VisualVerifier. All rights reserved.
      </div>
    </div>
  </footer>
);

export default FooterSection;
