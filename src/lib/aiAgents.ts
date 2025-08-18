// src/lib/aiAgents.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- Types ----------
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

// ---------- Perplexity ----------
type PerplexityConfig = {
  apiKey?: string;          // only used for DEV_DIRECT
  apiUrl: string;           // '/api/perplexity' (proxy) OR 'https://api.perplexity.ai/chat/completions'
  model: string;            // e.g., 'sonar'
};

export class PerplexityClient {
  constructor(private cfg: PerplexityConfig) {}

  private get key(): string | undefined {
    return this.cfg.apiKey || (globalThis as any)?.window?.__CRP_PPLX_KEY;
  }

  async chat(prompt: string, max_tokens = 2000, temperature = 0.7): Promise<string> {
    const body = {
      model: this.cfg.model || 'sonar',
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // If calling upstream directly (DEV only), attach key
    if (this.cfg.apiUrl.includes('perplexity.ai')) {
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

// ---------- ClinicalTrials.gov ----------
const CLINICAL_API = 'https://clinicaltrials.gov/api/v2/studies';

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
  
    const url = `${CLINICAL_API}?${params.toString()}`;
    const r = await fetch(url);
  
    // If API returns 400 due to bad filters, retry without the status filter as a fallback
    if (!r.ok) {
      if (r.status === 400) {
        const paramsRetry = new URLSearchParams();
        paramsRetry.append('format', 'json');
        paramsRetry.append('pageSize', '15');
        paramsRetry.append('countTotal', 'true');
        paramsRetry.append('query.cond', term);
        const r2 = await fetch(`${CLINICAL_API}?${paramsRetry.toString()}`);
        if (!r2.ok) throw new Error('Clinical trials request failed (400) and fallback also failed');
        const data2 = await r2.json();
        const trials2 = this.toTrials(data2?.studies || [], term);
        return this.postFilterByState(trials2, patient);
      }
      throw new Error('Clinical trials database temporarily unavailable');
    }
  
    const data = await r.json();
    const trials = this.toTrials(data?.studies || [], term);
    return this.postFilterByState(trials, patient);
  }
  
  // Light post-filter so we still bias to nearby sites without breaking the API
  private postFilterByState(trials: Trial[], patient: Patient): Trial[] {
    const loc = (patient.location || '').trim();
    if (!loc) return trials;
  
    // Try to extract a 2-letter state (e.g., "Seattle, WA" → "WA" or "WA")
    const parts = loc.split(',').map(s => s.trim()).filter(Boolean);
    const maybeState = parts.length ? parts[parts.length - 1] : '';
    const state2 = /^[A-Z]{2}$/i.test(maybeState) ? maybeState.toUpperCase() : '';
  
    if (!state2) return trials;
  
    const filtered = trials.filter(t =>
      (t.locations || []).some(L => L.toUpperCase().includes(state2))
    );
  
    // If filtering removes everything, fall back to original trials
    return filtered.length ? filtered : trials;
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
        contact: contacts?.[0]
          ? `${contacts[0].name} - ${contacts[0].phone || contacts[0].email || 'Contact via ClinicalTrials.gov'}`
          : undefined,
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

// ---------- Analysis & Matching ----------
export class AnalysisEngine {
  constructor(private pplx: PerplexityClient, private trials: ClinicalTrialsClient) {}

  async run(
    patient: Patient,
    metrics?: {
      severity?: number; diseaseStage?: string; ecog?: number; nyha?: number;
      hba1c?: number; egfr?: number; bmi?: number; adherence?: number;
      tests?: Record<string, number>;
    }
  ): Promise<{ analysis: ClinicalAnalysis; matches: MatchingResults }> {
    // 1) Trials
    const trials = await this.trials.searchPatientSpecificTrials(patient);

    // 2) AI clinical analysis (asks for FIT & LIKELIHOOD line)
    let eligibilityAssessment: string;
    try {
      const prompt = this.clinicalAnalysisPrompt(patient, metrics);
      eligibilityAssessment = await this.pplx.chat(prompt);
    } catch {
      eligibilityAssessment =
        `Clinical analysis prepared using available patient data. (AI narrative unavailable.)\n\nFIT=70; LIKELIHOOD=65`;
    }
    const analysis: ClinicalAnalysis = {
      eligibilityAssessment,
      timestamp: new Date(),
      patientId: patient.id,
      dataSource: 'Evidence-based medical analysis',
    };

    // 3) AI ranking narrative (optional)
    let aiRankReason = '';
    try {
      const matchingPrompt = this.matchingPrompt(patient, eligibilityAssessment, trials, metrics);
      aiRankReason = await this.pplx.chat(matchingPrompt);
    } catch {
      aiRankReason = 'Match reasoning generated from structured eligibility and patient profile. (AI narrative unavailable.)';
    }

    const scored = trials
      .map((t) => ({ ...t, matchScore: this.matchScore(t, patient), aiRecommendation: aiRankReason }))
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 10);

    const matches: MatchingResults = {
      trials: scored,
      matchingAnalysis: aiRankReason,
      totalFound: scored.length,
      timestamp: new Date(),
      dataSource: 'ClinicalTrials.gov Official Database',
    };

    return { analysis, matches };
  }

  private clinicalAnalysisPrompt(
    p: Patient,
    m?: {
      severity?: number; diseaseStage?: string; ecog?: number; nyha?: number;
      hba1c?: number; egfr?: number; bmi?: number; adherence?: number;
      tests?: Record<string, number>;
    }
  ): string {
    const tests = m?.tests
      ? Object.entries(m.tests).slice(0, 10).map(([k, v]) => `- ${k}: ${v}`).join('\n')
      : 'None';

    return `Perform a clinical analysis for clinical-trial eligibility **and** participation likelihood.

PATIENT PROFILE
- Name: ${p.name}
- Age: ${p.age ?? 'Unknown'}
- Gender: ${p.gender || 'Unknown'}
- Primary Diagnosis: ${p.primaryDiagnosis || 'Not specified'}
- Co-morbidities: ${p.conditions.join(', ') || 'None'}
- Current Medications: ${p.medications.join(', ') || 'None'}
- Location: ${p.location || 'Unknown'}
- Insurance: ${p.insurance || 'Unknown'}

STRUCTURED CLINICAL METRICS (if present)
- Severity (0–1): ${m?.severity ?? 'NA'}
- Disease Stage: ${m?.diseaseStage ?? 'NA'}
- ECOG: ${m?.ecog ?? 'NA'}
- NYHA: ${m?.nyha ?? 'NA'}
- HbA1c: ${m?.hba1c ?? 'NA'}
- eGFR: ${m?.egfr ?? 'NA'}
- BMI: ${m?.bmi ?? 'NA'}
- Medication adherence (0–1): ${m?.adherence ?? 'NA'}
- Key tests:
${tests}

REQUIREMENTS (write in concise professional **Markdown**):
1) **Eligibility Synopsis** – key inclusion/exclusion considerations grounded in evidence/guidelines.
2) **Trial Fit Estimate (0–100)** – a single number with 3–5 bullet reasons referencing the metrics above.
3) **Participation Likelihood (0–100)** – estimate willingness/ability to participate, with bullets for **motivators** and **barriers** linked to the patient data.
4) **Safety & Logistics** – monitoring needs, visit cadence, interactions, lab thresholds.
5) **Disclaimer** – informational only; final judgment lies with treating clinicians.

FINAL LINE (machine-readable, on its own line exactly):
FIT=<0-100>; LIKELIHOOD=<0-100>`;
  }

  private matchingPrompt(
    p: Patient,
    analysis: string,
    trials: Trial[],
    m?: {
      severity?: number; diseaseStage?: string; ecog?: number; nyha?: number;
      hba1c?: number; egfr?: number; bmi?: number; adherence?: number;
      tests?: Record<string, number>;
    }
  ): string {
    const trialsText = trials
      .map(t => `- ${t.title} (${t.nctId}) | Phase ${t.phase} | ${t.status} | Cond: ${t.condition} | Loc: ${t.locations.join(', ')}
  Eligibility excerpt: ${(t.eligibility || '').slice(0, 400)}`)
      .join('\n');

    return `Rank and score trials (0–100) for this patient based on **clinical appropriateness and feasibility**.

PATIENT SNAPSHOT
- Age ${p.age ?? 'Unknown'}, ${p.gender || 'Unknown'}
- Dx: ${p.primaryDiagnosis || 'Not specified'}
- Co-morbidities: ${p.conditions.join(', ') || 'None'}
- Meds: ${p.medications.join(', ') || 'None'}
- Location: ${p.location || 'Unknown'}

STRUCTURED METRICS (context)
- Severity: ${m?.severity ?? 'NA'}, Stage: ${m?.diseaseStage ?? 'NA'}, ECOG: ${m?.ecog ?? 'NA'}, NYHA: ${m?.nyha ?? 'NA'}
- HbA1c: ${m?.hba1c ?? 'NA'}, eGFR: ${m?.egfr ?? 'NA'}, BMI: ${m?.bmi ?? 'NA'}, Adherence: ${m?.adherence ?? 'NA'}

CLINICAL ANALYSIS (from prior step)
${analysis}

TRIALS (from ClinicalTrials.gov)
${trialsText}

INSTRUCTIONS
- For each trial, give a **Standardized Match Rate (0–100)** driven by: condition match, inclusion/exclusion fit, age/performance status, key labs, and status (Recruiting > Not yet recruiting).
- Note any clear **feasibility factors** that affect participation (visit cadence, travel/logistics inferred from location vs trial sites, monitoring burden).
- Return concise **Markdown** with a ranked list and 2–4 bullets per trial explaining the score.
- Do not provide medical advice.`;
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

    // Age eligibility (coarse)
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

// -------- Content generation (referral) --------
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

Write in professional medical tone using **Markdown** with clear headings and bullet points. Include clinical rationale, safety notes, and next steps.`;
    try {
      return await this.pplx.chat(prompt);
    } catch {
      return 'Referral content unavailable in this environment.';
    }
  }
}
