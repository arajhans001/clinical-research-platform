import { useState, useEffect } from 'react';
import { ClinicalNavbar } from '@/components/ClinicalNavbar';
import { HeroSection } from '@/components/HeroSection';
import { StakeholderModal } from '@/components/StakeholderModal';
import { PhysicianDashboard } from '@/components/PhysicianDashboard';
import { PharmaDashboard } from '@/components/PharmaDashboard';
import { CRODashboard } from '@/components/CRODashboard';

export type StakeholderType = 'physician' | 'pharma' | 'cro' | null;

const Index = () => {
  const [currentStakeholder, setCurrentStakeholder] = useState<StakeholderType>(null);
  const [showModal, setShowModal] = useState(false);
  const [aiActive, setAiActive] = useState(true);

  useEffect(() => {
    // Simulate AI agent activity
    const interval = setInterval(() => {
      setAiActive(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStakeholderSelect = (stakeholder: StakeholderType) => {
    setCurrentStakeholder(stakeholder);
    setShowModal(false);
  };

  const renderDashboard = () => {
    switch (currentStakeholder) {
      case 'physician':
        return <PhysicianDashboard />;
      case 'pharma':
        return <PharmaDashboard />;
      case 'cro':
        return <CRODashboard />;
      default:
        return <HeroSection onGetStarted={() => setShowModal(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ClinicalNavbar 
        currentStakeholder={currentStakeholder}
        aiActive={aiActive}
        onStakeholderClick={() => setShowModal(true)}
      />
      
      <main className="transition-all duration-slow">
        {renderDashboard()}
      </main>

      <StakeholderModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleStakeholderSelect}
      />
    </div>
  );
};

export default Index;
