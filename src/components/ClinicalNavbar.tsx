import { StakeholderType } from '@/pages/Index';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

interface ClinicalNavbarProps {
  currentStakeholder: StakeholderType;
  aiActive: boolean;
  onStakeholderClick: () => void;
}

export const ClinicalNavbar = ({ 
  currentStakeholder, 
  aiActive, 
  onStakeholderClick 
}: ClinicalNavbarProps) => {
  const getStakeholderLabel = () => {
    switch (currentStakeholder) {
      case 'physician':
        return 'Physician Portal';
      case 'pharma':
        return 'Pharma Portal';
      case 'cro':
        return 'CRO Portal';
      default:
        return 'Select Your Role';
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <div className="w-4 h-4 rounded-sm bg-white"></div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Clinical Research Intel</h1>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  AI-Powered
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {/* AI Status */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-muted/50">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                aiActive ? 'bg-accent animate-pulse' : 'bg-muted-foreground'
              }`}></div>
              <span className="text-sm font-medium text-muted-foreground">
                AI Agent {aiActive ? 'Active' : 'Standby'}
              </span>
            </div>

            {/* Stakeholder Selector */}
            <Button 
              variant="outline" 
              onClick={onStakeholderClick}
              className="group hover:border-primary hover:shadow-md transition-all duration-300"
            >
              <span className="text-sm font-medium">{getStakeholderLabel()}</span>
              <ChevronDown className="ml-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};