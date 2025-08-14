// src/components/PhysicianDashboard.tsx
import { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import {
  Upload, FileText, Users, Brain, Stethoscope,
  Database, Search, RefreshCw, ArrowRight, ExternalLink, FileSignature, Clipboard, Download
} from 'lucide-react';

import {
  AnalysisEngine, ClinicalTrialsClient, ContentGenerator, Patient, PerplexityClient, Trial
} from '@/lib/aiAgents';

const DEV_DIRECT = false; // temporary local only
const PPLX_API_URL = '/api/perplexity';

const pplxClient = new PerplexityClient({
  apiUrl: PPLX_API_URL,
  model: 'sonar',
  apiKey: DEV_DIRECT ? (globalThis as any)?.window?.__CRP_PPLX_KEY : undefined,
});
const trialsClient = new ClinicalTrialsClient();
const engine = new AnalysisEngine(pplxClient, trialsClient);
const contentGen = new ContentGenerator(pplxClient);

// ====== CSV helper (minimal quotes support) ======
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return [];
  const hdr = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals: string[] = [];
    let cur = '', q = false;
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') q = !q;
      else if (c === ',' && !q) { vals.push(cur); cur = ''; }
      else cur += c;
    }
    vals.push(cur);
    const rec: Record<string, string> = {};
    hdr.forEach((h, idx) => rec[h] = (vals[idx] || '').trim());
    rows.push(rec);
  }
  return rows;
}

// normalize a CSV record into our Patient type
function toPatient(rec: Record<string, string>): Patient {
  const first = rec.first_name || rec.firstname || rec.fname || '';
  const last = rec.last_name || rec.lastname || rec.lname || '';
  const name = rec.name || rec.patient_name || rec.full_name || `${first} ${last}`.trim() || 'Unknown Patient';

  const ageStr = rec.age || rec.patient_age || rec.current_age || rec.age_years || rec.years_old || '';
  const age = ageStr ? Number.parseInt(ageStr, 10) : null;
  const genderRaw = (rec.gender || rec.sex || '').toLowerCase();
  const gender = ['male','m','man'].includes(genderRaw) ? 'Male' :
                 ['female','f','woman'].includes(genderRaw) ? 'Female' :
                 genderRaw ? genderRaw : '';

  const pick = (...keys: string[]) => keys.map(k => rec[k]).find(Boolean) || '';

  const primaryDiagnosis = pick('primary_diagnosis','primarydiagnosis','main_diagnosis','diagnosis','condition','primary_condition');
  const conds = (rec.secondary_conditions || rec.conditions || rec.comorbidities || rec.medical_history || '')
    .split(/[,;|\n]/).map(s => s.trim()).filter(Boolean);
  const meds = (rec.current_medications || rec.medications || rec.drugs || '')
    .split(/[,;|\n]/).map(s => s.trim()).filter(Boolean);
  const location = pick('location','address','city','state','zip','zip_code','zipcode','postal_code','region','patient_location');
  const insurance = pick('insurance','insurance_provider','health_insurance','payer','insurance_company','coverage');

  const id = (rec.id || rec.patient_id || rec.patientid || rec.mrn || rec.case_id || `PAT-${Date.now()}-${Math.random().toString(36).slice(2,7)}`).toString();

  return {
    id, name, age: Number.isFinite(age!) ? age! : null, gender,
    primaryDiagnosis,
    conditions: Array.from(new Set(conds)),
    medications: Array.from(new Set(meds)),
    location,
    insurance,
  };
}

