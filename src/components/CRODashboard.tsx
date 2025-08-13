import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  BarChart3, 
  Brain, 
  Upload, 
  TrendingUp,
  Users,
  Target,
  DollarSign,
  MessageSquare,
  FileText,
  Search,
  Zap
} from 'lucide-react';

export const CRODashboard = () => {
  const [businessDescription, setBusinessDescription] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleStartAnalysis = () => {
    if (!businessDescription.trim()) return;
    
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
    }, 3000);
  };

  const handleQuerySubmit = () => {
    if (!currentQuery.trim()) return;
    // Process intelligent query
  };

  const setSuggestedQuery = (type: string) => {
    const queries = {
      performance: "How does our cardiovascular trial enrollment compare to industry benchmarks, and what specific factors are affecting our performance?",
      competitive: "What competitive threats should we be aware of in our therapeutic areas, and how are other CROs positioning themselves?",
      enrollment: "Which of our sites are underperforming in patient enrollment and what evidence-based strategies can improve their performance?",
      financial: "What is our ROI by therapeutic area and how can we optimize resource allocation across current trials?",
      strategic: "Based on our current capabilities and market trends, what new therapeutic areas or service offerings should we consider?"
    };
    setCurrentQuery(queries[type as keyof typeof queries] || '');
  };

  const steps = [
    { icon: Upload, title: 'Upload Trial Data', desc: 'Import data via CSV, Excel, or manual entry' },
    { icon: MessageSquare, title: 'Describe Your Goals', desc: 'Tell AI about trials and objectives' },
    { icon: Brain, title: 'AI-Powered Analysis', desc: 'Enterprise analytics and insights' }
  ];

  const queryTypes = [
    { id: 'performance', label: 'Performance Analysis', icon: TrendingUp },
    { id: 'competitive', label: 'Competitive Intelligence', icon: Target },
    { id: 'enrollment', label: 'Enrollment Optimization', icon: Users },
    { id: 'financial', label: 'Financial Analysis', icon: DollarSign },
    { id: 'strategic', label: 'Strategic Planning', icon: Brain }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">CRO Intelligence Portal</h1>
              <p className="text-muted-foreground">Enterprise trial analytics with AI-powered competitive intelligence</p>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {steps.map((step, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Data Upload */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Trial Data Upload</span>
              </CardTitle>
              <CardDescription>Upload your trial data for comprehensive analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 border border-dashed border-border rounded-lg hover:border-primary transition-colors group text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                <h4 className="font-semibold mb-2">Upload Trial Data</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  CSV, Excel, JSON formats supported
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.json"
                  className="hidden"
                  id="cro-file-upload"
                />
                <label htmlFor="cro-file-upload">
                  <Button className="cursor-pointer" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Business Context */}
          <Card className="animate-slide-in-right">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Business Context</span>
              </CardTitle>
              <CardDescription>Describe your CRO business and analysis goals</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Example: We are a mid-size CRO specializing in oncology trials with 25 active studies across 150 sites. Main challenges include slow enrollment in our Phase III lung cancer trial and increasing competition from larger CROs..."
                rows={6}
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
              />
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                onClick={handleStartAnalysis}
                disabled={!businessDescription.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Start AI Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Processing State */}
        {isAnalyzing && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Brain className="w-8 h-8 text-green-500 animate-pulse" />
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Agent Analyzing Your CRO Business</h3>
              <p className="text-muted-foreground mb-4">
                Processing trial data, analyzing performance metrics, and generating competitive intelligence...
              </p>
              <div className="max-w-md mx-auto">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full animate-pulse w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Intelligent Query Interface */}
        {showResults && (
          <Card className="mb-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Intelligent Business Query System</span>
              </CardTitle>
              <CardDescription>
                Ask complex business questions for AI-powered insights and strategic recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Zap className="w-4 h-4" />
                <AlertDescription>
                  Our AI can analyze your data, compare with competitors, and provide strategic insights about performance, market opportunities, and competitive positioning.
                </AlertDescription>
              </Alert>

              <Textarea
                placeholder="Ask your business question here..."
                rows={4}
                value={currentQuery}
                onChange={(e) => setCurrentQuery(e.target.value)}
              />

              <div className="flex space-x-3">
                <Button 
                  onClick={handleQuerySubmit}
                  disabled={!currentQuery.trim()}
                  className="bg-gradient-to-r from-green-500 to-green-600"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze with AI
                </Button>
                <Button variant="outline" onClick={() => setCurrentQuery('')}>
                  Clear Query
                </Button>
              </div>

              {/* Suggested Queries */}
              <div>
                <h5 className="font-medium mb-3">💡 Suggested Analysis Areas:</h5>
                <div className="grid md:grid-cols-3 gap-2">
                  {queryTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setSuggestedQuery(type.id)}
                      className="justify-start"
                    >
                      <type.icon className="w-4 h-4 mr-2" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {showResults && (
          <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Business Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Enterprise Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Performance Insights</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start space-x-2">
                        <Badge className="bg-green-100 text-green-700 mt-0.5">Strong</Badge>
                        <span>Oncology enrollment rates 15% above industry average</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Badge className="bg-yellow-100 text-yellow-700 mt-0.5">Needs Attention</Badge>
                        <span>Site activation timeline slower than competitors</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <Badge className="bg-blue-100 text-blue-700 mt-0.5">Opportunity</Badge>
                        <span>Potential for expansion in rare disease trials</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competitive Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Competitive Intelligence</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Market Position</span>
                      <Badge className="bg-green-100 text-green-700">Tier 2 CRO</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Strong regional presence with specialized oncology expertise</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Key Differentiators</span>
                      <Badge className="bg-blue-100 text-blue-700">Competitive Advantage</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Faster startup times and specialized therapeutic focus</p>
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