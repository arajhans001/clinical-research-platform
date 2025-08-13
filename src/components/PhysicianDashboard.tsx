import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  FileText, 
  Users, 
  Brain, 
  Stethoscope,
  Database,
  Search,
  RefreshCw,
  Download,
  ArrowRight
} from 'lucide-react';

export const PhysicianDashboard = () => {
  const [activeSection, setActiveSection] = useState<'upload' | 'patients' | 'analysis'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsAnalyzing(true);
      // Simulate processing
      setTimeout(() => {
        setIsAnalyzing(false);
        setActiveSection('patients');
      }, 2000);
    }
  };

  const steps = [
    { icon: Database, title: 'Connect Your Data', desc: 'Link EMR or upload patient files' },
    { icon: Brain, title: 'AI Analysis', desc: 'Automated patient-trial matching' },
    { icon: FileText, title: 'Generate Referrals', desc: 'Automated letters and materials' }
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Physician Intelligence Portal</h1>
              <p className="text-muted-foreground">AI-powered patient-trial matching with EMR integration</p>
            </div>
          </div>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {steps.map((step, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Data Integration */}
          <Card className="lg:col-span-2 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Patient Data Integration</span>
              </CardTitle>
              <CardDescription>
                Connect your EMR system or upload patient files for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* EMR Integration */}
              <div className="p-6 border border-dashed border-border rounded-lg hover:border-primary transition-colors">
                <h4 className="font-semibold mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-2 text-primary" />
                  EMR System Integration
                </h4>
                <div className="grid md:grid-cols-3 gap-3">
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <div className="w-8 h-8 bg-blue-500 rounded text-white flex items-center justify-center font-bold">E</div>
                    <span>Epic MyChart</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <div className="w-8 h-8 bg-green-500 rounded text-white flex items-center justify-center font-bold">C</div>
                    <span>Cerner</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <div className="w-8 h-8 bg-purple-500 rounded text-white flex items-center justify-center font-bold">A</div>
                    <span>Allscripts</span>
                  </Button>
                </div>
              </div>

              {/* File Upload */}
              <div className="p-6 border border-dashed border-border rounded-lg hover:border-primary transition-colors group">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                  <h4 className="font-semibold mb-2">Upload Patient Files</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports CSV, Excel, JSON, HL7 FHIR formats
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept=".csv,.xlsx,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button className="cursor-pointer" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Select Files
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Data Points */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h5 className="font-medium mb-3">📋 Recommended Patient Data Points:</h5>
                <div className="flex flex-wrap gap-2">
                  {['Patient ID', 'Age/DOB', 'Gender', 'Primary Diagnoses', 'Secondary Conditions', 'Current Medications', 'Lab Values', 'Allergies', 'Location', 'Insurance'].map((point) => (
                    <Badge key={point} variant="secondary" className="text-xs">
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Status */}
          <Card className="animate-slide-in-right">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>AI Analysis Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Brain className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium">Processing Patient Data</p>
                    <p className="text-sm text-muted-foreground">AI agent analyzing records...</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Brain className="w-4 h-4" />
                    <AlertDescription>
                      AI agent ready to analyze patient data and match with clinical trials
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Patients Loaded</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trials Matched</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Referrals Generated</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" disabled>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load All Patients
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient List Section */}
        {activeSection === 'patients' && (
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Patient Analysis & Trial Matching</span>
              </CardTitle>
              <div className="flex space-x-2 mt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search patients..."
                    className="w-full"
                  />
                </div>
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Batch Analysis
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No Patients Loaded</h3>
                <p className="text-muted-foreground mb-4">
                  Upload patient data or connect your EMR system to get started
                </p>
                <Button>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Upload Patient Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};