export const PhysicianDashboard = () => {
  const [activeSection, setActiveSection] = useState<'upload' | 'patients' | 'analysis'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);

  const [progressText, setProgressText] = useState<string>('');
  const [analysisText, setAnalysisText] = useState<string>('');
  const [matches, setMatches] = useState<Trial[]>([]);
  const [matchReason, setMatchReason] = useState<string>('');
  const [referralPreview, setReferralPreview] = useState<string>('');
  const [referralFor, setReferralFor] = useState<{patient?: Patient; trial?: Trial} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = useMemo(() => ([
    { icon: Database, title: 'Connect Your Data', desc: 'Link EMR or upload patient files' },
    { icon: Brain, title: 'AI Analysis', desc: 'Automated patient-trial matching' },
    { icon: FileText, title: 'Generate Referrals', desc: 'Automated letters and materials' }
  ]), []);

  // ====== Upload & parse (NO auto analysis) ======
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsAnalyzing(true);
    try {
      const all: Patient[] = [];
      for (const file of Array.from(files)) {
        const text = await file.text();
        const rows = parseCSV(text);
        const pts = rows.map(toPatient);
        all.push(...pts);
      }
      setPatients(all);
      setActiveSection('patients');
    } catch (err) {
      console.error(err);
      alert('Failed to parse file(s). Make sure they are CSV with headers.');
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ====== Analyze a single patient when clicked ======
  const analyzePatient = async (p: Patient) => {
    setSelected(p);
    setActiveSection('analysis');
    setProgressText('Retrieving patient-specific trials…');
    setAnalysisText('');
    setMatches([]);
    setMatchReason('');
    setReferralPreview('');
    setReferralFor(null);

    try {
      const { analysis, matches } = await engine.run(p);
      setProgressText('AI clinical analysis complete. Ranking trials…');
      setAnalysisText(analysis.eligibilityAssessment);
      setMatchReason(matches.matchingAnalysis);
      setMatches(matches.trials);
      setProgressText('Analysis complete.');
    } catch (err: any) {
      console.error(err);
      const msg = String(err?.message || err);
      if (/No clinical trials found/i.test(msg)) {
        setProgressText('No matching trials found for this patient.');
        setAnalysisText('');
        setMatches([]);
      } else if (/temporarily unavailable/i.test(msg)) {
        setProgressText('ClinicalTrials.gov temporarily unavailable.');
      } else {
        setProgressText(`Analysis error: ${msg}`);
      }
    }
  };

  const generateReferral = async (trial: Trial) => {
    if (!selected) return;
    setReferralFor({ patient: selected, trial });
    setReferralPreview('Generating referral letter…');
    try {
      const letter = await contentGen.referralLetter(selected, trial, {
        eligibilityAssessment: analysisText,
        timestamp: new Date(),
        patientId: selected.id,
        dataSource: 'Evidence-based medical analysis',
      });
      setReferralPreview(letter);
    } catch (e) {
      setReferralPreview('Unable to generate referral letter in this environment.');
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard.');
    } catch {
      alert('Copy failed. Select and copy manually.');
    }
  };

  const downloadText = (text: string, filename: string) => {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed.');
    }
  };

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
              <CardDescription>Connect your EMR system or upload patient files for AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* EMR Integration (UI only for now) */}
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
              <div className="p-6 border border-dashed border-border rounded-lg hover:border-primary transition-colors group text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                <h4 className="font-semibold mb-2">Upload Patient Files</h4>
                <p className="text-sm text-muted-foreground mb-4">Supports CSV (recommended)</p>

                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button className="cursor-pointer" asChild>
                    <span><Upload className="w-4 h-4 mr-2" /> Select Files</span>
                  </Button>
                </label>

                <div className="bg-muted/50 p-4 rounded-lg mt-6 text-left">
                  <h5 className="font-medium mb-3">📋 Recommended Patient Data Points:</h5>
                  <div className="flex flex-wrap gap-2">
                    {['Patient ID','Age/DOB','Gender','Primary Diagnoses','Secondary Conditions','Current Medications','Location','Insurance'].map((point) => (
                      <Badge key={point} variant="secondary" className="text-xs">{point}</Badge>
                    ))}
                  </div>
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
                    <p className="text-sm text-muted-foreground">Preparing records…</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <Brain className="w-4 h-4" />
                    <AlertDescription>
                      Select a patient below to analyze and match clinical trials.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Patients Loaded</span>
                      <span className="font-medium">{patients.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current View</span>
                      <span className="font-medium capitalize">{activeSection}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setActiveSection('patients')} disabled={!patients.length}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load All Patients
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Patient List */}
        {activeSection === 'patients' && (
          <Card className="mt-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Patient Analysis & Trial Matching</span>
              </CardTitle>
              <div className="flex space-x-2 mt-4">
                <div className="flex-1">
                  <Input placeholder="Search patients..." className="w-full" />
                </div>
                <Button><Search className="w-4 h-4 mr-2" />Search</Button>
                <Button variant="outline" disabled>
                  <Brain className="w-4 h-4 mr-2" />
                  AI Batch Analysis (off)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!patients.length ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Patients Loaded</h3>
                  <p className="text-muted-foreground mb-4">Upload patient data or connect your EMR system to get started</p>
                  <Button onClick={() => document.getElementById('file-upload')?.click()}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Upload Patient Data
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients.map(p => (
                    <div key={p.id} className="rounded-xl border p-4 bg-card/50 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.age ? `${p.age}y` : 'Age ?'} · {p.gender || 'Gender ?'}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{p.location || 'Location ?'}</div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Primary Dx:</span>{' '}
                          {p.primaryDiagnosis || <span className="text-muted-foreground">Not specified</span>}
                        </div>

                        {p.conditions.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Conditions:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {p.conditions.slice(0,5).map((c, i) => (
                                <Badge key={c + i} variant="secondary" className="text-[10px]">{c}</Badge>
                              ))}
                              {p.conditions.length > 5 && (
                                <Badge variant="outline" className="text-[10px]">+{p.conditions.length - 5} more</Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {p.medications.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Meds:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {p.medications.slice(0,5).map((m, i) => (
                                <Badge key={m + i} variant="secondary" className="text-[10px]">{m}</Badge>
                              ))}
                              {p.medications.length > 5 && (
                                <Badge variant="outline" className="text-[10px]">+{p.medications.length - 5} more</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <Button className="w-full" onClick={() => analyzePatient(p)}>
                          <Brain className="w-4 h-4 mr-2" />
                          Analyze & Match
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Analysis View */}
        {activeSection === 'analysis' && selected && (
          <div className="mt-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Selected patient:</span> {selected.name} · {selected.age ?? 'NA'}y · {selected.gender || 'NA'}
              </div>
              <Button variant="outline" onClick={() => setActiveSection('patients')}>Back to Patients</Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Analysis Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width:
                          progressText.includes('Retrieving') ? '25%' :
                          progressText.includes('complete') && matches.length === 0 ? '75%' :
                          progressText.includes('complete') && matches.length > 0 ? '100%' :
                          progressText.includes('error') ? '100%' : '40%'
                      }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">{progressText || 'Working…'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Clinical Analysis Summary */}
            {analysisText && (
              <Card>
                <CardHeader>
                  <CardTitle>Clinical Assessment</CardTitle>
                  <CardDescription>Evidence-based eligibility & considerations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {analysisText}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Matches */}
            <Card>
              <CardHeader>
                <CardTitle>Top Trial Matches</CardTitle>
                <CardDescription>
                  Ranked options from ClinicalTrials.gov (top 10).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!matches.length ? (
                  <Alert>
                    <AlertDescription>No trials to display yet.</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {matches.map((t, idx) => (
                      <div key={t.nctId} className={`rounded-xl border p-4 ${idx < 3 ? 'bg-primary/5' : 'bg-card/50'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold">#{idx + 1}</span>
                              <span className="text-xs rounded-full px-2 py-0.5 bg-primary text-primary-foreground">
                                {t.matchScore}% Match
                              </span>
                              <span className="text-[11px] text-muted-foreground">Phase {t.phase} · {t.status}</span>
                            </div>
                            <div className="font-semibold">{t.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.nctId} · {t.sponsor}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Condition:</span> {t.condition}
                            </div>
                            {!!t.locations?.length && (
                              <div className="text-sm">
                                <span className="font-medium">Locations:</span> {t.locations.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 min-w-[220px]">
                            <Button variant="outline" onClick={() => window.open(`https://clinicaltrials.gov/study/${t.nctId}`, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View on ClinicalTrials.gov
                            </Button>
                            <Button onClick={() => generateReferral(t)}>
                              <FileSignature className="w-4 h-4 mr-2" />
                              Generate Referral
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {matchReason && (
                  <div className="mt-6">
                    <div className="text-sm font-medium mb-2">AI Matching Notes</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{matchReason}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referral Preview */}
            {referralFor?.trial && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5" />
                    Referral Letter Preview
                  </CardTitle>
                  <CardDescription>
                    Patient: <span className="font-medium">{referralFor.patient?.name}</span> · Trial:{' '}
                    <span className="font-medium">{referralFor.trial.title} ({referralFor.trial.nctId})</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border bg-muted/40 p-3 max-h-[320px] overflow-auto whitespace-pre-wrap text-sm">
                    {referralPreview || 'Generating…'}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" onClick={() => copyText(referralPreview)} disabled={!referralPreview}>
                      <Clipboard className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button variant="outline" onClick={() => downloadText(referralPreview, `referral-${(selected?.name || 'patient').replace(/\s+/g,'_')}-${referralFor.trial?.nctId}.txt`)} disabled={!referralPreview}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
