import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Analyzer', to: '/analyzer' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-background'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Visual<span className="text-primary italic">Verifier</span>
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-secondary rounded-full px-1.5 py-1.5">
          {navLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className={`nav-pill ${isActive(to) ? 'nav-pill-active' : 'nav-pill-inactive'}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* CTA — hidden on mobile */}
          <button
            onClick={() => navigate('/analyzer')}
            className="hidden md:inline-flex btn-primary text-sm px-5 py-2"
          >
            Try Analyzer
          </button>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center border border-border bg-secondary"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-sm px-4 py-4 flex flex-col gap-2">
          {navLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive(to)
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={() => { navigate('/analyzer'); setMobileOpen(false); }}
            className="mt-1 btn-primary text-sm px-5 py-2.5 w-full"
          >
            Try Analyzer
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
