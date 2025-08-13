import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Building2, 
  Brain, 
  FileText, 
  TrendingUp,
  Zap,
  Target,
  Calendar,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';

export const PharmaDashboard = () => {
  const [developmentPlan, setDevelopmentPlan] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleGeneratePlan = () => {
    if (!developmentPlan.trim()) return;
    
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false);
      setShowResults(true);
    }, 3000);
  };

  const steps = [
    { icon: FileText, title: 'Describe Your Drug', desc: 'Enter development plan in natural language' },
    { icon: Brain, title: 'AI Regulatory Assistant', desc: 'Automated forms and timeline planning' },
    { icon: TrendingUp, title: 'Competitive Intelligence', desc: 'AI-powered market analysis' }
  ];

  const regulatoryMilestones = [
    { phase: 'Preclinical', status: 'completed', date: 'Q2 2024' },
    { phase: 'IND Filing', status: 'current', date: 'Q4 2024' },
    { phase: 'Phase I', status: 'pending', date: 'Q2 2025' },
    { phase: 'Phase II', status: 'pending', date: 'Q1 2026' },
    { phase: 'Phase III', status: 'pending', date: 'Q3 2027' }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pharmaceutical Intelligence Portal</h1>
              <p className="text-muted-foreground">Complete AI-powered drug development pipeline with regulatory automation</p>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {steps.map((step, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Development Planner */}
        <Card className="mb-6 animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>AI Drug Development Planner</span>
            </CardTitle>
            <CardDescription>
              Describe your drug development project in detail for comprehensive AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Zap className="w-4 h-4" />
              <AlertDescription>
                Be as detailed as possible about your drug, therapeutic area, target indication, current stage, timeline goals, budget, and challenges.
              </AlertDescription>
            </Alert>

            <Textarea
              placeholder="Example: We are developing a novel PD-1 inhibitor for non-small cell lung cancer. Currently in preclinical stage with promising in-vitro results. Looking to enter Phase I by Q2 2026 with a $150M budget. Main challenge is differentiating from existing PD-1 inhibitors like Keytruda. We have exclusive licensing for combination with our proprietary biomarker platform. Target FDA breakthrough designation. Primary market is US with eventual EU expansion...

Describe your drug development project in detail here..."
              rows={8}
              value={developmentPlan}
              onChange={(e) => setDevelopmentPlan(e.target.value)}
              className="min-h-[200px]"
            />

            <div className="flex space-x-3">
              <Button 
                size="lg"
                onClick={handleGeneratePlan}
                disabled={!developmentPlan.trim() || isGenerating}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    AI Agent Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Generate AI Development Plan
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setDevelopmentPlan('')}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Processing State */}
        {isGenerating && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Brain className="w-8 h-8 text-purple-500 animate-pulse" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Agent Processing Your Plan</h3>
              <p className="text-muted-foreground mb-4">
                Analyzing development strategy, regulatory requirements, and competitive landscape...
              </p>
              <div className="max-w-md mx-auto">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-6 animate-fade-in">
            {/* Development Strategy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>AI-Generated Development Strategy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3">Strategic Recommendations</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <Badge className="bg-green-100 text-green-700 mt-0.5">High Priority</Badge>
                      <span>Focus on biomarker-driven patient selection for Phase I to differentiate from competitors</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Badge className="bg-blue-100 text-blue-700 mt-0.5">Medium Priority</Badge>
                      <span>Consider combination trial design with existing standard of care</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Badge className="bg-yellow-100 text-yellow-700 mt-0.5">Consider</Badge>
                      <span>Parallel track for breakthrough designation based on preliminary efficacy</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Regulatory Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Regulatory Timeline & Forms</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regulatoryMilestones.map((milestone, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className={`w-4 h-4 rounded-full ${
                        milestone.status === 'completed' ? 'bg-green-500' :
                        milestone.status === 'current' ? 'bg-blue-500 animate-pulse' :
                        'bg-muted-foreground'
                      }`}></div>
                      <div className="flex-1">
                        <h5 className="font-medium">{milestone.phase}</h5>
                        <p className="text-sm text-muted-foreground">Target: {milestone.date}</p>
                      </div>
                      <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                        {milestone.status}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-medium mb-3">📝 Automated Form Generation</h5>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      IND Application Template
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Protocol Synopsis
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Investigator Brochure
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Safety Monitoring Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitive Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>AI Competitive Intelligence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Key Competitors</h4>
                    <div className="space-y-3">
                      {['Keytruda (Pembrolizumab)', 'Opdivo (Nivolumab)', 'Tecentriq (Atezolizumab)'].map((competitor, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{competitor}</span>
                            <Badge className="bg-red-100 text-red-700">High Threat</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Market leader with established efficacy</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Market Opportunities</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">Biomarker-Driven Approach</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Opportunity for precision medicine differentiation</p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Combination Therapy</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Potential for novel combination approaches</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};