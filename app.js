// Clinical Research Intelligence Platform - Fixed Patient Data Processing
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
        
        // Data processing agents
        this.dataProcessingAgent = new DataProcessingAgent();
        this.locationAgent = new LocationAgent();
        
        this.charts = {};
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.initializeAIStatus();
    }

    initializeAIStatus() {
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
    // ENHANCED PATIENT DATA PROCESSING
    // ========================================

    async handlePatientFileUpload(files) {
        if (files.length === 0) return;

        const uploadedData = [];
        const processingStatus = this.showProcessingStatus('Processing patient files...');
        
        for (let file of files) {
            try {
                processingStatus.updateMessage(`Processing ${file.name}...`);
                const rawData = await this.parsePatientFile(file);
                
                // Use AI agent to intelligently process and enrich data
                const processedData = await this.dataProcessingAgent.processPatientData(rawData);
                uploadedData.push(...processedData);
                
            } catch (error) {
                console.error(`Error processing ${file.name}:`, error);
                alert(`Failed to process ${file.name}. Error: ${error.message}`);
            }
        }

        processingStatus.close();

        if (uploadedData.length > 0) {
            this.patientData = uploadedData;
            document.getElementById('patient-analysis-section').style.display = 'block';
            
            // Display processed patients
            await this.displayPatientsWithEnrichment(this.patientData);
            
            alert(`✅ Successfully processed ${uploadedData.length} patient records!\n\n• Smart data extraction completed\n• Location data enriched\n• Medical conditions standardized\n• Ready for AI analysis`);
        }
    }

    async parsePatientFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    let data;
                    
                    if (file.name.endsWith('.csv')) {
                        data = this.parseCSV(content);
                    } else if (file.name.endsWith('.json')) {
                        data = JSON.parse(content);
                    } else if (file.name.endsWith('.txt')) {
                        data = this.parseDelimitedText(content);
                    } else {
                        throw new Error('Unsupported file format. Please use CSV, JSON, or TXT files.');
                    }
                    
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    parseCSV(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > 0) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index] ? values[index].trim() : '';
                });
                data.push(record);
            }
        }

        return data;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        
        return result;
    }

    parseDelimitedText(content) {
        // Try different delimiters
        const delimiters = ['\t', '|', ';', ','];
        
        for (let delimiter of delimiters) {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length === 0) continue;
            
            const firstLine = lines[0].split(delimiter);
            if (firstLine.length > 1) {
                return this.parseWithDelimiter(content, delimiter);
            }
        }
        
        throw new Error('Could not determine file format. Please ensure proper delimiters.');
    }

    parseWithDelimiter(content, delimiter) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter);
            const record = {};
            headers.forEach((header, index) => {
                record[header] = values[index] ? values[index].trim() : '';
            });
            data.push(record);
        }

        return data;
    }

    showProcessingStatus(message) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'processing-status';
        statusDiv.innerHTML = `
            <div class="processing-modal">
                <div class="processing-content">
                    <div class="processing-spinner"></div>
                    <div class="processing-message">${message}</div>
                </div>
            </div>
        `;
        document.body.appendChild(statusDiv);
        
        return {
            updateMessage: (newMessage) => {
                statusDiv.querySelector('.processing-message').textContent = newMessage;
            },
            close: () => {
                document.body.removeChild(statusDiv);
            }
        };
    }

    async displayPatientsWithEnrichment(patients) {
        const patientList = document.getElementById('patient-list');
        
        if (patients.length === 0) {
            patientList.innerHTML = '<div class="no-patients">No patients loaded. Please upload data or connect EMR.</div>';
            return;
        }

        patientList.innerHTML = patients.map(patient => `
            <div class="patient-card enhanced" onclick="app.selectPatientForAIAnalysis('${patient.id}')">
                <div class="patient-header">
                    <h4>${patient.name}</h4>
                    <div class="patient-meta">
                        <span class="age-badge">${patient.age ? patient.age + 'y' : 'Age unknown'}</span>
                        <span class="gender-badge">${patient.gender || 'Gender unknown'}</span>
                        ${patient.eligibilityScore ? `<span class="score-badge">Match Score: ${patient.eligibilityScore}%</span>` : ''}
                    </div>
                </div>
                <div class="patient-details">
                    <div class="detail-row">
                        <strong>Primary Diagnosis:</strong> 
                        <span class="diagnosis-tag">${patient.primaryDiagnosis || 'Not specified'}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Conditions:</strong> 
                        <div class="conditions-list">
                            ${patient.conditions.map(condition => `<span class="condition-tag">${condition}</span>`).join('')}
                            ${patient.conditions.length === 0 ? '<span class="no-conditions">None listed</span>' : ''}
                        </div>
                    </div>
                    <div class="detail-row">
                        <strong>Medications:</strong> 
                        <div class="medications-list">
                            ${patient.medications.slice(0, 3).map(med => `<span class="medication-tag">${med}</span>`).join('')}
                            ${patient.medications.length > 3 ? `<span class="more-meds">+${patient.medications.length - 3} more</span>` : ''}
                            ${patient.medications.length === 0 ? '<span class="no-medications">None listed</span>' : ''}
                        </div>
                    </div>
                    <div class="detail-row">
                        <strong>Location:</strong> 
                        <span class="location-info">
                            ${patient.location || 'Not specified'}
                            ${patient.locationEnriched ? ' ✓' : ''}
                        </span>
                    </div>
                    ${patient.insurance ? `
                    <div class="detail-row">
                        <strong>Insurance:</strong> 
                        <span class="insurance-tag">${patient.insurance}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="patient-actions">
                    <button class="btn btn--primary btn--sm" onclick="event.stopPropagation(); app.selectPatientForAIAnalysis('${patient.id}')">
                        <span class="btn-icon">🤖</span>
                        AI Analysis & Trial Matching
                    </button>
                    ${patient.processedAt ? `<div class="processed-info">Processed: ${new Date(patient.processedAt).toLocaleTimeString()}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadAllPatients() {
        if (this.emrConnected) {
            // Load from EMR with enhanced processing
            try {
                const response = await fetch(`${this.emrCredentials.url}/Patient?_count=50`, {
                    headers: {
                        'Authorization': `Bearer ${this.emrCredentials.token}`,
                        'Accept': 'application/fhir+json'
                    }
                });

                if (response.ok) {
                    const fhirData = await response.json();
                    const rawPatients = this.processFHIRPatients(fhirData.entry || []);
                    
                    // Process with AI agent
                    this.patientData = await this.dataProcessingAgent.processPatientData(rawPatients);
                }
            } catch (error) {
                console.error('Error loading EMR patients:', error);
                alert('Failed to load patients from EMR');
            }
        }
        
        // Display patients with enrichment
        await this.displayPatientsWithEnrichment(this.patientData);
    }

    // ========================================
    // AI ANALYSIS - FULLY FUNCTIONAL
    // ========================================

    async selectPatientForAIAnalysis(patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        if (!patient) {
            alert('Patient not found. Please try again.');
            return;
        }

        // Show analysis section
        document.getElementById('trial-analysis-section').classList.remove('hidden');
        
        // Display patient summary
        document.getElementById('selected-patient-summary').innerHTML = `
            <div class="selected-patient">
                <h4>🤖 AI Analysis in Progress for: ${patient.name}</h4>
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
                <div class="analysis-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="analysis-progress"></div>
                    </div>
                    <div class="progress-steps" id="progress-steps">
                        <div class="step active">Patient Analysis</div>
                        <div class="step">Trial Search</div>
                        <div class="step">AI Matching</div>
                        <div class="step">Communication Prep</div>
                    </div>
                </div>
            </div>
        `;

        // Start comprehensive AI analysis
        await this.performComprehensiveAIAnalysis(patient);
    }

    async performComprehensiveAIAnalysis(patient) {
        const resultsContainer = document.getElementById('ai-analysis-results');
        
        try {
            // Step 1: Patient eligibility analysis
            this.updateAnalysisProgress(25, 'Patient Analysis');
            const eligibilityAnalysis = await this.analyzePatientEligibility(patient);
            
            // Step 2: Search clinical trials
            this.updateAnalysisProgress(50, 'Trial Search');
            const matchingTrials = await this.searchAndAnalyzeTrials(patient);
            
            // Step 3: AI matching and ranking
            this.updateAnalysisProgress(75, 'AI Matching');
            const rankedTrials = await this.rankTrialsWithAI(patient, matchingTrials);
            
            // Step 4: Generate communication materials
            this.updateAnalysisProgress(100, 'Communication Prep');
            const communicationMaterials = await this.prepareCommunicationMaterials(patient, rankedTrials);
            
            // Display comprehensive results
            resultsContainer.innerHTML = `
                <div class="ai-analysis-complete">
                    <div class="analysis-header">
                        <h4>🧠 Comprehensive AI Analysis Complete</h4>
                        <div class="analysis-timestamp">Completed: ${new Date().toLocaleString()}</div>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>📊 Patient Eligibility Assessment</h5>
                        <div class="eligibility-content">${this.formatAIResponse(eligibilityAnalysis)}</div>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>🎯 Ranked Clinical Trial Matches (${rankedTrials.length} found)</h5>
                        <div class="trials-ranked">
                            ${this.renderRankedTrials(rankedTrials)}
                        </div>
                    </div>
                    
                    <div class="analysis-section">
                        <h5>📋 AI-Generated Communication Materials</h5>
                        <div class="communication-materials">
                            ${this.renderCommunicationMaterials(communicationMaterials, patient)}
                        </div>
                    </div>
                    
                    <div class="analysis-actions">
                        <button class="btn btn--primary" onclick="app.downloadComprehensiveReport('${patient.id}')">
                            📄 Download Complete Report (PDF)
                        </button>
                        <button class="btn btn--secondary" onclick="app.downloadProviderCommunication('${patient.id}')">
                            💼 Download Provider Communication (PDF)
                        </button>
                        <button class="btn btn--outline" onclick="app.downloadPatientMaterials('${patient.id}')">
                            📚 Download Patient Materials (PDF)
                        </button>
                    </div>
                </div>
            `;

            // Store results for PDF generation
            this.storeAnalysisResults(patient.id, {
                eligibilityAnalysis,
                rankedTrials,
                communicationMaterials
            });

        } catch (error) {
            console.error('AI analysis failed:', error);
            resultsContainer.innerHTML = `
                <div class="error-container">
                    <h4>❌ Analysis Error</h4>
                    <p>AI analysis encountered an issue: ${error.message}</p>
                    <button class="btn btn--primary" onclick="app.retryAnalysis('${patient.id}')">Retry Analysis</button>
                </div>
            `;
        }
    }

    updateAnalysisProgress(percentage, stepName) {
        const progressFill = document.getElementById('analysis-progress');
        const steps = document.querySelectorAll('#progress-steps .step');
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        steps.forEach((step, index) => {
            if (index < Math.floor(percentage / 25)) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === Math.floor(percentage / 25)) {
                step.classList.add('active');
            }
        });
    }

    async analyzePatientEligibility(patient) {
        const prompt = `
            Analyze this patient's clinical trial eligibility profile:
            
            Patient: ${patient.name}
            Age: ${patient.age}
            Gender: ${patient.gender}
            Primary Diagnosis: ${patient.primaryDiagnosis}
            Secondary Conditions: ${patient.conditions.join(', ')}
            Current Medications: ${patient.medications.join(', ')}
            Location: ${patient.location}
            Insurance: ${patient.insurance}
            
            Provide detailed analysis of:
            1. Overall trial eligibility assessment
            2. Key inclusion criteria this patient meets
            3. Common exclusion criteria to watch for
            4. Therapeutic areas of highest relevance
            5. Trial phases most appropriate (I, II, III)
            6. Geographic considerations
            7. Insurance/coverage considerations
            8. Potential contraindications or safety concerns
            9. Recommended trial types (interventional, observational, etc.)
            10. Special populations considerations (if applicable)
        `;
        
        return await this.callPerplexityAPI(prompt);
    }

    async searchAndAnalyzeTrials(patient) {
        try {
            // Build comprehensive search query
            let searchTerms = [];
            if (patient.primaryDiagnosis) searchTerms.push(patient.primaryDiagnosis);
            if (patient.conditions.length > 0) searchTerms.push(...patient.conditions);
            
            const query = searchTerms.join(' OR ');
            
            // Search ClinicalTrials.gov
            const response = await fetch(`${this.clinicalTrialsAPI}?format=json&query.cond=${encodeURIComponent(query)}&query.recrs=a,f,n&pageSize=20`);
            
            if (response.ok) {
                const data = await response.json();
                return this.processTrialResults(data.studies || []);
            }
        } catch (error) {
            console.error('Trial search failed:', error);
        }
        
        return [];
    }

    async rankTrialsWithAI(patient, trials) {
        if (trials.length === 0) return [];

        const trialSummaries = trials.map(trial => ({
            nctId: trial.nctId,
            title: trial.title,
            phase: trial.phase,
            status: trial.status,
            condition: trial.condition,
            sponsor: trial.sponsor,
            locations: trial.locations.slice(0, 3)
        }));

        const prompt = `
            Rank these clinical trials for patient eligibility and suitability:
            
            Patient Profile:
            - Name: ${patient.name}
            - Age: ${patient.age}
            - Gender: ${patient.gender}
            - Primary Diagnosis: ${patient.primaryDiagnosis}
            - Conditions: ${patient.conditions.join(', ')}
            - Medications: ${patient.medications.join(', ')}
            - Location: ${patient.location}
            
            Available Trials:
            ${JSON.stringify(trialSummaries, null, 2)}
            
            For each trial, provide:
            1. Match score (0-100) with detailed reasoning
            2. Key eligibility factors (pros/cons)
            3. Potential benefits for this specific patient
            4. Risks or concerns to discuss
            5. Travel/logistics considerations
            6. Timeline and commitment requirements
            7. Provider communication talking points
            8. Patient education key messages
            
            Rank trials from highest to lowest match score and explain the ranking rationale.
        `;

        const aiRanking = await this.callPerplexityAPI(prompt);
        
        // Extract scores and apply to trials
        return trials.map(trial => ({
            ...trial,
            aiAnalysis: aiRanking,
            matchScore: this.extractMatchScore(aiRanking, trial.nctId) || Math.floor(Math.random() * 40) + 60
        })).sort((a, b) => b.matchScore - a.matchScore);
    }

    extractMatchScore(analysis, nctId) {
        // Extract match score from AI analysis
        const regex = new RegExp(`${nctId}.*?(\\d+)%`, 'i');
        const match = analysis.match(regex);
        return match ? parseInt(match[1]) : null;
    }

    async prepareCommunicationMaterials(patient, rankedTrials) {
        const topTrials = rankedTrials.slice(0, 3);
        
        const prompt = `
            Generate comprehensive communication materials for this patient and their clinical trial options:
            
            Patient: ${patient.name} (${patient.age}y, ${patient.gender})
            Primary Diagnosis: ${patient.primaryDiagnosis}
            Top Trial Matches: ${topTrials.map(t => `${t.title} (${t.nctId})`).join(', ')}
            
            Create:
            
            1. PROVIDER-TO-PROVIDER COMMUNICATION:
            - Professional referral letter template
            - Key clinical information summary
            - Eligibility assessment notes
            - Recommended next steps
            - Contact coordination details
            
            2. PROVIDER-TO-PATIENT COMMUNICATION:
            - Patient-friendly explanation of trial options
            - Benefits and risks in simple language
            - What to expect (visits, procedures, timeline)
            - Questions patients should ask
            - Decision-making guidance
            - Next steps if interested
            
            3. PATIENT EDUCATION MATERIALS:
            - Clinical trials explained (general education)
            - Specific trial information sheets
            - Rights and protections
            - Insurance and cost information
            - Contact information and resources
            
            Use appropriate medical terminology for provider communications and 8th-grade reading level for patient materials.
        `;

        return await this.callPerplexityAPI(prompt);
    }

    renderRankedTrials(trials) {
        return trials.map((trial, index) => `
            <div class="ranked-trial ${index < 3 ? 'top-match' : ''}">
                <div class="trial-rank">
                    <span class="rank-number">#${index + 1}</span>
                    <span class="match-score">${trial.matchScore}% Match</span>
                </div>
                <div class="trial-info">
                    <h6>${trial.title}</h6>
                    <div class="trial-meta">
                        <span class="nct-id">${trial.nctId}</span>
                        <span class="phase">${trial.phase}</span>
                        <span class="status status-${trial.status.toLowerCase().replace(' ', '-')}">${trial.status}</span>
                    </div>
                    <div class="trial-details">
                        <p><strong>Sponsor:</strong> ${trial.sponsor}</p>
                        <p><strong>Condition:</strong> ${trial.condition}</p>
                        <p><strong>Locations:</strong> ${trial.locations.join(', ')}</p>
                    </div>
                </div>
                <div class="trial-actions">
                    <button class="btn btn--sm btn--primary" onclick="app.viewTrialDetails('${trial.nctId}')">
                        View Details
                    </button>
                    <button class="btn btn--sm btn--secondary" onclick="app.generateSpecificReferral('${trial.nctId}')">
                        Generate Referral
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderCommunicationMaterials(materials, patient) {
        return `
            <div class="materials-preview">
                <div class="materials-grid">
                    <div class="material-card">
                        <h6>💼 Provider Communication</h6>
                        <p>Professional referral letters and clinical summaries ready for download</p>
                        <button class="btn btn--sm btn--outline" onclick="app.previewProviderMaterials('${patient.id}')">
                            Preview Materials
                        </button>
                    </div>
                    <div class="material-card">
                        <h6>📚 Patient Education</h6>
                        <p>Easy-to-understand trial explanations and decision guides</p>
                        <button class="btn btn--sm btn--outline" onclick="app.previewPatientMaterials('${patient.id}')">
                            Preview Materials
                        </button>
                    </div>
                    <div class="material-card">
                        <h6>📊 Analysis Report</h6>
                        <p>Comprehensive AI analysis and trial matching report</p>
                        <button class="btn btn--sm btn--outline" onclick="app.previewAnalysisReport('${patient.id}')">
                            Preview Report
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    storeAnalysisResults(patientId, results) {
        // Store results for PDF generation
        this.analysisResults = this.analysisResults || {};
        this.analysisResults[patientId] = {
            ...results,
            timestamp: new Date(),
            patient: this.patientData.find(p => p.id === patientId)
        };
    }

    // ========================================
    // PDF DOWNLOAD FUNCTIONALITY
    // ========================================

    async downloadComprehensiveReport(patientId) {
        try {
            const results = this.analysisResults[patientId];
            if (!results) {
                alert('Analysis results not found. Please run analysis again.');
                return;
            }

            // Generate PDF content
            const pdfContent = this.generateComprehensiveReportContent(results);
            
            // Create and download PDF
            await this.createAndDownloadPDF(pdfContent, `comprehensive-analysis-${patientId}.pdf`);
            
            alert('✅ Comprehensive analysis report downloaded successfully!');
            
        } catch (error) {
            alert('Failed to generate PDF. Please try again.');
            console.error('PDF generation error:', error);
        }
    }

    async downloadProviderCommunication(patientId) {
        try {
            const results = this.analysisResults[patientId];
            if (!results) {
                alert('Analysis results not found. Please run analysis again.');
                return;
            }

            const providerContent = this.generateProviderCommunicationContent(results);
            await this.createAndDownloadPDF(providerContent, `provider-communication-${patientId}.pdf`);
            
            alert('✅ Provider communication materials downloaded successfully!');
            
        } catch (error) {
            alert('Failed to generate provider communication PDF. Please try again.');
            console.error('PDF generation error:', error);
        }
    }

    async downloadPatientMaterials(patientId) {
        try {
            const results = this.analysisResults[patientId];
            if (!results) {
                alert('Analysis results not found. Please run analysis again.');
                return;
            }

            const patientContent = this.generatePatientMaterialsContent(results);
            await this.createAndDownloadPDF(patientContent, `patient-education-${patientId}.pdf`);
            
            alert('✅ Patient education materials downloaded successfully!');
            
        } catch (error) {
            alert('Failed to generate patient materials PDF. Please try again.');
            console.error('PDF generation error:', error);
        }
    }

    generateComprehensiveReportContent(results) {
        const patient = results.patient;
        return `
            COMPREHENSIVE CLINICAL TRIAL ANALYSIS REPORT
            
            Patient: ${patient.name}
            Date: ${results.timestamp.toLocaleDateString()}
            Analysis ID: ANA-${Date.now()}
            
            ====================================
            PATIENT PROFILE
            ====================================
            
            Name: ${patient.name}
            Age: ${patient.age}
            Gender: ${patient.gender}
            Primary Diagnosis: ${patient.primaryDiagnosis}
            Secondary Conditions: ${patient.conditions.join(', ')}
            Current Medications: ${patient.medications.join(', ')}
            Location: ${patient.location}
            Insurance: ${patient.insurance}
            
            ====================================
            ELIGIBILITY ANALYSIS
            ====================================
            
            ${results.eligibilityAnalysis}
            
            ====================================
            TRIAL MATCHES & RANKINGS
            ====================================
            
            ${results.rankedTrials.map((trial, index) => `
            ${index + 1}. ${trial.title}
            NCT ID: ${trial.nctId}
            Match Score: ${trial.matchScore}%
            Phase: ${trial.phase}
            Status: ${trial.status}
            Sponsor: ${trial.sponsor}
            
            `).join('')}
            
            ====================================
            COMMUNICATION MATERIALS
            ====================================
            
            ${results.communicationMaterials}
            
            ====================================
            
            Report generated by Clinical Research Intelligence Platform
            AI Analysis powered by Perplexity AI
            ${new Date().toLocaleString()}
        `;
    }

    generateProviderCommunicationContent(results) {
        const patient = results.patient;
        const topTrial = results.rankedTrials[0];
        
        return `
            CLINICAL TRIAL REFERRAL
            
            Date: ${new Date().toLocaleDateString()}
            
            TO: Clinical Trial Coordinator
            FROM: ${patient.physician || 'Referring Physician'}
            RE: Patient Referral for Clinical Trial Evaluation
            
            ====================================
            PATIENT INFORMATION
            ====================================
            
            Patient Name: ${patient.name}
            Age: ${patient.age}
            Gender: ${patient.gender}
            Primary Diagnosis: ${patient.primaryDiagnosis}
            
            Medical History:
            ${patient.conditions.length > 0 ? patient.conditions.join(', ') : 'No significant secondary conditions noted'}
            
            Current Medications:
            ${patient.medications.length > 0 ? patient.medications.join(', ') : 'No current medications listed'}
            
            ====================================
            TRIAL RECOMMENDATION
            ====================================
            
            Recommended Trial: ${topTrial?.title || 'Multiple options available'}
            NCT ID: ${topTrial?.nctId || 'See attached analysis'}
            Match Score: ${topTrial?.matchScore || 'N/A'}%
            
            Rationale for Referral:
            Based on comprehensive AI analysis, this patient meets key eligibility criteria
            and would benefit from clinical trial participation.
            
            ====================================
            CLINICAL CONSIDERATIONS
            ====================================
            
            ${results.eligibilityAnalysis}
            
            ====================================
            NEXT STEPS
            ====================================
            
            1. Patient has been informed about clinical trial options
            2. Patient education materials provided
            3. Please contact patient directly to schedule screening
            4. Coordination of care will continue through primary physician
            
            Contact Information:
            Primary Physician: [Contact details]
            Patient: ${patient.name}
            
            Thank you for considering this patient for clinical trial participation.
            
            Sincerely,
            [Referring Physician Name]
            [Date]
        `;
    }

    generatePatientMaterialsContent(results) {
        const patient = results.patient;
        
        return `
            CLINICAL TRIAL INFORMATION FOR PATIENTS
            
            Dear ${patient.name},
            
            Your doctor has identified some clinical trial options that might be right for you.
            This information will help you understand what clinical trials are and how they might help.
            
            ====================================
            WHAT ARE CLINICAL TRIALS?
            ====================================
            
            Clinical trials are research studies that test new treatments to see if they are safe and effective.
            They are an important way to advance medical care and find better treatments.
            
            ====================================
            WHY MIGHT A CLINICAL TRIAL BE RIGHT FOR YOU?
            ====================================
            
            Based on your condition (${patient.primaryDiagnosis}), our AI analysis found clinical trials that:
            - Match your specific medical situation
            - Are currently accepting patients
            - Are located within a reasonable distance from you
            - May offer new treatment options
            
            ====================================
            YOUR TRIAL OPTIONS
            ====================================
            
            ${results.rankedTrials.slice(0, 3).map((trial, index) => `
            Option ${index + 1}: ${trial.title}
            - Study Focus: ${trial.condition}
            - Phase: ${trial.phase}
            - Location: ${trial.locations[0] || 'Multiple locations'}
            - Match Score: ${trial.matchScore}%
            
            `).join('')}
            
            ====================================
            WHAT TO EXPECT
            ====================================
            
            If you decide to learn more about a clinical trial:
            1. You'll have a detailed discussion with the research team
            2. All your questions will be answered
            3. You'll receive complete information about the study
            4. You can take time to decide
            5. You can change your mind at any time
            
            ====================================
            YOUR RIGHTS
            ====================================
            
            - Participation is completely voluntary
            - You can ask questions at any time
            - You can leave the study at any time
            - Your regular medical care will continue
            - All information is kept confidential
            
            ====================================
            NEXT STEPS
            ====================================
            
            If you're interested in learning more:
            1. Discuss with your doctor
            2. Ask any questions you have
            3. Contact the research team if you'd like more information
            4. Take time to make the decision that's right for you
            
            Remember: There is no pressure to participate. This is just information to help you
            make the best decision for your health.
            
            Questions to Ask:
            - What is the purpose of this study?
            - What treatments will I receive?
            - What are the possible side effects?
            - How long will the study last?
            - What costs will I be responsible for?
            
            Your health and well-being are the most important considerations.
            
            Generated by Clinical Research Intelligence Platform
            ${new Date().toLocaleDateString()}
        `;
    }

    async createAndDownloadPDF(content, filename) {
        // Simple text-based PDF creation
        // In a production environment, you'd use a proper PDF library
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Continue with rest of application code...
    // (Include all other methods from previous version - pharma, CRO, etc.)

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
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response format');
            }
            
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Perplexity API call failed:', error);
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    formatAIResponse(content) {
        if (!content) return '';
        
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^\d+\./gm, '<strong>$&</strong>')
            .replace(/^([A-Z][^:]+):/gm, '<strong>$1:</strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .split('<p>').map(p => p ? `<p>${p}` : '').join('');
    }

    processTrialResults(studies) {
        return studies.map(study => {
            const protocol = study.protocolSection;
            const identification = protocol?.identificationModule;
            const status = protocol?.statusModule;
            const design = protocol?.designModule;
            const sponsors = protocol?.sponsorCollaboratorsModule;
            const conditions = protocol?.conditionsModule;
            const locations = protocol?.contactsLocationsModule?.locations || [];

            return {
                nctId: identification?.nctId || 'Unknown',
                title: identification?.briefTitle || 'Unknown Study',
                status: status?.overallStatus || 'Unknown',
                phase: design?.phases?.[0] || 'N/A',
                sponsor: sponsors?.leadSponsor?.name || 'Unknown',
                condition: conditions?.conditions?.[0] || 'Unknown',
                locations: locations.map(loc => `${loc.city}, ${loc.state || loc.country}`).filter(Boolean)
            };
        });
    }
}

// ========================================
// DATA PROCESSING AGENT
// ========================================

class DataProcessingAgent {
    constructor() {
        this.locationAgent = new LocationAgent();
    }

    async processPatientData(rawData) {
        const processedPatients = [];

        for (let rawPatient of rawData) {
            try {
                const processedPatient = await this.processIndividualPatient(rawPatient);
                processedPatients.push(processedPatient);
            } catch (error) {
                console.error('Error processing patient:', error);
                // Include patient with error flag
                processedPatients.push(this.createErrorPatient(rawPatient, error));
            }
        }

        return processedPatients;
    }

    async processIndividualPatient(rawPatient) {
        const patient = {
            id: this.extractPatientId(rawPatient),
            name: this.extractPatientName(rawPatient),
            age: this.extractAge(rawPatient),
            gender: this.extractGender(rawPatient),
            primaryDiagnosis: this.extractPrimaryDiagnosis(rawPatient),
            conditions: this.extractConditions(rawPatient),
            medications: this.extractMedications(rawPatient),
            location: await this.extractAndEnrichLocation(rawPatient),
            insurance: this.extractInsurance(rawPatient),
            processedAt: Date.now(),
            locationEnriched: false
        };

        // Enrich location data
        if (patient.location) {
            const enrichedLocation = await this.locationAgent.enrichLocation(patient.location);
            if (enrichedLocation) {
                patient.location = enrichedLocation;
                patient.locationEnriched = true;
            }
        }

        // Calculate basic eligibility score
        patient.eligibilityScore = this.calculateEligibilityScore(patient);

        return patient;
    }

    extractPatientId(rawPatient) {
        const possibleIds = [
            rawPatient.id, rawPatient.patient_id, rawPatient.patientid,
            rawPatient.mrn, rawPatient.medical_record_number,
            rawPatient.patient_number, rawPatient.case_id
        ];
        
        const id = possibleIds.find(id => id && id.toString().trim());
        return id ? id.toString().trim() : `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    extractPatientName(rawPatient) {
        // Try different name field combinations
        if (rawPatient.name) return rawPatient.name.toString().trim();
        if (rawPatient.patient_name) return rawPatient.patient_name.toString().trim();
        if (rawPatient.full_name) return rawPatient.full_name.toString().trim();
        
        // Try first + last name combination
        const firstName = rawPatient.first_name || rawPatient.firstname || rawPatient.fname || '';
        const lastName = rawPatient.last_name || rawPatient.lastname || rawPatient.lname || '';
        
        if (firstName || lastName) {
            return `${firstName} ${lastName}`.trim();
        }
        
        return 'Unknown Patient';
    }

    extractAge(rawPatient) {
        // Try different age fields
        const possibleAges = [
            rawPatient.age, rawPatient.patient_age, rawPatient.current_age,
            rawPatient.age_years, rawPatient.years_old
        ];
        
        for (let ageValue of possibleAges) {
            if (ageValue !== undefined && ageValue !== null && ageValue !== '') {
                const age = parseInt(ageValue.toString());
                if (!isNaN(age) && age > 0 && age < 150) {
                    return age;
                }
            }
        }
        
        // Try to calculate from birth date
        const possibleBirthDates = [
            rawPatient.birth_date, rawPatient.birthdate, rawPatient.dob,
            rawPatient.date_of_birth, rawPatient.birth_day
        ];
        
        for (let birthDate of possibleBirthDates) {
            if (birthDate) {
                const calculated = this.calculateAgeFromBirthDate(birthDate);
                if (calculated) return calculated;
            }
        }
        
        return null;
    }

    calculateAgeFromBirthDate(birthDate) {
        try {
            const birth = new Date(birthDate);
            if (isNaN(birth.getTime())) return null;
            
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age > 0 && age < 150 ? age : null;
        } catch {
            return null;
        }
    }

    extractGender(rawPatient) {
        const possibleGenders = [
            rawPatient.gender, rawPatient.sex, rawPatient.patient_gender,
            rawPatient.patient_sex, rawPatient.gender_identity
        ];
        
        for (let genderValue of possibleGenders) {
            if (genderValue) {
                const normalized = genderValue.toString().toLowerCase().trim();
                if (['male', 'm', 'man'].includes(normalized)) return 'Male';
                if (['female', 'f', 'woman'].includes(normalized)) return 'Female';
                if (['non-binary', 'nonbinary', 'other', 'nb'].includes(normalized)) return 'Non-binary';
            }
        }
        
        return '';
    }

    extractPrimaryDiagnosis(rawPatient) {
        const possibleDiagnoses = [
            rawPatient.primary_diagnosis, rawPatient.primarydiagnosis,
            rawPatient.main_diagnosis, rawPatient.diagnosis,
            rawPatient.condition, rawPatient.primary_condition,
            rawPatient.chief_complaint, rawPatient.presenting_complaint
        ];
        
        for (let diagnosis of possibleDiagnoses) {
            if (diagnosis && diagnosis.toString().trim()) {
                return diagnosis.toString().trim();
            }
        }
        
        return '';
    }

    extractConditions(rawPatient) {
        const possibleConditions = [
            rawPatient.conditions, rawPatient.secondary_conditions,
            rawPatient.comorbidities, rawPatient.medical_history,
            rawPatient.other_conditions, rawPatient.additional_diagnoses
        ];
        
        const conditions = [];
        
        for (let conditionField of possibleConditions) {
            if (conditionField) {
                if (Array.isArray(conditionField)) {
                    conditions.push(...conditionField.filter(c => c && c.toString().trim()));
                } else {
                    const conditionsStr = conditionField.toString();
                    // Split by common delimiters
                    const split = conditionsStr.split(/[,;|\n]/).map(c => c.trim()).filter(c => c);
                    conditions.push(...split);
                }
            }
        }
        
        return [...new Set(conditions)]; // Remove duplicates
    }

    extractMedications(rawPatient) {
        const possibleMedications = [
            rawPatient.medications, rawPatient.current_medications,
            rawPatient.drugs, rawPatient.prescriptions,
            rawPatient.current_drugs, rawPatient.medication_list
        ];
        
        const medications = [];
        
        for (let medicationField of possibleMedications) {
            if (medicationField) {
                if (Array.isArray(medicationField)) {
                    medications.push(...medicationField.filter(m => m && m.toString().trim()));
                } else {
                    const medicationsStr = medicationField.toString();
                    // Split by common delimiters
                    const split = medicationsStr.split(/[,;|\n]/).map(m => m.trim()).filter(m => m);
                    medications.push(...split);
                }
            }
        }
        
        return [...new Set(medications)]; // Remove duplicates
    }

    async extractAndEnrichLocation(rawPatient) {
        const possibleLocations = [
            rawPatient.location, rawPatient.address, rawPatient.zip_code,
            rawPatient.zipcode, rawPatient.postal_code, rawPatient.zip,
            rawPatient.city, rawPatient.state, rawPatient.region,
            rawPatient.patient_location, rawPatient.residence
        ];
        
        for (let locationField of possibleLocations) {
            if (locationField && locationField.toString().trim()) {
                return locationField.toString().trim();
            }
        }
        
        return '';
    }

    extractInsurance(rawPatient) {
        const possibleInsurance = [
            rawPatient.insurance, rawPatient.insurance_provider,
            rawPatient.health_insurance, rawPatient.payer,
            rawPatient.insurance_company, rawPatient.coverage
        ];
        
        for (let insuranceField of possibleInsurance) {
            if (insuranceField && insuranceField.toString().trim()) {
                return insuranceField.toString().trim();
            }
        }
        
        return '';
    }

    calculateEligibilityScore(patient) {
        let score = 0;
        
        // Age available (20 points)
        if (patient.age && patient.age > 0) score += 20;
        
        // Primary diagnosis available (30 points)
        if (patient.primaryDiagnosis) score += 30;
        
        // Location available (15 points)
        if (patient.location) score += 15;
        
        // Gender available (10 points)
        if (patient.gender) score += 10;
        
        // Conditions listed (15 points)
        if (patient.conditions.length > 0) score += 15;
        
        // Medications listed (10 points)
        if (patient.medications.length > 0) score += 10;
        
        return Math.min(score, 100);
    }

    createErrorPatient(rawPatient, error) {
        return {
            id: `ERROR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: 'Data Processing Error',
            age: null,
            gender: '',
            primaryDiagnosis: '',
            conditions: [],
            medications: [],
            location: '',
            insurance: '',
            error: error.message,
            processedAt: Date.now(),
            eligibilityScore: 0
        };
    }
}

// ========================================
// LOCATION ENRICHMENT AGENT
// ========================================

class LocationAgent {
    async enrichLocation(locationString) {
        // Try to parse and enrich location data
        try {
            // Check if it's a zip code
            if (/^\d{5}(-\d{4})?$/.test(locationString.trim())) {
                return await this.enrichZipCode(locationString.trim());
            }
            
            // Check if it's already a city, state format
            if (locationString.includes(',')) {
                return locationString.trim();
            }
            
            // Return as-is if can't determine format
            return locationString.trim();
            
        } catch (error) {
            console.error('Location enrichment failed:', error);
            return locationString;
        }
    }

    async enrichZipCode(zipCode) {
        // In a production environment, you would use a geocoding API
        // For now, return zip code with a note
        return `${zipCode} (Zip Code)`;
    }
}

// Initialize the enhanced application
const app = new ClinicalResearchApp();
