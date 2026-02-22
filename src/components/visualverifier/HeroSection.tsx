import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden bg-background">
      {/* Subtle background shapes */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.18) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(82 100% 62% / 0.25) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
          {/* Left: Headline */}
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tight leading-[1.05] mb-4 sm:mb-6">
              Detect Visual
              <span className="block">
                <span className="text-primary">Impersonation</span>
              </span>
              <span className="block">Scams Instantly</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8 max-w-xl">
              Analyze any link for visual impersonation, phishing, and suspicious patterns.
              Powered by perceptual hashing and AI-driven URL analysis.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <button
                onClick={() => navigate('/analyzer')}
                className="btn-accent text-base px-8 py-3.5 w-full sm:w-auto justify-center"
              >
                Analyze a Link
              </button>
              <button
                onClick={() => navigate('/how-it-works')}
                className="btn-outline text-base px-8 py-3.5 w-full sm:w-auto justify-center"
              >
                How It Works
              </button>
            </div>
          </div>

          {/* Right: Illustration — hidden on small screens */}
          <div className="hidden sm:flex flex-shrink-0 lg:w-[420px] items-center justify-center">
            <svg viewBox="0 0 420 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-md drop-shadow-xl">
              {/* Browser window card */}
              <rect x="20" y="20" width="380" height="260" rx="18" fill="white" stroke="#e4e4e7" strokeWidth="1.5"/>
              {/* Title bar */}
              <rect x="20" y="20" width="380" height="44" rx="18" fill="hsl(262,83%,58%)"/>
              <rect x="20" y="44" width="380" height="20" fill="hsl(262,83%,58%)"/>
              {/* Traffic lights */}
              <circle cx="50" cy="42" r="6" fill="#ff5f57"/>
              <circle cx="70" cy="42" r="6" fill="#febc2e"/>
              <circle cx="90" cy="42" r="6" fill="#28c840"/>
              {/* URL bar */}
              <rect x="110" y="30" width="250" height="24" rx="12" fill="white" opacity="0.18"/>
              <text x="185" y="46" fill="white" fontSize="11" fontFamily="monospace" opacity="0.9">https://suspicious-login.xyz</text>
              {/* URL bar area below title */}
              <rect x="36" y="82" width="348" height="36" rx="10" fill="#f4f4f5"/>
              <circle cx="54" cy="100" r="8" fill="none" stroke="hsl(262,83%,58%)" strokeWidth="2"/>
              <line x1="59" y1="105" x2="64" y2="110" stroke="hsl(262,83%,58%)" strokeWidth="2" strokeLinecap="round"/>
              <text x="72" y="104" fill="#71717a" fontSize="11" fontFamily="monospace">https://secure-login-verify.xyz/account</text>
              {/* Scan lines / analysis grid */}
              <rect x="36" y="134" width="348" height="4" rx="2" fill="hsl(82,100%,62%)" opacity="0.5"/>
              <rect x="36" y="146" width="280" height="3" rx="1.5" fill="#e4e4e7"/>
              <rect x="36" y="156" width="220" height="3" rx="1.5" fill="#e4e4e7"/>
              <rect x="36" y="166" width="300" height="3" rx="1.5" fill="#e4e4e7"/>
              <rect x="36" y="176" width="160" height="3" rx="1.5" fill="#e4e4e7"/>
              {/* Scan beam animation area */}
              <rect x="36" y="130" width="348" height="80" rx="8" fill="hsl(82,100%,62%)" opacity="0.05"/>
              {/* Warning badge */}
              <rect x="260" y="148" width="120" height="28" rx="8" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1"/>
              <circle cx="275" cy="162" r="5" fill="#ef4444"/>
              <text x="283" y="166" fill="#dc2626" fontSize="10" fontWeight="bold">High Risk</text>
              {/* Hash rows */}
              <rect x="36" y="220" width="348" height="42" rx="8" fill="#fafafa" stroke="#e4e4e7" strokeWidth="1"/>
              <text x="48" y="236" fill="#a1a1aa" fontSize="9" fontFamily="monospace">HASH A</text>
              <rect x="96" y="227" width="120" height="8" rx="4" fill="hsl(262,83%,58%)" opacity="0.3"/>
              <text x="48" y="254" fill="#a1a1aa" fontSize="9" fontFamily="monospace">HASH B</text>
              <rect x="96" y="245" width="100" height="8" rx="4" fill="hsl(82,100%,62%)" opacity="0.5"/>
              <text x="230" y="247" fill="#ef4444" fontSize="9" fontWeight="bold">≠ MISMATCH</text>

              {/* Shield icon — bottom right */}
              <g transform="translate(295, 270)">
                <path d="M60 8 L100 22 L100 62 C100 84 80 98 60 106 C40 98 20 84 20 62 L20 22 Z" fill="hsl(262,83%,58%)" opacity="0.12"/>
                <path d="M60 14 L94 26 L94 62 C94 81 77 94 60 101 C43 94 26 81 26 62 L26 26 Z" fill="hsl(262,83%,58%)" opacity="0.22"/>
                <path d="M60 20 L88 30 L88 62 C88 78 74 90 60 96 C46 90 32 78 32 62 L32 30 Z" fill="hsl(262,83%,58%)"/>
                <polyline points="47,60 57,70 75,50" stroke="hsl(82,100%,62%)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </g>

              {/* Floating lime tag top-right */}
              <rect x="310" y="8" width="90" height="26" rx="13" fill="hsl(82,100%,62%)"/>
              <text x="325" y="25" fill="#1a1a2e" fontSize="11" fontWeight="bold">AI Powered</text>

              {/* Bottom decorative dots */}
              <circle cx="60" cy="350" r="5" fill="hsl(262,83%,58%)" opacity="0.4"/>
              <circle cx="80" cy="350" r="5" fill="hsl(82,100%,62%)" opacity="0.5"/>
              <circle cx="100" cy="350" r="5" fill="hsl(262,83%,58%)" opacity="0.25"/>
              <circle cx="340" cy="350" r="5" fill="hsl(82,100%,62%)" opacity="0.3"/>
              <circle cx="360" cy="350" r="5" fill="hsl(262,83%,58%)" opacity="0.4"/>
              <circle cx="380" cy="350" r="5" fill="hsl(82,100%,62%)" opacity="0.2"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
