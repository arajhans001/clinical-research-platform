import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Brain, Database, Shield, Zap, Users, TrendingUp } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const [animatedStats, setAnimatedStats] = useState({
    trials: 0,
    patients: 0,
    sites: 0,
    success: 0
  });

  useEffect(() => {
    const targetStats = {
      trials: 15000,
      patients: 2500000,
      sites: 8500,
      success: 94
    };

    const duration = 2000;
    const interval = 50;
    const steps = duration / interval;

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        trials: Math.floor(targetStats.trials * easeOut),
        patients: Math.floor(targetStats.patients * easeOut),
        sites: Math.floor(targetStats.sites * easeOut),
        success: Math.floor(targetStats.success * easeOut)
      });

      if (progress >= 1) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI Agents',
      description: 'Intelligent automation for every clinical workflow'
    },
    {
      icon: Database,
      title: 'Real-Time Data',
      description: 'Live integration with clinical databases and EMR systems'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'HIPAA compliant data handling and processing'
    }
  ];

  const stats = [
    { label: 'Clinical Trials', value: animatedStats.trials.toLocaleString(), suffix: '+' },
    { label: 'Patients Matched', value: animatedStats.patients.toLocaleString(), suffix: '+' },
    { label: 'Active Sites', value: animatedStats.sites.toLocaleString(), suffix: '+' },
    { label: 'Success Rate', value: animatedStats.success, suffix: '%' }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>

      {/* Hero Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-4 h-4 mr-2" />
            AI-Powered Clinical Research Intelligence
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in-up">
            Transform Clinical{' '}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Research
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed animate-fade-in-up">
            Enterprise-grade platform with intelligent agents for real-time analysis, 
            patient matching, and decision support for hospitals and research organizations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in-up">
            <Button 
              size="lg"
              onClick={onGetStarted}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300 transform hover:scale-105 text-lg px-8 py-4"
            >
              Start Your Analysis
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="hover:border-primary hover:shadow-md transition-all duration-300 text-lg px-8 py-4"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {stats.map((stat, index) => (
              <Card key={stat.label} className="p-6 text-center border-0 bg-gradient-card hover:shadow-lg transition-all duration-300 animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={feature.title} className="p-8 text-center group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-card animate-fade-in-up" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 opacity-20">
        <Users className="w-8 h-8 text-primary animate-float" />
      </div>
      <div className="absolute top-40 right-10 opacity-20">
        <TrendingUp className="w-8 h-8 text-accent animate-float" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
};