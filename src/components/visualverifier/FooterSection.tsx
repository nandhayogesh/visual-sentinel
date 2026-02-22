const FooterSection = () => (
  <footer className="bg-foreground text-white py-16 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12 mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-base">VisualVerifier</span>
          </div>
          <p className="text-sm text-white/50 max-w-xs leading-relaxed">
            Protecting users from visual deception through perceptual hashing and intelligent pattern recognition.
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Resources</div>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Documentation</a>
              <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">API Reference</a>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Community</div>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">GitHub</a>
              <a href="#" className="block text-sm text-white/70 hover:text-white transition-colors">Report False Positive</a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="text-xs text-white/35">
          Prototype for academic/demonstration purposes. No real network requests or hash computation occurs.
        </p>
        <p className="text-xs text-white/35">
          &copy; {new Date().getFullYear()} VisualVerifier. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default FooterSection;
