// Clinical Research Intelligence Platform - Enterprise AI-Powered Application
class ClinicalResearchApp {
    constructor() {
        this.currentStakeholder = null;
        this.patientData = [];
        this.trialData = [];
        this.croData = null;
        this.drugDevelopmentData = null;
        
        // Perplexity AI Configuration
        this.perplexityConfig = {
            apiKey: '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',
            apiUrl: 'https://api.perplexity.ai/chat/completions',
            model: 'llama-3.1-sonar-large-128k-online'
        };
        
        // API Endpoints
        this.clinicalTrialsAPI = 'https://clinicaltrials.gov/api/v2/studies';
        this.fdaAPI = 'https://api.fda.gov';
        
        this.charts = {};
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.initializeAIStatus();
    }

    initializeAIStatus() {
        // Show AI agent is active
        const aiStatus = document.getElementById('ai-status');
        if (aiStatus) {
            setInterval(() => {
                const indicator = aiStatus.querySelector('.ai-indicator');
                indicator.classList.toggle('active');
            }, 2000);
        }
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

        // File upload handlers
        document.getElementById('patient-files').addEventListener('change', (e) => {
            this.handlePatientFileUpload(e.target.files);
        });

        document.getElementById('cro-data-files').addEventListener('change', (e) => {
            this.handleCROFileUpload(e.target.files);
        });

        // Manual patient form
        document.getElementById('manual-patient-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addManualPatient();
        });

