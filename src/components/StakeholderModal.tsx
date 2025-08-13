import { StakeholderType } from '@/pages/Index';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Stethoscope, Building2, BarChart3, ArrowRight } from 'lucide-react';

interface StakeholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (stakeholder: StakeholderType) => void;
}

const stakeholders = [
  {
    id: 'physician' as const,
    icon: Stethoscope,
    title: 'Physicians & Clinical Practitioners',
    description: 'AI-powered EMR integration, intelligent patient-trial matching, and automated referral generation',
    features: ['EMR Integration', 'AI Matching', 'Auto Referrals'],
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100'
  },
  {
    id: 'pharma' as const,
    icon: Building2,
    title: 'Pharmaceutical Companies',
    description: 'Complete drug development pipeline, AI regulatory assistant, and intelligent competitive analysis',
    features: ['Development AI', 'Regulatory Forms', 'Competitive Intel'],
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100'
  },
  {
    id: 'cro' as const,
    icon: BarChart3,
    title: 'Clinical Research Organizations',
    description: 'Enterprise trial analytics, AI-powered competitive intelligence, and intelligent query processing',
    features: ['Trial Analytics', 'AI Queries', 'Competitive Analysis'],
    gradient: 'from-green-500 to-green-600',
    bgGradient: 'from-green-50 to-green-100'
  }
];

export const StakeholderModal = ({ isOpen, onClose, onSelect }: StakeholderModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Select Your Professional Role
          </DialogTitle>
          <p className="text-muted-foreground text-center">
            Choose your role to access specialized AI-powered tools and insights
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {stakeholders.map((stakeholder, index) => (
            <Card 
              key={stakeholder.id}
              className={`p-6 group cursor-pointer border-2 hover:border-primary transition-all duration-300 hover:shadow-xl animate-scale-in bg-gradient-to-br ${stakeholder.bgGradient}`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onSelect(stakeholder.id)}
            >
              <div className="text-center space-y-4">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${stakeholder.gradient} group-hover:scale-110 transition-transform duration-300`}>
                  <stakeholder.icon className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {stakeholder.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stakeholder.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {stakeholder.features.map((feature) => (
                    <span 
                      key={feature}
                      className="px-3 py-1 bg-white/70 text-xs font-medium rounded-full text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA Button */}
                <Button 
                  className={`w-full group-hover:scale-105 transition-all duration-300 bg-gradient-to-r ${stakeholder.gradient} hover:shadow-lg`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(stakeholder.id);
                  }}
                >
                  Enter {stakeholder.title.split(' ')[0]} Portal
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Tip:</strong> You can switch between portals at any time using the navigation menu
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};