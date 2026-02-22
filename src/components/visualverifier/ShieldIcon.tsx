const ShieldIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4L8 16v16c0 14.4 10.24 27.84 24 32 13.76-4.16 24-17.6 24-32V16L32 4z"
      fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2.5"/>
    <path d="M22 32l7 7 13-14" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default ShieldIcon;
