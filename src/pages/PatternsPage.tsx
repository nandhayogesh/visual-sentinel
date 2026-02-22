import Navbar from '@/components/visualverifier/Navbar';
import ScamPatterns from '@/components/visualverifier/ScamPatterns';
const PatternsPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-16">
      <ScamPatterns />
    </div>
  </div>
);

export default PatternsPage;
