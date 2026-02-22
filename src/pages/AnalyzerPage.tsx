import Navbar from '@/components/visualverifier/Navbar';
import AnalyzerTool from '@/components/visualverifier/AnalyzerTool';
const AnalyzerPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-16">
      <AnalyzerTool />
    </div>
  </div>
);

export default AnalyzerPage;