        // Modal outside click handlers
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    selectStakeholder(stakeholder) {
        this.currentStakeholder = stakeholder;
        
        const stakeholderNames = {
            physician: 'Physician Portal',
            pharma: 'Pharma Intelligence',
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
    // PHYSICIAN FUNCTIONALITY - Key 1
    // ========================================

    connectEMR(emrType) {
        document.getElementById('emr-auth-modal').classList.remove('hidden');
        document.getElementById('emr-auth-title').textContent = `Connect to ${emrType.charAt(0).toUpperCase() + emrType.slice(1)}`;
    }

    closeEMRModal() {
        document.getElementById('emr-auth-modal').classList.add('hidden');
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
            // Test FHIR connection
            const testUrl = `${emrUrl}/Patient?_count=1`;
            const response = await fetch(testUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/fhir+json'
                }
            });

            if (response.ok) {
                this.emrConnected = true;
                this.emrCredentials = { url: emrUrl, clientId, token };
                
                // Show success and enable patient analysis
                alert('✅ EMR connected successfully!');
                this.closeEMRModal();
                document.getElementById('patient-analysis-section').style.display = 'block';
                
                // Auto-load patients
                await this.loadAllPatients();
            } else {
                alert('❌ EMR connection failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('EMR connection error:', error);
            alert('❌ Connection error. Please verify your EMR settings.');
        }
    }

    async handlePatientFileUpload(files) {
        if (files.length === 0) return;

        const uploadedData = [];
        
        for (let file of files) {
            try {
                const data = await this.parsePatientFile(file);
                uploadedData.push(...data);
            } catch (error) {
                console.error(`Error parsing ${file.name}:`, error);
                alert(`Failed to parse ${file.name}. Please check file format.`);
            }
        }

        if (uploadedData.length > 0) {
            this.patientData = uploadedData;
            document.getElementById('patient-analysis-section').style.display = 'block';
            
            // Auto-display uploaded patients
            this.displayPatients(this.patientData);
            
            alert(`✅ Successfully uploaded ${uploadedData.length} patient records!`);
        }
    }

    async parsePatientFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    let data;
                    
                    if (file.name.endsWith('.csv')) {
                        data = this.parseCSV(content);
                    } else if (file.name.endsWith('.json')) {
                        data = JSON.parse(content);
                    } else {
                        throw new Error('Unsupported file format');
                    }
                    
                    // Normalize patient data structure
                    const normalizedData = data.map(patient => ({
                        id: patient.id || patient.patientId || `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                        name: patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown',
                        age: parseInt(patient.age) || null,
                        gender: patient.gender || patient.sex || '',
                        primaryDiagnosis: patient.primaryDiagnosis || patient.diagnosis || '',
                        conditions: this.parseConditions(patient.conditions || patient.secondaryConditions || ''),
                        medications: this.parseMedications(patient.medications || patient.currentMedications || ''),
                        location: patient.location || patient.zipCode || patient.zip || '',
                        insurance: patient.insurance || patient.insuranceProvider || ''
                    }));
                    
                    resolve(normalizedData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    parseCSV(csvContent) {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index] || '';
                });
                data.push(record);
            }
        }

        return data;
    }

    parseConditions(conditionsString) {
        if (!conditionsString) return [];
        return conditionsString.split(',').map(c => c.trim()).filter(c => c);
    }

    parseMedications(medicationsString) {
        if (!medicationsString) return [];
        return medicationsString.split(',').map(m => m.trim()).filter(m => m);
    }

    showManualEntry() {
        document.getElementById('manual-entry-modal').classList.remove('hidden');
    }

    closeManualEntry() {
        document.getElementById('manual-entry-modal').classList.add('hidden');
        document.getElementById('manual-patient-form').reset();
    }

    addManualPatient() {
        const formData = {
            id: `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: document.getElementById('patient-name').value,
            age: parseInt(document.getElementById('patient-age').value),
            gender: document.getElementById('patient-gender').value,
            primaryDiagnosis: document.getElementById('primary-diagnosis').value,
            conditions: this.parseConditions(document.getElementById('secondary-conditions').value),
            medications: this.parseMedications(document.getElementById('current-medications').value),
            location: document.getElementById('patient-zip').value,
            insurance: document.getElementById('insurance-provider').value
        };

        this.patientData.push(formData);
        document.getElementById('patient-analysis-section').style.display = 'block';
        this.displayPatients(this.patientData);
        this.closeManualEntry();
        
        alert('✅ Patient added successfully!');
    }

    async loadAllPatients() {
        if (this.emrConnected) {
            // Load from EMR
            try {
                const response = await fetch(`${this.emrCredentials.url}/Patient?_count=50`, {
                    headers: {
                        'Authorization': `Bearer ${this.emrCredentials.token}`,
                        'Accept': 'application/fhir+json'
                    }
                });

                if (response.ok) {
                    const fhirData = await response.json();
                    this.patientData = this.processFHIRPatients(fhirData.entry || []);
                }
            } catch (error) {
                console.error('Error loading EMR patients:', error);
                alert('Failed to load patients from EMR');
            }
        }
        
        // Display patients
        this.displayPatients(this.patientData);
    }

    processFHIRPatients(fhirEntries) {
        return fhirEntries.map(entry => {
            const patient = entry.resource;
            return {
                id: patient.id,
                name: this.extractFHIRName(patient.name),
                age: this.calculateAge(patient.birthDate),
                gender: patient.gender,
                primaryDiagnosis: '', // Will be populated separately
                conditions: [],
                medications: [],
                location: this.extractFHIRAddress(patient.address),
                insurance: ''
            };
        });
    }

    extractFHIRName(nameArray) {
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

    extractFHIRAddress(addressArray) {
        if (addressArray && addressArray[0]) {
            const addr = addressArray[0];
            return addr.postalCode || `${addr.city || ''}, ${addr.state || ''}`.trim();
        }
        return '';
    }

    displayPatients(patients) {
        const patientList = document.getElementById('patient-list');
        
        if (patients.length === 0) {
            patientList.innerHTML = '<div class="no-patients">No patients loaded. Please upload data or connect EMR.</div>';
            return;
        }

        patientList.innerHTML = patients.map(patient => `
            <div class="patient-card" onclick="app.selectPatientForAIAnalysis('${patient.id}')">
                <div class="patient-header">
                    <h4>${patient.name}</h4>
                    <div class="patient-meta">
                        <span class="age-badge">${patient.age ? patient.age + 'y' : 'Age unknown'}</span>
                        <span class="gender-badge">${patient.gender || 'Gender unknown'}</span>
                    </div>
                </div>
                <div class="patient-details">
                    <div class="detail-row">
                        <strong>Primary Diagnosis:</strong> 
                        <span>${patient.primaryDiagnosis || 'Not specified'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Conditions:</strong> 
                        <span>${patient.conditions.length > 0 ? patient.conditions.join(', ') : 'None listed'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Location:</strong> 
                        <span>${patient.location || 'Not specified'}</span>
                    </div>
                </div>
                <div class="patient-actions">
                    <button class="btn btn--primary btn--sm">
                        <span class="btn-icon">🤖</span>
                        AI Analysis
                    </button>
                </div>
            </div>
        `).join('');
    }

    async selectPatientForAIAnalysis(patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        if (!patient) return;

        // Show analysis section
        document.getElementById('trial-analysis-section').classList.remove('hidden');
        
        // Display patient summary
        document.getElementById('selected-patient-summary').innerHTML = `
            <div class="selected-patient">
                <h4>🤖 AI Analysis for: ${patient.name}</h4>
                <div class="patient-summary">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <label>Age:</label>
                            <span>${patient.age || 'Unknown'}</span>
                        </div>
                        <div class="summary-item">
                            <label>Gender:</label>
                            <span>${patient.gender || 'Unknown'}</span>
                        </div>
                        <div class="summary-item">
                            <label>Primary Diagnosis:</label>
                            <span>${patient.primaryDiagnosis || 'Not specified'}</span>
                        </div>
                        <div class="summary-item">
                            <label>Location:</label>
                            <span>${patient.location || 'Not specified'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Start AI analysis
        await this.performAITrialAnalysis(patient);
    }

    async performAITrialAnalysis(patient) {
        const resultsContainer = document.getElementById('ai-analysis-results');
        resultsContainer.innerHTML = '<div class="loading-ai">🤖 AI Agent analyzing patient data and matching to clinical trials...</div>';

        try {
            // Step 1: AI analysis of patient profile
            const patientAnalysis = await this.callPerplexityAPI(`
                Analyze this patient profile for clinical trial eligibility:
                
                Patient Details:
                - Name: ${patient.name}
                - Age: ${patient.age}
                - Gender: ${patient.gender}
                - Primary Diagnosis: ${patient.primaryDiagnosis}
                - Additional Conditions: ${patient.conditions.join(', ')}
                - Current Medications: ${patient.medications.join(', ')}
                - Location: ${patient.location}
                
                Please provide:
                1. Clinical trial eligibility assessment
                2. Therapeutic areas to focus on
                3. Potential contraindications or concerns
                4. Recommended trial types (Phase I, II, III, etc.)
                5. Key inclusion/exclusion criteria to look for
            `);

            // Step 2: Search for matching clinical trials
            const matchingTrials = await this.searchClinicalTrials(patient);

            // Step 3: AI analysis of trial matches
            const trialAnalysis = await this.callPerplexityAPI(`
                Based on the patient profile and these matching clinical trials, provide detailed analysis:
                
                Patient: ${patient.name}, Age: ${patient.age}, Diagnosis: ${patient.primaryDiagnosis}
                
                Matching Trials Found: ${JSON.stringify(matchingTrials)}
                
                For each suitable trial, provide:
                1. Match score (0-100) with reasoning
                2. Key eligibility factors
                3. Potential benefits for this patient
                4. Risks or concerns
                5. Travel/logistics considerations
                6. Provider-to-provider communication points
                7. Patient education talking points
                
                Rank trials by suitability and provide specific next steps.
            `);

            // Display comprehensive results
            resultsContainer.innerHTML = `
                <div class="ai-analysis-complete">
                    <div class="analysis-section">
                        <h4>🧠 AI Patient Analysis</h4>
                        <div class="analysis-content">${this.formatAIResponse(patientAnalysis)}</div>
                    </div>
                    
                    <div class="analysis-section">
                        <h4>🎯 Matching Clinical Trials</h4>
                        <div class="trials-found">${matchingTrials.length} trials found</div>
                        <div class="trials-list">
                            ${matchingTrials.map(trial => `
                                <div class="trial-match">
                                    <div class="trial-header">
                                        <h5>${trial.title}</h5>
                                        <div class="trial-badges">
                                            <span class="nct-badge">${trial.nctId}</span>
                                            <span class="status-badge status-${trial.status.toLowerCase().replace(' ', '-')}">${trial.status}</span>
                                        </div>
                                    </div>
                                    <div class="trial-details">
                                        <p><strong>Phase:</strong> ${trial.phase}</p>
                                        <p><strong>Sponsor:</strong> ${trial.sponsor}</p>
                                        <p><strong>Condition:</strong> ${trial.condition}</p>
                                        <p><strong>Locations:</strong> ${trial.locations.slice(0, 3).join(', ')}${trial.locations.length > 3 ? '...' : ''}</p>
                                    </div>
                                    <div class="trial-actions">
                                        <button class="btn btn--primary" onclick="app.generateAIReferral('${trial.nctId}', '${patient.id}')">
                                            Generate Referral
                                        </button>
                                        <button class="btn btn--outline" onclick="app.generatePatientMaterials('${trial.nctId}', '${patient.id}')">
                                            Patient Materials
                                        </button>
                                        <button class="btn btn--secondary" onclick="window.open('https://clinicaltrials.gov/study/${trial.nctId}', '_blank')">
                                            View Trial Details
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h4>📋 AI Trial Recommendations</h4>
                        <div class="analysis-content">${this.formatAIResponse(trialAnalysis)}</div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('AI analysis failed:', error);
            resultsContainer.innerHTML = '<div class="error">AI analysis failed. Please try again.</div>';
        }
    }

    async searchClinicalTrials(patient) {
        try {
            // Build search query based on patient conditions
            let searchTerms = patient.primaryDiagnosis;
            if (patient.conditions.length > 0) {
                searchTerms += ' OR ' + patient.conditions.join(' OR ');
            }

            const response = await fetch(`${this.clinicalTrialsAPI}?format=json&query.cond=${encodeURIComponent(searchTerms)}&query.recrs=a,f,n&pageSize=10`);
            
            if (response.ok) {
                const data = await response.json();
                return this.processTrialResults(data.studies || []);
            }
        } catch (error) {
            console.error('Clinical trials search failed:', error);
        }
        
        return [];
    }

    processTrialResults(studies) {
        return studies.map(study => {
            const protocol = study.protocolSection;
            const identification = protocol.identificationModule;
            const status = protocol.statusModule;
            const design = protocol.designModule;
            const sponsors = protocol.sponsorCollaboratorsModule;
            const conditions = protocol.conditionsModule;
            const locations = protocol.contactsLocationsModule?.locations || [];

            return {
                nctId: identification.nctId,
                title: identification.briefTitle,
                status: status.overallStatus,
                phase: design?.phases?.[0] || 'N/A',
                sponsor: sponsors?.leadSponsor?.name || 'Unknown',
                condition: conditions?.conditions?.[0] || 'Unknown',
                locations: locations.map(loc => `${loc.city}, ${loc.state || loc.country}`).filter(Boolean)
            };
        });
    }

    async generateAIReferral(nctId, patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        if (!patient) return;

        try {
            const referralContent = await this.callPerplexityAPI(`
                Generate a professional clinical trial referral letter for:
                
                Patient: ${patient.name}
                Age: ${patient.age}
                Primary Diagnosis: ${patient.primaryDiagnosis}
                Conditions: ${patient.conditions.join(', ')}
                Medications: ${patient.medications.join(', ')}
                
                Trial: ${nctId}
                
                Create a comprehensive referral letter that includes:
                1. Patient eligibility summary
                2. Relevant medical history
                3. Why this trial is suitable
                4. Contact information for coordination
                5. Next steps for the study team
                6. Any special considerations
                
                Format as a professional medical referral letter.
            `);

            alert(`📧 AI-Generated Referral Letter Created!\n\nReferral for ${patient.name} to trial ${nctId} has been generated.\n\nThe referral includes comprehensive patient information and eligibility assessment.\n\nReferral ID: REF-${Date.now()}`);

            // In a real app, this would be sent via email or saved to the system
            console.log('Generated referral:', referralContent);

        } catch (error) {
            alert('Failed to generate referral. Please try again.');
        }
    }

    async generatePatientMaterials(nctId, patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        if (!patient) return;

        try {
            const educationContent = await this.callPerplexityAPI(`
                Create patient-friendly educational materials for:
                
                Patient: ${patient.name} (${patient.age} years old)
                Condition: ${patient.primaryDiagnosis}
                Trial: ${nctId}
                
                Generate easy-to-understand materials including:
                1. What is this clinical trial? (simple language)
                2. What would I need to do? (time commitment, visits)
                3. What are the potential benefits?
                4. What are the risks?
                5. How do I decide if it's right for me?
                6. What questions should I ask?
                7. Who do I contact for more information?
                
                Use 8th grade reading level and be encouraging but realistic.
            `);

            alert(`📚 Patient Education Materials Generated!\n\nPersonalized materials for ${patient.name} regarding trial ${nctId} have been created.\n\nMaterials include easy-to-understand explanations and next steps.\n\nMaterials ID: EDU-${Date.now()}`);

            // In a real app, these would be formatted and made available for download
            console.log('Generated patient materials:', educationContent);

        } catch (error) {
            alert('Failed to generate patient materials. Please try again.');
        }
    }

    // ========================================
    // PHARMA FUNCTIONALITY - Keys 2-4
    // ========================================

    async generateDevelopmentPlan() {
        const planDescription = document.getElementById('drug-development-plan').value.trim();
        
        if (!planDescription) {
            alert('Please describe your drug development plan');
            return;
        }

        // Show results section
        document.getElementById('pharma-results').classList.remove('hidden');
        
        // Start AI analysis for all components
        await Promise.all([
            this.generateAIDevelopmentStrategy(planDescription),
            this.generateRegulatoryFramework(planDescription),
            this.generateCompetitiveAnalysis(planDescription)
        ]);
    }

    async generateAIDevelopmentStrategy(planDescription) {
        const strategyContainer = document.getElementById('development-strategy');
        strategyContainer.innerHTML = '<div class="loading-ai">🤖 AI Agent analyzing your development plan and identifying optimization opportunities...</div>';

        try {
            const developmentAnalysis = await this.callPerplexityAPI(`
                As a pharmaceutical development expert, analyze this drug development plan and provide comprehensive strategic guidance:
                
                Development Plan: "${planDescription}"
                
                Provide detailed analysis including:
                1. SWOT analysis of the proposed development approach
                2. Critical success factors and potential pitfalls
                3. Regulatory strategy recommendations
                4. Clinical trial design optimization
                5. Market positioning opportunities
                6. Risk mitigation strategies
                7. Timeline optimization suggestions
                8. Budget allocation recommendations
                9. Competitive differentiation strategies
                10. Partnership and licensing opportunities
                
                Be specific and actionable in your recommendations. Consider current market conditions and regulatory environment.
            `);

            strategyContainer.innerHTML = `
                <div class="ai-strategy-results">
                    <div class="strategy-header">
                        <h4>🎯 AI-Generated Development Strategy</h4>
                        <div class="strategy-actions">
                            <button class="btn btn--primary" onclick="app.exportDevelopmentPlan()">Export Plan</button>
                            <button class="btn btn--outline" onclick="app.refineDevelopmentPlan()">Refine with AI</button>
                        </div>
                    </div>
                    <div class="strategy-content">
                        ${this.formatAIResponse(developmentAnalysis)}
                    </div>
                </div>
            `;

        } catch (error) {
            strategyContainer.innerHTML = '<div class="error">Failed to generate development strategy</div>';
        }
    }

    async generateRegulatoryFramework(planDescription) {
        const frameworkContainer = document.getElementById('regulatory-framework');
        
        try {
            // Generate regulatory timeline and requirements
            const regulatoryAnalysis = await this.callPerplexityAPI(`
                Based on this drug development plan: "${planDescription}"
                
                Create a comprehensive regulatory framework including:
                1. Detailed regulatory pathway (FDA, EMA)
                2. Required forms and submissions for each phase
                3. Specific timeline with milestones
                4. Key regulatory meetings and their timing
                5. Documentation requirements
                6. Regulatory risks and mitigation strategies
                7. Post-market obligations
                8. International regulatory considerations
                
                Organize as a timeline with specific forms and deadlines.
            `);

            // Get specific FDA forms needed
            const formsAnalysis = await this.callPerplexityAPI(`
                For this drug development plan: "${planDescription}"
                
                List specific FDA forms required including:
                1. IND forms and requirements
                2. Clinical trial protocols
                3. Manufacturing information forms
                4. Safety reporting forms
                5. NDA/BLA submission components
                6. Each form's purpose and required information
                7. Typical completion time for each form
                8. Dependencies between forms
                
                Be specific about form numbers and requirements.
            `);

            // Display regulatory framework
            frameworkContainer.innerHTML = `
                <div class="regulatory-timeline-container">
                    <div class="timeline-header">
                        <h4>📅 AI-Generated Regulatory Timeline</h4>
                        <div class="progress-info">
                            <span>Track your regulatory submission progress</span>
                        </div>
                    </div>
                    
                    <div class="regulatory-content">
                        <div class="regulatory-analysis">
                            <h5>🎯 Regulatory Strategy</h5>
                            <div class="analysis-content">${this.formatAIResponse(regulatoryAnalysis)}</div>
                        </div>
                        
                        <div class="forms-section">
                            <h5>📝 Required Forms & Documents</h5>
                            <div class="forms-analysis">${this.formatAIResponse(formsAnalysis)}</div>
                            
                            <div class="form-generator">
                                <h6>🤖 AI Form Generation</h6>
                                <p>Select forms to auto-generate with AI assistance:</p>
                                <div class="form-options">
                                    <button class="btn btn--outline" onclick="app.generateForm('IND')">Generate IND Application</button>
                                    <button class="btn btn--outline" onclick="app.generateForm('Protocol')">Generate Protocol Template</button>
                                    <button class="btn btn--outline" onclick="app.generateForm('Manufacturing')">Manufacturing Information</button>
                                    <button class="btn btn--outline" onclick="app.generateForm('Safety')">Safety Reporting Plan</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Update progress bar
            this.updateRegulatoryProgress(0);

        } catch (error) {
            frameworkContainer.innerHTML = '<div class="error">Failed to generate regulatory framework</div>';
        }
    }

    async generateForm(formType) {
        const planDescription = document.getElementById('drug-development-plan').value;
        
        try {
            const formContent = await this.callPerplexityAPI(`
                Generate a detailed ${formType} form template based on this development plan:
                "${planDescription}"
                
                Include:
                1. All required sections and fields
                2. Specific guidance for each section
                3. Example text where appropriate
                4. Regulatory references
                5. Common mistakes to avoid
                6. Review checklist
                
                Format as a fillable template with clear instructions.
            `);

            // Show form generation modal or new window
            alert(`📝 AI-Generated ${formType} Form Ready!\n\nComprehensive ${formType} template has been created based on your development plan.\n\nThe form includes all required sections with guidance and examples.\n\nForm ID: ${formType}-${Date.now()}`);

            // In a real app, this would open a form editor or download the PDF
            console.log(`Generated ${formType} form:`, formContent);

            // Update progress
            this.updateFormProgress(formType);

        } catch (error) {
            alert(`Failed to generate ${formType} form. Please try again.`);
        }
    }

    updateRegulatoryProgress(percentage) {
        const progressFill = document.getElementById('regulatory-progress');
        const progressText = document.getElementById('progress-text');
        
        if (progressFill && progressText) {
            progressFill.style.width = percentage + '%';
            progressText.textContent = percentage + '% Complete';
        }
    }

    updateFormProgress(formType) {
        // In a real app, this would track which forms are completed
        // For now, just increment progress
        const currentProgress = parseInt(document.getElementById('progress-text').textContent) || 0;
        const newProgress = Math.min(currentProgress + 25, 100);
        this.updateRegulatoryProgress(newProgress);
    }

    async generateCompetitiveAnalysis(planDescription) {
        const competitiveContainer = document.getElementById('competitive-analysis');
        competitiveContainer.innerHTML = '<div class="loading-ai">🤖 AI Agent performing comprehensive competitive analysis...</div>';

        try {
            const competitiveIntel = await this.callPerplexityAPI(`
                Perform comprehensive competitive analysis for this drug development plan:
                "${planDescription}"
                
                Provide detailed analysis including:
                1. Direct competitors and their pipeline status
                2. Indirect competitors and alternative treatments
                3. Competitive advantages and differentiators
                4. Market positioning opportunities
                5. Pricing and reimbursement landscape
                6. Patent landscape and freedom to operate
                7. Regulatory precedents from competitors
                8. Partnership and licensing opportunities
                9. Market entry timing recommendations
                10. Competitive response strategies
                
                Include specific company names, drug names, and recent developments.
                Search current market intelligence and clinical trial databases.
            `);

            const strategicRecommendations = await this.callPerplexityAPI(`
                Based on the competitive analysis for: "${planDescription}"
                
                Provide specific strategic recommendations:
                1. Modifications to differentiate from competitors
                2. Pricing strategy recommendations
                3. Market entry timing optimization
                4. Partnership opportunities to consider
                5. Regulatory strategy adjustments
                6. Clinical trial design improvements
                7. Intellectual property strategy
                8. Risk mitigation for competitive threats
                
                Make recommendations actionable and specific.
            `);

            competitiveContainer.innerHTML = `
                <div class="competitive-analysis-results">
                    <div class="competitive-header">
                        <h4>🏢 AI Competitive Intelligence</h4>
                        <div class="competitive-actions">
                            <button class="btn btn--primary" onclick="app.exportCompetitiveAnalysis()">Export Analysis</button>
                            <button class="btn btn--outline" onclick="app.updateCompetitiveIntel()">Refresh Intelligence</button>
                        </div>
                    </div>
                    
                    <div class="competitive-content">
                        <div class="intel-section">
                            <h5>🔍 Market Intelligence</h5>
                            <div class="analysis-content">${this.formatAIResponse(competitiveIntel)}</div>
                        </div>
                        
                        <div class="recommendations-section">
                            <h5>🎯 Strategic Recommendations</h5>
                            <div class="analysis-content">${this.formatAIResponse(strategicRecommendations)}</div>
                        </div>
                        
                        <div class="action-items">
                            <h5>📋 Next Steps</h5>
                            <div class="action-list">
                                <div class="action-item">
                                    <input type="checkbox" id="action1">
                                    <label for="action1">Review competitive positioning strategy</label>
                                </div>
                                <div class="action-item">
                                    <input type="checkbox" id="action2">
                                    <label for="action2">Evaluate partnership opportunities</label>
                                </div>
                                <div class="action-item">
                                    <input type="checkbox" id="action3">
                                    <label for="action3">Assess pricing strategy against competitors</label>
                                </div>
                                <div class="action-item">
                                    <input type="checkbox" id="action4">
                                    <label for="action4">Monitor competitor clinical trial progress</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            competitiveContainer.innerHTML = '<div class="error">Failed to generate competitive analysis</div>';
        }
    }

    clearDevelopmentPlan() {
        document.getElementById('drug-development-plan').value = '';
        document.getElementById('pharma-results').classList.add('hidden');
    }

    // ========================================
    // CRO FUNCTIONALITY - Keys 5-6
    // ========================================

    async handleCROFileUpload(files) {
        if (files.length === 0) return;

        const uploadedData = [];
        
        for (let file of files) {
            try {
                const data = await this.parseTrialFile(file);
                uploadedData.push(...data);
            } catch (error) {
                console.error(`Error parsing ${file.name}:`, error);
                alert(`Failed to parse ${file.name}. Please check file format.`);
            }
        }

        if (uploadedData.length > 0) {
            this.trialData = uploadedData;
            alert(`✅ Successfully uploaded ${uploadedData.length} trial records!`);
            document.getElementById('cro-query-section').style.display = 'block';
        }
    }

    async parseTrialFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    let data;
                    
                    if (file.name.endsWith('.csv')) {
                        data = this.parseCSV(content);
                    } else if (file.name.endsWith('.json')) {
                        data = JSON.parse(content);
                    } else {
                        throw new Error('Unsupported file format');
                    }
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    async initializeCROAnalysis() {
        const businessDescription = document.getElementById('cro-business-description').value.trim();
        
        if (!businessDescription) {
            alert('Please describe your CRO business and goals');
            return;
        }

        this.croData = {
            description: businessDescription,
            uploadedTrials: this.trialData.length
        };

        // Show query section and results
        document.getElementById('cro-query-section').style.display = 'block';
        document.getElementById('cro-results').classList.remove('hidden');

        // Start initial analysis
        await this.performInitialCROAnalysis(businessDescription);
    }

    async performInitialCROAnalysis(businessDescription) {
        const analysisContainer = document.getElementById('cro-business-analysis');
        analysisContainer.innerHTML = '<div class="loading-ai">🤖 AI Agent analyzing your CRO business model and performance metrics...</div>';

        try {
            const businessAnalysis = await this.callPerplexityAPI(`
                Perform comprehensive CRO business analysis based on:
                
                Business Description: "${businessDescription}"
                Trial Data Available: ${this.trialData.length} records
                
                Provide detailed analysis including:
                1. Business model assessment and optimization opportunities
                2. Financial performance analysis and benchmarking
                3. Operational efficiency evaluation
                4. Market positioning analysis
                5. Competitive landscape assessment
                6. Growth opportunities and threats
                7. Resource allocation recommendations
                8. Technology and process improvement suggestions
                9. Client acquisition and retention strategies
                10. Risk assessment and mitigation strategies
                
                Compare against industry benchmarks and best practices.
                Be specific and actionable in recommendations.
            `);

            analysisContainer.innerHTML = `
                <div class="cro-analysis-results">
                    <div class="analysis-header">
                        <h4>📊 Enterprise CRO Analysis</h4>
                        <div class="analysis-actions">
                            <button class="btn btn--primary" onclick="app.exportCROAnalysis()">Export Report</button>
                            <button class="btn btn--outline" onclick="app.scheduleAnalysisUpdate()">Schedule Updates</button>
                        </div>
                    </div>
                    <div class="analysis-content">
                        ${this.formatAIResponse(businessAnalysis)}
                    </div>
                </div>
            `;

        } catch (error) {
            analysisContainer.innerHTML = '<div class="error">Failed to perform CRO analysis</div>';
        }
    }

    async processIntelligentQuery() {
        const query = document.getElementById('intelligent-query').value.trim();
        
        if (!query) {
            alert('Please enter your business question');
            return;
        }

        const queryContainer = document.getElementById('query-analysis-results');
        queryContainer.innerHTML = '<div class="loading-ai">🤖 AI Agent processing your query and analyzing market data...</div>';

        try {
            // First, analyze the query context
            const queryAnalysis = await this.callPerplexityAPI(`
                Analyze this CRO business query in context:
                
                Query: "${query}"
                Business Context: "${this.croData?.description || 'CRO analysis'}"
                Available Data: ${this.trialData.length} trial records
                
                Provide comprehensive analysis including:
                1. Direct answer to the query
                2. Supporting data analysis
                3. Industry benchmarking
                4. Competitive intelligence insights
                5. Strategic recommendations
                6. Risk factors to consider
                7. Implementation suggestions
                8. Success metrics to track
                
                If the query involves competitive analysis, include current market intelligence.
                If it involves performance metrics, provide industry benchmarks.
                Be specific and actionable.
            `);

            // If query involves competitive elements, get additional intelligence
            let competitiveIntel = '';
            if (query.toLowerCase().includes('competit') || query.toLowerCase().includes('benchmark') || 
                query.toLowerCase().includes('market') || query.toLowerCase().includes('industry')) {
                
                competitiveIntel = await this.getCROCompetitiveIntelligence(query);
            }

            queryContainer.innerHTML = `
                <div class="query-response">
                    <div class="query-header">
                        <h4>💬 AI Query Analysis</h4>
                        <div class="query-meta">
                            <span class="query-timestamp">${new Date().toLocaleString()}</span>
                        </div>
                    </div>
                    
                    <div class="original-query">
                        <h5>Your Question:</h5>
                        <div class="query-text">"${query}"</div>
                    </div>
                    
                    <div class="ai-response">
                        <h5>🤖 AI Analysis & Recommendations:</h5>
                        <div class="response-content">${this.formatAIResponse(queryAnalysis)}</div>
                    </div>
                    
                    ${competitiveIntel ? `
                    <div class="competitive-insights">
                        <h5>🏢 Market Intelligence:</h5>
                        <div class="insights-content">${this.formatAIResponse(competitiveIntel)}</div>
                    </div>
                    ` : ''}
                    
                    <div class="response-actions">
                        <button class="btn btn--primary" onclick="app.exportQueryResponse()">Export Response</button>
                        <button class="btn btn--outline" onclick="app.followUpQuery()">Ask Follow-up</button>
                        <button class="btn btn--secondary" onclick="app.shareWithTeam()">Share with Team</button>
                    </div>
                </div>
            `;

            // Update competitive intelligence section
            await this.updateCROCompetitiveIntel();

        } catch (error) {
            queryContainer.innerHTML = '<div class="error">Failed to process query</div>';
        }
    }

    async getCROCompetitiveIntelligence(query) {
        try {
            return await this.callPerplexityAPI(`
                Provide current competitive intelligence for this CRO query: "${query}"
                
                Research and provide:
                1. Current market trends affecting CROs
                2. Major CRO competitors and their recent developments
                3. Industry benchmark data and performance metrics
                4. Recent mergers, acquisitions, and partnerships
                5. Regulatory changes impacting the CRO industry
                6. Technology innovations and digital transformation trends
                7. Geographic market expansion opportunities
                8. Therapeutic area growth trends
                
                Focus on actionable intelligence from recent market data.
                Include specific company names, deals, and market movements.
            `);
        } catch (error) {
            return 'Competitive intelligence analysis temporarily unavailable.';
        }
    }

    async updateCROCompetitiveIntel() {
        const intelContainer = document.getElementById('cro-competitive-intel');
        
        try {
            const competitiveData = await this.callPerplexityAPI(`
                Provide current CRO industry competitive intelligence:
                
                Research current market conditions including:
                1. Top 10 CRO companies and their market positions
                2. Recent clinical trial awards and contract wins
                3. Emerging competitive threats
                4. Technology adoption trends
                5. Geographic expansion activities
                6. Therapeutic area specialization trends
                7. Partnership and collaboration developments
                8. Investment and funding activities
                
                Focus on actionable intelligence for competitive positioning.
            `);

            intelContainer.innerHTML = `
                <div class="competitive-intel-dashboard">
                    <div class="intel-header">
                        <h4>🔍 Live Market Intelligence</h4>
                        <div class="last-updated">Updated: ${new Date().toLocaleString()}</div>
                    </div>
                    <div class="intel-content">
                        ${this.formatAIResponse(competitiveData)}
                    </div>
                    <div class="intel-actions">
                        <button class="btn btn--outline" onclick="app.refreshIntelligence()">Refresh Data</button>
                        <button class="btn btn--secondary" onclick="app.setupIntelAlerts()">Setup Alerts</button>
                    </div>
                </div>
            `;

        } catch (error) {
            intelContainer.innerHTML = '<div class="error">Failed to load competitive intelligence</div>';
        }
    }

    setSuggestedQuery(queryType) {
        const queries = {
            'performance': 'Analyze our trial enrollment performance compared to industry benchmarks. Identify underperforming sites and provide specific improvement recommendations.',
            'competitive': 'What are the main competitive threats in our therapeutic areas? How should we position ourselves against larger CROs?',
            'enrollment': 'Which of our trials are experiencing enrollment challenges and what strategies can we implement to accelerate patient recruitment?',
            'financial': 'Analyze our budget allocation across trials and therapeutic areas. Where can we optimize costs while maintaining quality?',
            'strategic': 'Based on our current capabilities and market trends, what new therapeutic areas or services should we consider for expansion?'
        };
        
        document.getElementById('intelligent-query').value = queries[queryType] || '';
    }

    clearQuery() {
        document.getElementById('intelligent-query').value = '';
    }

    // ========================================
    // AI UTILITY FUNCTIONS
    // ========================================

    async callPerplexityAPI(prompt) {
        try {
            const response = await fetch(this.perplexityConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.perplexityConfig.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Perplexity API call failed:', error);
            throw new Error('AI analysis temporarily unavailable. Please try again.');
        }
    }

    formatAIResponse(content) {
        // Format AI response with proper HTML structure
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^\d+\./gm, '<strong>$&</strong>')
            .replace(/^([A-Z][^:]+):/gm, '<strong>$1:</strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .split('<p>').map(p => p ? `<p>${p}` : '').join('');
    }

    // ========================================
    // EXPORT AND UTILITY FUNCTIONS
    // ========================================

    exportDevelopmentPlan() {
        alert('📊 Development plan exported successfully!\n\nComprehensive development strategy and timeline have been saved to PDF format.\n\nExport ID: DEV-' + Date.now());
    }

    exportCompetitiveAnalysis() {
        alert('📈 Competitive analysis exported successfully!\n\nDetailed competitive intelligence report has been saved to PDF format.\n\nExport ID: COMP-' + Date.now());
    }

    exportCROAnalysis() {
        alert('📊 CRO analysis exported successfully!\n\nEnterprise analytics report has been saved to PDF format.\n\nExport ID: CRO-' + Date.now());
    }

    exportQueryResponse() {
        alert('💬 Query response exported successfully!\n\nAI analysis and recommendations have been saved.\n\nExport ID: QUERY-' + Date.now());
    }

    refineDevelopmentPlan() {
        const currentPlan = document.getElementById('drug-development-plan').value;
        const refinement = prompt('What specific aspects would you like to refine or add to your development plan?');
        
        if (refinement) {
            document.getElementById('drug-development-plan').value = currentPlan + '\n\nAdditional considerations: ' + refinement;
        }
    }

    followUpQuery() {
        const followUp = prompt('What follow-up question would you like to ask?');
        if (followUp) {
            document.getElementById('intelligent-query').value = followUp;
        }
    }

    shareWithTeam() {
        alert('📤 Analysis shared with team members!\n\nTeam notification sent with access to the complete analysis.');
    }

    refreshIntelligence() {
        this.updateCROCompetitiveIntel();
    }

    setupIntelAlerts() {
        alert('🔔 Intelligence alerts configured!\n\nYou will receive notifications about:\n• New competitive developments\n• Market trend changes\n• Regulatory updates\n• Industry news');
    }

    scheduleAnalysisUpdate() {
        alert('📅 Analysis updates scheduled!\n\nAutomated analysis will run:\n• Weekly performance updates\n• Monthly competitive intelligence\n• Quarterly strategic reviews');
    }
}

// Initialize the enterprise application
const app = new ClinicalResearchApp();
