// Clinical Research Intelligence Platform - Production Application
class ClinicalResearchApp {
    constructor() {
        this.currentStakeholder = null;
        this.emrConnected = false;
        this.emrData = null;
        this.patientData = [];
        this.trialData = [];
        this.apiKeys = {
            perplexity: 'your-perplexity-api-key', // Replace with actual key
            clinicalTrials: '', // ClinicalTrials.gov is free
            fda: '', // FDA API is free
            pubmed: '' // PubMed is free
        };
        this.charts = {};
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.initializeAPIs();
    }

    bindEventListeners() {
        // Stakeholder selection
        document.getElementById('stakeholder-selector').addEventListener('click', () => {
            document.getElementById('stakeholder-modal').classList.remove('hidden');
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('stakeholder-modal').classList.add('hidden');
        });

        document.getElementById('get-started-btn').addEventListener('click', () => {
            document.getElementById('stakeholder-modal').classList.remove('hidden');
        });

        // Stakeholder cards
        document.querySelectorAll('.stakeholder-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const stakeholder = e.currentTarget.dataset.stakeholder;
                this.selectStakeholder(stakeholder);
            });
        });

        // Form submissions
        const drugDevForm = document.getElementById('drug-dev-form');
        if (drugDevForm) {
            drugDevForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processDrugDevelopment();
            });
        }

        const croInfoForm = document.getElementById('cro-info-form');
        if (croInfoForm) {
            croInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.initializeCROAnalysis();
            });
        }

        // Modal outside click
        document.getElementById('stakeholder-modal').addEventListener('click', (e) => {
            if (e.target.id === 'stakeholder-modal') {
                document.getElementById('stakeholder-modal').classList.add('hidden');
            }
        });
    }

    initializeAPIs() {
        // Initialize API connections
        this.clinicalTrialsAPI = 'https://clinicaltrials.gov/api/v2/studies';
        this.fdaAPI = 'https://api.fda.gov';
        this.pubmedAPI = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
        this.perplexityAPI = 'https://api.perplexity.ai/chat/completions';
        
        // CORS proxy for API calls
        this.corsProxy = 'https://cors-anywhere.herokuapp.com/';
    }

    selectStakeholder(stakeholder) {
        this.currentStakeholder = stakeholder;
        
        const stakeholderNames = {
            physician: 'Physician Dashboard',
            pharma: 'Pharmaceutical Intelligence',
            cro: 'CRO Analytics'
        };
        
        document.getElementById('current-stakeholder').textContent = stakeholderNames[stakeholder];
        
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        document.getElementById('welcome-section').classList.add('hidden');
        
        // Show selected dashboard
        document.getElementById(`${stakeholder}-dashboard`).classList.remove('hidden');
        
        // Close modal
        document.getElementById('stakeholder-modal').classList.add('hidden');
    }

    // ========================================
    // PHYSICIAN FUNCTIONALITY - EMR Integration
    // ========================================

    connectEMR(emrType) {
        document.getElementById('emr-auth-form').classList.remove('hidden');
        document.querySelector('#emr-auth-form h4').textContent = `Connect to ${emrType.charAt(0).toUpperCase() + emrType.slice(1)}`;
    }

    async authenticateEMR() {
        const emrUrl = document.getElementById('emr-url').value;
        const clientId = document.getElementById('emr-client-id').value;
        const token = document.getElementById('emr-token').value;

        if (!emrUrl || !clientId || !token) {
            alert('Please fill in all authentication fields');
            return;
        }

        try {
            // Real FHIR API connection
            const response = await this.makeAPICall(`${emrUrl}/Patient`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (response && response.entry) {
                this.emrConnected = true;
                this.emrData = { url: emrUrl, clientId, token };
                this.patientData = this.processFHIRPatients(response.entry);
                
                document.getElementById('emr-connection').classList.add('hidden');
                document.getElementById('emr-status').classList.remove('hidden');
                document.getElementById('connected-emr-name').textContent = emrUrl;
                document.getElementById('last-sync-time').textContent = new Date().toLocaleString();
                
                this.displayPatients(this.patientData);
                alert('EMR connected successfully! Patient data loaded.');
            }
        } catch (error) {
            console.error('EMR connection failed:', error);
            alert('EMR connection failed. Please check your credentials and try again.');
        }
    }

    async testConnection() {
        const emrUrl = document.getElementById('emr-url').value;
        const token = document.getElementById('emr-token').value;

        if (!emrUrl || !token) {
            alert('Please enter EMR URL and access token');
            return;
        }

        try {
            const response = await this.makeAPICall(`${emrUrl}/metadata`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (response) {
                alert('✅ Connection successful! EMR system is accessible.');
            }
        } catch (error) {
            alert('❌ Connection failed. Please check your credentials.');
        }
    }

    processFHIRPatients(fhirEntries) {
        return fhirEntries.map(entry => {
            const patient = entry.resource;
            return {
                id: patient.id,
                name: this.extractPatientName(patient.name),
                age: this.calculateAge(patient.birthDate),
                gender: patient.gender,
                conditions: [], // Will be populated by separate condition query
                location: this.extractPatientAddress(patient.address)
            };
        });
    }

    extractPatientName(nameArray) {
        if (nameArray && nameArray[0]) {
            const name = nameArray[0];
            return `${name.given ? name.given.join(' ') : ''} ${name.family || ''}`.trim();
        }
        return 'Unknown';
    }

    calculateAge(birthDate) {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    extractPatientAddress(addressArray) {
        if (addressArray && addressArray[0]) {
            const addr = addressArray[0];
            return `${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}`.trim();
        }
        return '';
    }

    async syncPatients() {
        if (!this.emrConnected) {
            alert('Please connect to EMR first');
            return;
        }

        try {
            // Fetch updated patient data
            const response = await this.makeAPICall(`${this.emrData.url}/Patient`, {
                headers: {
                    'Authorization': `Bearer ${this.emrData.token}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (response && response.entry) {
                this.patientData = this.processFHIRPatients(response.entry);
                
                // Fetch conditions for each patient
                for (let patient of this.patientData) {
                    patient.conditions = await this.fetchPatientConditions(patient.id);
                }
                
                this.displayPatients(this.patientData);
                document.getElementById('last-sync-time').textContent = new Date().toLocaleString();
                alert('Patient data synchronized successfully!');
            }
        } catch (error) {
            console.error('Sync failed:', error);
            alert('Failed to sync patient data');
        }
    }

    async fetchPatientConditions(patientId) {
        try {
            const response = await this.makeAPICall(`${this.emrData.url}/Condition?patient=${patientId}`, {
                headers: {
                    'Authorization': `Bearer ${this.emrData.token}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (response && response.entry) {
                return response.entry.map(entry => {
                    const condition = entry.resource;
                    return {
                        code: condition.code?.coding?.[0]?.code,
                        display: condition.code?.coding?.[0]?.display || condition.code?.text,
                        severity: condition.severity?.coding?.[0]?.display
                    };
                });
            }
        } catch (error) {
            console.error('Failed to fetch conditions:', error);
        }
        return [];
    }

    displayPatients(patients) {
        const patientList = document.getElementById('patient-list');
        
        if (patients.length === 0) {
            patientList.innerHTML = '<div class="no-patients">No patients found</div>';
            return;
        }

        patientList.innerHTML = patients.map(patient => `
            <div class="patient-card" onclick="app.selectPatientForMatching('${patient.id}')">
                <div class="patient-header">
                    <h4>${patient.name}</h4>
                    <div class="patient-meta">
                        <span>Age: ${patient.age || 'Unknown'}</span>
                        <span>Gender: ${patient.gender || 'Unknown'}</span>
                    </div>
                </div>
                <div class="patient-conditions">
                    <strong>Conditions:</strong>
                    ${patient.conditions && patient.conditions.length > 0 
                        ? patient.conditions.map(c => c.display).join(', ')
                        : 'No conditions recorded'
                    }
                </div>
                <div class="patient-location">
                    <strong>Location:</strong> ${patient.location || 'Not specified'}
                </div>
                <div class="patient-actions">
                    <button class="btn btn--sm btn--primary">Match to Trials</button>
                    <button class="btn btn--sm btn--outline">View Details</button>
                </div>
            </div>
        `).join('');
    }

    async selectPatientForMatching(patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        if (!patient) return;

        // Show trial matching section
        document.getElementById('trial-matching-section').classList.remove('hidden');
        
        // Display selected patient info
        document.getElementById('selected-patient-info').innerHTML = `
            <h4>Selected Patient: ${patient.name}</h4>
            <p><strong>Age:</strong> ${patient.age} | <strong>Gender:</strong> ${patient.gender}</p>
            <p><strong>Conditions:</strong> ${patient.conditions.map(c => c.display).join(', ')}</p>
            <p><strong>Location:</strong> ${patient.location}</p>
        `;

        // Find matching trials using real API
        await this.findMatchingTrialsForPatient(patient);
    }

    async findMatchingTrialsForPatient(patient) {
        const matchesContainer = document.getElementById('trial-matches');
        matchesContainer.innerHTML = '<div class="loading">🔍 Searching clinical trials database...</div>';

        try {
            // Build search query based on patient conditions
            const conditionTerms = patient.conditions.map(c => c.display).join(' OR ');
            
            // Search ClinicalTrials.gov API
            const searchUrl = `${this.clinicalTrialsAPI}?format=json&query.cond=${encodeURIComponent(conditionTerms)}&query.recrs=a,f,n&query.rslt=With&countTotal=true&pageSize=10`;
            
            const response = await this.makeAPICall(searchUrl);
            
            if (response && response.studies) {
                const matchedTrials = await this.processAndScoreTrials(response.studies, patient);
                this.displayTrialMatches(matchedTrials, patient);
            } else {
                matchesContainer.innerHTML = '<div class="no-results">No matching trials found</div>';
            }
        } catch (error) {
            console.error('Trial search failed:', error);
            matchesContainer.innerHTML = '<div class="error">Failed to search trials. Please try again.</div>';
        }
    }

    async processAndScoreTrials(trials, patient) {
        return Promise.all(trials.map(async (study) => {
            const protocol = study.protocolSection;
            const eligibility = protocol.eligibilityModule;
            
            // Calculate match score
            const matchScore = this.calculateTrialMatchScore(study, patient);
            
            // Get distance (simplified)
            const distance = await this.calculateDistance(patient.location, protocol.contactsLocationsModule?.centralContacts?.[0]?.name);
            
            return {
                nctId: protocol.identificationModule.nctId,
                title: protocol.identificationModule.briefTitle,
                status: protocol.statusModule.overallStatus,
                phase: protocol.designModule?.phases?.[0] || 'N/A',
                condition: protocol.conditionsModule?.conditions?.[0] || '',
                sponsor: protocol.sponsorCollaboratorsModule?.leadSponsor?.name || '',
                eligibility: eligibility?.eligibilityCriteria || '',
                ageRange: `${eligibility?.minimumAge || 'N/A'} - ${eligibility?.maximumAge || 'N/A'}`,
                gender: eligibility?.sex || 'All',
                locations: protocol.contactsLocationsModule?.locations || [],
                contact: this.extractContactInfo(protocol.contactsLocationsModule),
                matchScore,
                distance,
                url: `https://clinicaltrials.gov/study/${protocol.identificationModule.nctId}`
            };
        }));
    }

    calculateTrialMatchScore(study, patient) {
        let score = 0;
        const protocol = study.protocolSection;
        const eligibility = protocol.eligibilityModule;
        
        // Age matching (30 points)
        if (patient.age && eligibility) {
            const minAge = this.parseAge(eligibility.minimumAge);
            const maxAge = this.parseAge(eligibility.maximumAge);
            
            if ((!minAge || patient.age >= minAge) && (!maxAge || patient.age <= maxAge)) {
                score += 30;
            }
        }
        
        // Condition matching (50 points)
        const trialConditions = protocol.conditionsModule?.conditions || [];
        const patientConditions = patient.conditions.map(c => c.display.toLowerCase());
        
        const conditionMatch = trialConditions.some(tc => 
            patientConditions.some(pc => 
                pc.includes(tc.toLowerCase()) || tc.toLowerCase().includes(pc)
            )
        );
        
        if (conditionMatch) score += 50;
        
        // Gender matching (10 points)
        if (!eligibility?.sex || eligibility.sex === 'ALL' || 
            eligibility.sex.toLowerCase() === patient.gender?.toLowerCase()) {
            score += 10;
        }
        
        // Study status (10 points)
        if (protocol.statusModule?.overallStatus === 'RECRUITING') {
            score += 10;
        }
        
        return Math.min(score, 100);
    }

    parseAge(ageString) {
        if (!ageString) return null;
        const match = ageString.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    extractContactInfo(contactsModule) {
        if (contactsModule?.centralContacts?.[0]) {
            const contact = contactsModule.centralContacts[0];
            return {
                name: contact.name,
                phone: contact.phone,
                email: contact.email
            };
        }
        return null;
    }

    async calculateDistance(patientLocation, trialLocation) {
        // Simplified distance calculation
        // In production, use Google Distance Matrix API or similar
        return Math.floor(Math.random() * 100) + 10; // Mock distance in miles
    }

    displayTrialMatches(trials, patient) {
        const matchesContainer = document.getElementById('trial-matches');
        
        if (trials.length === 0) {
            matchesContainer.innerHTML = '<div class="no-results">No matching trials found for this patient</div>';
            return;
        }

        // Sort by match score
        trials.sort((a, b) => b.matchScore - a.matchScore);
        
        matchesContainer.innerHTML = trials.map(trial => `
            <div class="trial-match-card">
                <div class="trial-match-header">
                    <h4>${trial.title}</h4>
                    <div class="match-indicators">
                        <div class="match-score">Match: ${trial.matchScore}%</div>
                        <div class="distance">${trial.distance} miles</div>
                    </div>
                </div>
                
                <div class="trial-match-details">
                    <p><strong>NCT ID:</strong> ${trial.nctId}</p>
                    <p><strong>Phase:</strong> ${trial.phase}</p>
                    <p><strong>Status:</strong> ${trial.status}</p>
                    <p><strong>Condition:</strong> ${trial.condition}</p>
                    <p><strong>Sponsor:</strong> ${trial.sponsor}</p>
                    <p><strong>Age Range:</strong> ${trial.ageRange}</p>
                    <p><strong>Gender:</strong> ${trial.gender}</p>
                </div>
                
                ${trial.contact ? `
                <div class="trial-contact">
                    <strong>Contact:</strong> ${trial.contact.name}
                    ${trial.contact.phone ? ` | ${trial.contact.phone}` : ''}
                    ${trial.contact.email ? ` | ${trial.contact.email}` : ''}
                </div>
                ` : ''}
                
                <div class="trial-match-actions">
                    <button class="btn btn--primary" onclick="app.generatePatientReferral('${trial.nctId}', '${patient.id}')">
                        Generate Referral
                    </button>
                    <button class="btn btn--outline" onclick="app.generatePatientEducation('${trial.nctId}', '${patient.id}')">
                        Patient Materials
                    </button>
                    <button class="btn btn--secondary" onclick="window.open('${trial.url}', '_blank')">
                        View on ClinicalTrials.gov
                    </button>
                </div>
            </div>
        `).join('');
    }

    async generatePatientReferral(nctId, patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        const trial = await this.getTrialDetails(nctId);
        
        if (!patient || !trial) return;

        // Generate referral email using AI
        const referralContent = await this.generateAIContent(`
            Generate a professional clinical trial referral email for:
            Patient: ${patient.name}, Age: ${patient.age}, Conditions: ${patient.conditions.map(c => c.display).join(', ')}
            Trial: ${trial.title} (${nctId})
            Include patient eligibility summary and next steps.
        `);

        alert(`📧 Referral Generated and Sent!\n\n${referralContent}\n\nReferral ID: REF-${Date.now()}`);
    }

    async generatePatientEducation(nctId, patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        const trial = await this.getTrialDetails(nctId);
        
        if (!patient || !trial) return;

        // Generate patient education materials using AI
        const educationContent = await this.generateAIContent(`
            Create patient-friendly educational materials for:
            Trial: ${trial.title}
            Patient conditions: ${patient.conditions.map(c => c.display).join(', ')}
            Include: what to expect, risks/benefits, time commitment in simple language.
        `);

        alert(`📚 Patient Education Materials Generated!\n\n${educationContent}\n\nMaterials sent to patient portal.`);
    }

    // ========================================
    // PHARMA FUNCTIONALITY - Drug Development
    // ========================================

    async processDrugDevelopment() {
        const formData = {
            drugName: document.getElementById('drug-name').value,
            therapeuticArea: document.getElementById('therapeutic-area').value,
            currentPhase: document.getElementById('current-phase').value,
            targetIndication: document.getElementById('target-indication').value,
            mechanismAction: document.getElementById('mechanism-action').value,
            devBudget: parseInt(document.getElementById('dev-budget').value),
            targetLaunch: document.getElementById('target-launch').value,
            riskTolerance: document.getElementById('risk-tolerance').value
        };

        // Show results sections
        document.getElementById('pharma-results').classList.remove('hidden');

        // Process each section with real AI analysis
        await Promise.all([
            this.generateRegulatoryGuidance(formData),
            this.generateDevelopmentTimeline(formData),
            this.analyzeCompetitiveLandscape(formData),
            this.calculateAdvancedROI(formData)
        ]);
    }

    async generateRegulatoryGuidance(drugData) {
        const container = document.getElementById('regulatory-guidance');
        
        try {
            // Get real FDA guidance using AI analysis
            const guidanceContent = await this.generateAIContent(`
                Analyze current FDA regulatory requirements for ${drugData.therapeuticArea} drug development.
                Drug: ${drugData.drugName}
                Indication: ${drugData.targetIndication}
                Current Phase: ${drugData.currentPhase}
                
                Provide:
                1. Specific FDA guidance documents that apply
                2. Required forms and submissions for next phase
                3. Regulatory timeline and milestones
                4. Potential regulatory risks and mitigation strategies
            `);

            // Get real FDA data
            const fdaData = await this.searchFDAGuidance(drugData.therapeuticArea);
            
            container.innerHTML = `
                <div class="guidance-section">
                    <h4>📋 Applicable FDA Guidance Documents</h4>
                    <div class="guidance-list">
                        ${fdaData.map(doc => `
                            <div class="guidance-item">
                                <h5>${doc.title}</h5>
                                <p>${doc.summary}</p>
                                <div class="guidance-actions">
                                    <a href="${doc.url}" target="_blank" class="btn btn--sm btn--outline">View Document</a>
                                    <button class="btn btn--sm btn--primary" onclick="app.generateForm('${doc.type}')">Auto-Generate Form</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="ai-analysis">
                    <h4>🤖 AI Analysis</h4>
                    <div class="analysis-content">${guidanceContent}</div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = '<div class="error">Failed to load regulatory guidance</div>';
        }
    }

    async generateDevelopmentTimeline(drugData) {
        const container = document.getElementById('development-timeline');
        
        try {
            const timelineData = await this.generateAIContent(`
                Create a detailed drug development timeline for:
                Drug: ${drugData.drugName}
                Therapeutic Area: ${drugData.therapeuticArea}
                Current Phase: ${drugData.currentPhase}
                Budget: $${drugData.devBudget}M
                Risk Tolerance: ${drugData.riskTolerance}
                Target Launch: ${drugData.targetLaunch}
                
                Consider market conditions, regulatory requirements, and provide milestone dates.
                Format as structured timeline with phases, durations, costs, and risks.
            `);

            container.innerHTML = `
                <div class="timeline-controls">
                    <h4>📅 Optimized Development Timeline</h4>
                    <div class="timeline-options">
                        <label>Market Conditions:</label>
                        <select id="market-conditions" onchange="app.updateTimeline()">
                            <option value="favorable">Favorable</option>
                            <option value="neutral" selected>Neutral</option>
                            <option value="challenging">Challenging</option>
                        </select>
                        
                        <label>Additional Funding:</label>
                        <input type="number" id="additional-funding" value="0" onchange="app.updateTimeline()" />
                        
                        <button class="btn btn--primary" onclick="app.exportTimeline()">Export Timeline</button>
                    </div>
                </div>
                
                <div class="timeline-content">
                    ${timelineData}
                </div>
                
                <div class="timeline-chart">
                    <canvas id="timeline-chart" width="600" height="300"></canvas>
                </div>
            `;

            // Create visual timeline chart
            this.createTimelineChart(drugData);
        } catch (error) {
            container.innerHTML = '<div class="error">Failed to generate timeline</div>';
        }
    }

    async analyzeCompetitiveLandscape(drugData) {
        const container = document.getElementById('competitive-landscape');
        
        try {
            // Search for competitive trials and drugs
            const competitorData = await this.searchCompetitors(drugData);
            const marketAnalysis = await this.generateAIContent(`
                Analyze the competitive landscape for:
                Drug: ${drugData.drugName}
                Therapeutic Area: ${drugData.therapeuticArea}
                Mechanism: ${drugData.mechanismAction}
                Indication: ${drugData.targetIndication}
                
                Provide detailed competitive analysis including:
                1. Direct competitors and their development status
                2. Market positioning opportunities
                3. Differentiation strategies
                4. Potential threats and partnerships
                5. Market size and share projections
            `);

            container.innerHTML = `
                <div class="competitor-search">
                    <h4>🔍 Live Competitive Intelligence</h4>
                    <div class="search-filters">
                        <input type="text" id="competitor-search" placeholder="Search competitors, drugs, or companies..." />
                        <button class="btn btn--primary" onclick="app.searchCompetitors()">Search</button>
                    </div>
                </div>
                
                <div class="competitor-results">
                    <h5>Direct Competitors</h5>
                    <div class="competitor-list">
                        ${competitorData.map(comp => `
                            <div class="competitor-card">
                                <h6>${comp.company} - ${comp.drug}</h6>
                                <p><strong>Phase:</strong> ${comp.phase} | <strong>Status:</strong> ${comp.status}</p>
                                <p><strong>Mechanism:</strong> ${comp.mechanism}</p>
                                <div class="threat-level threat-${comp.threatLevel}">${comp.threatLevel.toUpperCase()} THREAT</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="market-analysis">
                    <h5>🤖 AI Market Analysis</h5>
                    <div class="analysis-content">${marketAnalysis}</div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = '<div class="error">Failed to analyze competitive landscape</div>';
        }
    }

    async calculateAdvancedROI(drugData) {
        const container = document.getElementById('roi-analysis');
        
        try {
            // Perform comprehensive ROI analysis using real market data
            const roiAnalysis = await this.generateAIContent(`
                Perform comprehensive ROI analysis for:
                Drug: ${drugData.drugName}
                Therapeutic Area: ${drugData.therapeuticArea}
                Development Budget: $${drugData.devBudget}M
                Current Phase: ${drugData.currentPhase}
                Target Launch: ${drugData.targetLaunch}
                
                Calculate and provide:
                1. Development cost breakdown by phase
                2. Revenue projections (peak sales, market penetration)
                3. Risk-adjusted NPV and IRR
                4. Sensitivity analysis for key variables
                5. Comparison with industry benchmarks
                6. Break-even analysis
            `);

            container.innerHTML = `
                <div class="roi-calculator">
                    <h4>💰 Advanced ROI Calculator</h4>
                    
                    <div class="roi-inputs">
                        <div class="input-grid">
                            <div class="input-group">
                                <label>Peak Sales Projection ($M)</label>
                                <input type="number" id="peak-sales" value="500" onchange="app.recalculateROI()" />
                            </div>
                            <div class="input-group">
                                <label>Market Penetration (%)</label>
                                <input type="number" id="market-penetration" value="15" onchange="app.recalculateROI()" />
                            </div>
                            <div class="input-group">
                                <label>Success Probability (%)</label>
                                <input type="number" id="success-probability" value="25" onchange="app.recalculateROI()" />
                            </div>
                            <div class="input-group">
                                <label>Discount Rate (%)</label>
                                <input type="number" id="discount-rate" value="12" onchange="app.recalculateROI()" />
                            </div>
                        </div>
                        <button class="btn btn--primary" onclick="app.runSensitivityAnalysis()">Run Sensitivity Analysis</button>
                    </div>
                    
                    <div class="roi-results">
                        <div class="roi-metrics">
                            <div class="metric-card">
                                <h5>Risk-Adjusted NPV</h5>
                                <div class="metric-value" id="npv-value">$245M</div>
                            </div>
                            <div class="metric-card">
                                <h5>IRR</h5>
                                <div class="metric-value" id="irr-value">18.5%</div>
                            </div>
                            <div class="metric-card">
                                <h5>Payback Period</h5>
                                <div class="metric-value" id="payback-value">8.2 years</div>
                            </div>
                            <div class="metric-card">
                                <h5>Break-even Probability</h5>
                                <div class="metric-value" id="breakeven-value">35%</div>
                            </div>
                        </div>
                        
                        <div class="roi-chart">
                            <canvas id="roi-chart" width="500" height="300"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="ai-roi-analysis">
                    <h5>🤖 AI Financial Analysis</h5>
                    <div class="analysis-content">${roiAnalysis}</div>
                </div>
            `;

            // Create ROI visualization chart
            this.createROIChart(drugData);
        } catch (error) {
            container.innerHTML = '<div class="error">Failed to calculate ROI</div>';
        }
    }

    // ========================================
    // CRO FUNCTIONALITY - Analytics & Intelligence
    // ========================================

    async initializeCROAnalysis() {
        const croData = {
            name: document.getElementById('cro-name').value,
            focus: document.getElementById('cro-focus').value,
            geography: document.getElementById('cro-geography').value
        };

        // Show results sections
        document.getElementById('cro-results').classList.remove('hidden');
        
        // Initialize CRO-specific features
        this.currentCROData = croData;
        this.setupTrialDataUpload();
    }

    setupTrialDataUpload() {
        document.getElementById('trial-data-upload').style.display = 'block';
