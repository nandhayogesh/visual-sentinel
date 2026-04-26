import Navbar from '@/components/visualverifier/Navbar';
import HeroSection from '@/components/visualverifier/HeroSection';
import ScamPatterns from '@/components/visualverifier/ScamPatterns';
import FooterSection from '@/components/visualverifier/FooterSection';
const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <ScamPatterns />
    <FooterSection />
  </div>
);

export default Index;
