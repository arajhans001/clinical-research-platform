// src/lib/aiAgents.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Patient = {
    id: string;
    name: string;
    age?: number | null;
    gender?: string;
    primaryDiagnosis?: string;
    conditions: string[];
    medications: string[];
    location?: string;
    insurance?: string;
  };
  
  export type Trial = {
    nctId: string;
    title: string;
    status: string;
    phase: string;
    sponsor: string;
    condition: string;
    locations: string[];
    contact?: string;
    eligibility?: string;
    lastUpdated?: string;
    searchTermUsed?: string;
    matchScore?: number;
    aiRecommendation?: string;
    dataSource: 'ClinicalTrials.gov';
  };
  
  export type ClinicalAnalysis = {
    eligibilityAssessment: string;
    timestamp: Date;
    patientId: string;
    dataSource: string;
  };
  
  export type MatchingResults = {
    trials: Trial[];
    matchingAnalysis: string;
    totalFound: number;
    timestamp: Date;
    dataSource: string;
  };
  
  type PerplexityConfig = {
    apiKey?: string;
    apiUrl: string; // /api/pplx (proxy) OR https://api.perplexity.ai/chat/completions
    model: string;
  };
  
  const CLINICAL_API = 'https://clinicaltrials.gov/api/v2/studies';
  
  export class PerplexityClient {
    constructor(private cfg: PerplexityConfig) {}
  
    private get key(): string | undefined {
      // Prefer explicit config; fallback to window for dev
      return this.cfg.apiKey || (globalThis as any)?.window?.__CRP_PPLX_KEY;
    }
  
    async chat(prompt: string, max_tokens = 2000, temperature = 0.7): Promise<string> {
      const body = {
        model: this.cfg.model || 'sonar',
        messages: [{ role: 'user', content: prompt }],
        max_tokens,
        temperature,
      };
  
      // If you’re using a server proxy (/api/pplx), no key is needed here.
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (this.cfg.apiUrl.includes('perplexity.ai')) {
        // direct upstream requires key on client (DEV ONLY)
        if (!this.key) throw new Error('Missing Perplexity API key');
        headers.Authorization = `Bearer ${this.key}`;
      }
  
      const r = await fetch(this.cfg.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
  
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        throw new Error(`Perplexity error ${r.status}: ${t || r.statusText}`);
      }
  
      const data = await r.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Invalid Perplexity response structure');
      return content as string;
    }
  }
  
  export class ClinicalTrialsClient {
    async searchPatientSpecificTrials(patient: Patient): Promise<Trial[]> {
      if (!patient.primaryDiagnosis && (!patient.conditions || patient.conditions.length === 0)) {
        throw new Error('Patient diagnosis required for clinical trial search');
      }
  
      const terms = this.buildPatientSpecificSearchTerms(patient);
      const all: Trial[] = [];
  
      for (const term of terms) {
        const chunk = await this.searchForTerm(term, patient);
        all.push(...chunk);
      }
  
      const unique = this.removeDupes(all);
      const relevant = this.validateRelevance(unique, patient);
      if (relevant.length === 0) throw new Error('No clinical trials found matching patient criteria');
      return relevant;
    }
  
    private buildPatientSpecificSearchTerms(patient: Patient): string[] {
      const results: string[] = [];
      const push = (s?: string) => s && s.trim() && results.push(s.trim());
  
      push(patient.primaryDiagnosis);
      if (patient.primaryDiagnosis) {
        const words = patient.primaryDiagnosis.toLowerCase().split(/\s+/);
        for (const w of words) if (w.length > 3 && this.isMedicalWord(w)) results.push(w);
      }
      if (patient.conditions?.length) {
        for (const c of patient.conditions) push(c);
      }
      return [...new Set(results)].slice(0, 5);
    }
  
    private isMedicalWord(w: string): boolean {
      const kws = [
        'disease','syndrome','disorder','cancer','tumor','carcinoma',
        'diabetes','hypertension','copd','asthma','pneumonia',
        'cardio','cardiac','pulmonary','respiratory',
        'neurolog','psychiatr','rheumatoid','arthritis',
        'infect','inflamm','chronic','acute'
      ];
      return kws.some(k => w.includes(k));
    }
  
    private async searchForTerm(term: string, patient: Patient): Promise<Trial[]> {
      const params = new URLSearchParams();
      params.append('format', 'json');
      params.append('pageSize', '15');
      params.append('countTotal', 'true');
      params.append('query.cond', term);
      params.append('filter.overallStatus', 'RECRUITING,NOT_YET_RECRUITING');
  
      // Optional coarse geo filter based on "City, ST" or "ST"
      if (patient.location && patient.location.includes(',')) {
        const parts = patient.location.split(',');
        const state = parts[parts.length - 1].trim();
        if (/^[A-Z]{2}$/i.test(state)) {
          // API supports geo, but their syntax is limited; keep it simple
          params.append('filter.geo', `distance(50,${state})`);
        }
      }
  
      const url = `${CLINICAL_API}?${params.toString()}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('Clinical trials database temporarily unavailable');
      const data = await r.json();
  
      const studies = data?.studies || [];
      return this.toTrials(studies, term);
    }
  
    private toTrials(studies: any[], term: string): Trial[] {
      return studies.map((s: any) => {
        const proto = s.protocolSection || {};
        const id = proto.identificationModule || {};
        const status = proto.statusModule || {};
        const design = proto.designModule || {};
        const sponsor = proto.sponsorCollaboratorsModule || {};
        const conds = proto.conditionsModule || {};
        const locs = proto.contactsLocationsModule?.locations || [];
        const contacts = proto.contactsLocationsModule?.centralContacts || [];
        return {
          nctId: id.nctId || 'Unknown',
          title: id.briefTitle || 'Clinical Research Study',
          status: status.overallStatus || 'Unknown',
          phase: (design.phases && design.phases[0]) || 'N/A',
          sponsor: sponsor.leadSponsor?.name || 'Research Institution',
          condition: (conds.conditions && conds.conditions[0]) || term,
          locations: locs.map((l: any) => `${l.city}, ${l.state || l.country}`).filter(Boolean).slice(0, 3),
          contact: contacts?.[0] ? `${contacts[0].name} - ${contacts[0].phone || contacts[0].email || 'Contact via ClinicalTrials.gov'}` : undefined,
          eligibility: proto.eligibilityModule?.eligibilityCriteria || 'See ClinicalTrials.gov for detailed eligibility criteria',
          lastUpdated: status.statusVerifiedDate || new Date().toISOString().slice(0, 10),
          dataSource: 'ClinicalTrials.gov',
          searchTermUsed: term,
        } as Trial;
      });
    }
  
    private removeDupes(trials: Trial[]): Trial[] {
      const seen = new Set<string>();
      return trials.filter(t => (t.nctId && !seen.has(t.nctId)) ? (seen.add(t.nctId), true) : false);
    }
  
    private validateRelevance(trials: Trial[], p: Patient): Trial[] {
      const needles = [
        (p.primaryDiagnosis || '').toLowerCase(),
        ...(p.conditions || []).map(c => c.toLowerCase()),
      ].filter(Boolean);
  
      return trials.filter(t => {
        const cond = (t.condition || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        const term = (t.searchTermUsed || '').toLowerCase();
        return needles.some(n =>
          cond.includes(n) || n.includes(cond) || title.includes(n) || n.includes(term) || term.includes(n)
        );
      });
    }
  }
  
  export class AnalysisEngine {
    constructor(private pplx: PerplexityClient, private trials: ClinicalTrialsClient) {}
  
    async run(patient: Patient): Promise<{ analysis: ClinicalAnalysis; matches: MatchingResults }> {
      // 1) Gather trials
      const trials = await this.trials.searchPatientSpecificTrials(patient);
  
      // 2) AI clinical analysis (optional if no key)
      let eligibilityAssessment: string;
      try {
        const prompt = this.clinicalAnalysisPrompt(patient);
        eligibilityAssessment = await this.pplx.chat(prompt);
      } catch {
        eligibilityAssessment = `Clinical analysis context prepared for ${patient.primaryDiagnosis || 'patient condition'} using current guidelines. (AI narrative unavailable in this environment.)`;
      }
      const analysis: ClinicalAnalysis = {
        eligibilityAssessment,
        timestamp: new Date(),
        patientId: patient.id,
        dataSource: 'Evidence-based medical analysis',
      };
  
      // 3) Ranking + optional AI reasoning
      let aiRankReason = '';
      try {
        const matchingPrompt = this.matchingPrompt(patient, eligibilityAssessment, trials);
        aiRankReason = await this.pplx.chat(matchingPrompt);
      } catch {
        aiRankReason = 'Match reasoning generated from structured eligibility and patient profile. (AI narrative unavailable in this environment.)';
      }
  
      const scored = trials
        .map((t, i) => ({ ...t, matchScore: this.matchScore(t, patient), aiRecommendation: aiRankReason }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 10); // top 10
  
      const matches: MatchingResults = {
        trials: scored,
        matchingAnalysis: aiRankReason,
        totalFound: scored.length,
        timestamp: new Date(),
        dataSource: 'ClinicalTrials.gov Official Database',
      };
  
      return { analysis, matches };
    }
  
    private clinicalAnalysisPrompt(p: Patient): string {
      return `Perform a clinical analysis for trial eligibility.
  
  PATIENT PROFILE:
  - Name: ${p.name}
  - Age: ${p.age ?? 'Unknown'}
  - Gender: ${p.gender || 'Unknown'}
  - Primary Diagnosis: ${p.primaryDiagnosis || 'Not specified'}
  - Secondary Conditions: ${p.conditions.join(', ') || 'None'}
  - Current Medications: ${p.medications.join(', ') || 'None'}
  - Location: ${p.location || 'Unknown'}
  - Insurance: ${p.insurance || 'Unknown'}
  
  Provide evidence-based:
  1) Eligibility considerations
  2) Therapeutic recommendations
  3) Medical & safety considerations
  4) Logistical factors
  5) Risk-benefit overview
  
  Use concise, professional medical language and avoid speculation.`;
    }
  
    private matchingPrompt(p: Patient, analysis: string, trials: Trial[]): string {
      const trialsText = trials
        .map(t => `- ${t.title} (${t.nctId}) | Phase ${t.phase} | ${t.status} | Cond: ${t.condition} | Loc: ${t.locations.join(', ')}\n  Eligibility: ${t.eligibility?.slice(0, 400) ?? 'See registry'}`)
        .join('\n');
  
      return `Rank and score trials (0-100) for this patient based on clinical appropriateness.
  
  PATIENT:
  - Age: ${p.age ?? 'Unknown'}, Gender: ${p.gender || 'Unknown'}
  - Dx: ${p.primaryDiagnosis || 'Not specified'}
  - Co-morbidities: ${p.conditions.join(', ') || 'None'}
  - Meds: ${p.medications.join(', ') || 'None'}
  - Location: ${p.location || 'Unknown'}
  
  CLINICAL ANALYSIS:
  ${analysis}
  
  TRIALS:
  ${trialsText}
  
  Return reasoning that references concrete eligibility and safety factors.`;
    }
  
    private matchScore(t: Trial, p: Patient): number {
      let score = 75;
  
      // Diagnosis
      if (p.primaryDiagnosis && t.condition) {
        const dx = p.primaryDiagnosis.toLowerCase();
        const tc = t.condition.toLowerCase();
        if (tc.includes(dx) || dx.includes(tc)) score += 20;
        if (t.searchTermUsed && dx.includes(t.searchTermUsed.toLowerCase())) score += 15;
      }
  
      // Co-morbidities
      if (p.conditions?.length) {
        if (p.conditions.some(c => t.condition.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(t.condition.toLowerCase()))) {
          score += 12;
        }
      }
  
      // Age eligibility (very coarse)
      if (p.age && t.eligibility) {
        const e = t.eligibility.toLowerCase();
        if (p.age >= 18 && e.includes('adult')) score += 6;
        if (p.age >= 65 && e.includes('elder')) score += 3;
        if (p.age < 18 && e.includes('pediatric')) score += 8;
        if (e.includes('18 years') && p.age < 18) score -= 25;
      }
  
      // Location hint
      if (p.location && t.locations?.length) {
        const pl = p.location.toLowerCase();
        const near = t.locations.some(l => {
          const s = l.toLowerCase().split(',')[1]?.trim();
          const ps = pl.split(',')[1]?.trim();
          return (s && ps && (s.includes(ps) || ps.includes(s)));
        });
        if (near) score += 8;
      }
  
      // Status/phase
      if (/^recruit/i.test(t.status)) score += 8;
      else if (/not yet recruit/i.test(t.status)) score += 4;
      if (t.phase === 'Phase 3') score += 6;
      else if (t.phase === 'Phase 2') score += 3;
  
      // jitter + bounds
      score += Math.random() * 2;
      return Math.min(Math.max(Math.round(score), 50), 100);
    }
  }
  
  // Optional: generate letters/materials like your old app.js
  export class ContentGenerator {
    constructor(private pplx: PerplexityClient) {}
  
    async referralLetter(patient: Patient, trial: Trial, analysis: ClinicalAnalysis): Promise<string> {
      const prompt = `Generate a formal referral letter for this verified trial from ClinicalTrials.gov.
  
  PATIENT: ${patient.name} (${patient.age ?? 'NA'}y, ${patient.gender || 'NA'})
  DX: ${patient.primaryDiagnosis || 'NA'}
  CO-MORBIDITIES: ${patient.conditions.join(', ') || 'None'}
  MEDS: ${patient.medications.join(', ') || 'None'}
  
  TRIAL: ${trial.title}
  NCT: ${trial.nctId}
  PHASE: ${trial.phase}
  STATUS: ${trial.status}
  SPONSOR: ${trial.sponsor}
  MATCH SCORE: ${trial.matchScore}%
  CONTACT: ${trial.contact || 'See registry'}
  ELIGIBILITY (excerpt): ${(trial.eligibility || '').slice(0, 600)}
  
  CLINICAL ANALYSIS:
  ${analysis.eligibilityAssessment}
  
  Include: clinical rationale, safety notes, and next steps. Use professional tone.`;
      try {
        return await this.pplx.chat(prompt);
      } catch {
        return 'Referral content unavailable in this environment.';
      }
    }
  }
  