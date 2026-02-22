import HeroSection from '@/components/visualverifier/HeroSection';
import HowItWorks from '@/components/visualverifier/HowItWorks';
import AnalyzerTool from '@/components/visualverifier/AnalyzerTool';
import DatabasePanel from '@/components/visualverifier/DatabasePanel';
import ScamPatterns from '@/components/visualverifier/ScamPatterns';
import StatsDashboard from '@/components/visualverifier/StatsDashboard';
import FooterSection from '@/components/visualverifier/FooterSection';

const Index = () => (
  <div className="min-h-screen bg-background">
    <HeroSection />
    <HowItWorks />
    <AnalyzerTool />
    <DatabasePanel />
    <ScamPatterns />
    <StatsDashboard />
    <FooterSection />
  </div>
);

export default Index;
