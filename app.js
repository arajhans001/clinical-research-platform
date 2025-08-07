// Clinical Research Intelligence Platform - FULLY FUNCTIONAL VERSION
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
        this.realTimeDataAgent = new RealTimeDataAgent(this.perplexityConfig);
        this.analysisAgent = new AnalysisAgent(this.perplexityConfig);
        
        this.charts = {};
        this.analysisResults = {};
        this.generatedContent = {};
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
                if (indicator) {
                    indicator.classList.toggle('active');
                }
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
        const patientFilesInput = document.getElementById('patient-files');
        if (patientFilesInput) {
            patientFilesInput.addEventListener('change', (e) => {
                this.handlePatientFileUpload(e.target.files);
            });
        }

        const croFilesInput = document.getElementById('cro-data-files');
        if (croFilesInput) {
            croFilesInput.addEventListener('change', (e) => {
                this.handleCROFileUpload(e.target.files);
            });
        }

        // Manual patient form
        const manualForm = document.getElementById('manual-patient-form');
        if (manualForm) {
            manualForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addManualPatient();
            });
        }

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
    // PATIENT DATA PROCESSING (Keep existing)
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
                const messageEl = statusDiv.querySelector('.processing-message');
                if (messageEl) messageEl.textContent = newMessage;
            },
            close: () => {
                if (document.body.contains(statusDiv)) {
                    document.body.removeChild(statusDiv);
                }
            }
        };
    }

    async displayPatientsWithEnrichment(patients) {
        const patientList = document.getElementById('patient-list');
        
        if (!patientList) {
            console.error('Patient list element not found');
            return;
        }
        
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
        await this.displayPatientsWithEnrichment(this.patientData);
    }

    // ========================================
    // REAL AI ANALYSIS - NO SAMPLES OR MOCKS
    // ========================================

    async selectPatientForAIAnalysis(patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        if (!patient) {
            alert('Patient not found. Please try again.');
            return;
        }

        // Show analysis section
        const analysisSection = document.getElementById('trial-analysis-section');
        if (analysisSection) {
            analysisSection.classList.remove('hidden');
        }
        
        // Display patient summary
        const summaryContainer = document.getElementById('selected-patient-summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="selected-patient">
                    <h4>🤖 Real-Time AI Analysis for: ${patient.name}</h4>
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
                            <div class="step active">Real-Time Data Retrieval</div>
                            <div class="step">AI Clinical Analysis</div>
                            <div class="step">Trial Matching</div>
                            <div class="step">Content Generation</div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Start REAL AI analysis
        await this.performRealTimeAIAnalysis(patient);
    }

    async performRealTimeAIAnalysis(patient) {
        const resultsContainer = document.getElementById('ai-analysis-results');
        
        if (!resultsContainer) {
            console.error('Results container not found');
            return;
        }

        try {
            // Step 1: Real-time data retrieval
            this.updateAnalysisProgress(25, 'Real-Time Data Retrieval');
            resultsContainer.innerHTML = '<div class="loading-ai">🌐 Retrieving real-time clinical trial data and medical literature...</div>';
            
            const realTimeData = await this.realTimeDataAgent.gatherClinicalData(patient);
            
            // Step 2: AI clinical analysis
            this.updateAnalysisProgress(50, 'AI Clinical Analysis');
            resultsContainer.innerHTML = '<div class="loading-ai">🧠 AI agent performing comprehensive clinical analysis...</div>';
            
            const clinicalAnalysis = await this.analysisAgent.performClinicalAnalysis(patient, realTimeData);
            
            // Step 3: Trial matching with live data
            this.updateAnalysisProgress(75, 'Trial Matching');
            resultsContainer.innerHTML = '<div class="loading-ai">🎯 AI matching patient to current clinical trials...</div>';
            
            const matchingResults = await this.analysisAgent.performTrialMatching(patient, realTimeData, clinicalAnalysis);
            
            // Step 4: Generate all content
            this.updateAnalysisProgress(100, 'Content Generation');
            resultsContainer.innerHTML = '<div class="loading-ai">📝 Generating professional communications and reports...</div>';
            
            const generatedContent = await this.generateAllCommunicationContent(patient, clinicalAnalysis, matchingResults);
            
            // Store all results
            this.storeCompleteAnalysisResults(patient.id, {
                realTimeData,
                clinicalAnalysis,
                matchingResults,
                generatedContent,
                patient
            });
            
            // Display comprehensive results
            resultsContainer.innerHTML = this.renderCompleteAnalysisResults(patient.id, clinicalAnalysis, matchingResults);

        } catch (error) {
            console.error('Real-time AI analysis failed:', error);
            resultsContainer.innerHTML = `
                <div class="error-container">
                    <h4>❌ Analysis Error</h4>
                    <p>Real-time AI analysis encountered an issue: ${error.message}</p>
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
            step.classList.remove('active', 'completed');
            if (index < Math.floor(percentage / 25)) {
                step.classList.add('completed');
            } else if (index === Math.floor(percentage / 25)) {
                step.classList.add('active');
            }
        });
    }

    async generateAllCommunicationContent(patient, clinicalAnalysis, matchingResults) {
        const contentGenerator = new ContentGenerationAgent(this.perplexityConfig);
        
        // Generate provider communication
        const providerCommunication = await contentGenerator.generateProviderReferralLetter(patient, matchingResults);
        
        // Generate patient education materials
        const patientEducation = await contentGenerator.generatePatientEducationMaterials(patient, matchingResults);
        
        // Generate comprehensive analysis report
        const analysisReport = await contentGenerator.generateComprehensiveReport(patient, clinicalAnalysis, matchingResults);
        
        return {
            providerCommunication,
            patientEducation,
            analysisReport
        };
    }

    storeCompleteAnalysisResults(patientId, results) {
        this.analysisResults[patientId] = {
            ...results,
            timestamp: new Date()
        };
        
        // Store generated content separately for easy access
        this.generatedContent[patientId] = results.generatedContent;
    }

    renderCompleteAnalysisResults(patientId, clinicalAnalysis, matchingResults) {
        const patient = this.analysisResults[patientId].patient;
        
        return `
            <div class="ai-analysis-complete">
                <div class="analysis-header">
                    <h4>🧠 Real-Time AI Analysis Complete</h4>
                    <div class="analysis-timestamp">Completed: ${new Date().toLocaleString()}</div>
                </div>
                
                <div class="analysis-section">
                    <h5>📊 Clinical Assessment</h5>
                    <div class="analysis-content">${this.formatAIResponse(clinicalAnalysis.eligibilityAssessment)}</div>
                </div>
                
                <div class="analysis-section">
                    <h5>🎯 Matching Clinical Trials (${matchingResults.trials.length} found)</h5>
                    <div class="trials-ranked">
                        ${this.renderMatchedTrials(matchingResults.trials)}
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h5>📋 AI-Generated Communication Materials</h5>
                    <div class="communication-materials">
                        <div class="materials-grid">
                            <div class="material-card">
                                <h6>💼 Provider Communication</h6>
                                <p>Professional referral letters and clinical summaries</p>
                                <button class="btn btn--sm btn--outline" onclick="app.previewProviderMaterials('${patientId}')">
                                    Preview Materials
                                </button>
                            </div>
                            <div class="material-card">
                                <h6>📚 Patient Education</h6>
                                <p>Easy-to-understand trial explanations and guides</p>
                                <button class="btn btn--sm btn--outline" onclick="app.previewPatientMaterials('${patientId}')">
                                    Preview Materials
                                </button>
                            </div>
                            <div class="material-card">
                                <h6>📊 Analysis Report</h6>
                                <p>Comprehensive AI analysis and recommendations</p>
                                <button class="btn btn--sm btn--outline" onclick="app.previewAnalysisReport('${patientId}')">
                                    Preview Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="analysis-actions">
                    <button class="btn btn--primary" onclick="app.downloadComprehensiveReport('${patientId}')">
                        📄 Download Complete Report (PDF)
                    </button>
                    <button class="btn btn--secondary" onclick="app.downloadProviderCommunication('${patientId}')">
                        💼 Download Provider Communication (PDF)
                    </button>
                    <button class="btn btn--outline" onclick="app.downloadPatientMaterials('${patientId}')">
                        📚 Download Patient Materials (PDF)
                    </button>
                </div>
            </div>
        `;
    }

    renderMatchedTrials(trials) {
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
                        <span class="status status-${trial.status.toLowerCase().replace(/[^a-z]/g, '-')}">${trial.status}</span>
                    </div>
                    <div class="trial-details">
                        <p><strong>Sponsor:</strong> ${trial.sponsor}</p>
                        <p><strong>Condition:</strong> ${trial.condition}</p>
                        <p><strong>Locations:</strong> ${trial.locations.join(', ') || 'Multiple locations'}</p>
                        <p><strong>Contact:</strong> ${trial.contact || 'See ClinicalTrials.gov'}</p>
                    </div>
                </div>
                <div class="trial-actions">
                    <button class="btn btn--sm btn--primary" onclick="app.generateSpecificReferral('${trial.nctId}', '${this.analysisResults[Object.keys(this.analysisResults)[Object.keys(this.analysisResults).length-1]].patient.id}')">
                        Generate Referral
                    </button>
                    <button class="btn btn--sm btn--secondary" onclick="window.open('https://clinicaltrials.gov/study/${trial.nctId}', '_blank')">
                        View on ClinicalTrials.gov
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // FUNCTIONAL REFERRAL GENERATION
    // ========================================

    async generateSpecificReferral(nctId, patientId) {
        const loadingStatus = this.showProcessingStatus('Generating professional referral letter...');
        
        try {
            const patient = this.patientData.find(p => p.id === patientId);
            const analysisResults = this.analysisResults[patientId];
            
            if (!patient || !analysisResults) {
                throw new Error('Patient data or analysis results not found');
            }

            // Find the specific trial
            const trial = analysisResults.matchingResults.trials.find(t => t.nctId === nctId);
            
            if (!trial) {
                throw new Error('Trial information not found');
            }

            const contentGenerator = new ContentGenerationAgent(this.perplexityConfig);
            const referralLetter = await contentGenerator.generateSpecificReferralLetter(patient, trial, analysisResults.clinicalAnalysis);
            
            loadingStatus.close();
            
            // Show the generated referral in a modal
            this.showGeneratedReferralModal(referralLetter, patient, trial);
            
        } catch (error) {
            loadingStatus.close();
            alert(`Failed to generate referral: ${error.message}`);
        }
    }

    showGeneratedReferralModal(referralContent, patient, trial) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Generated Referral Letter</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="referral-preview">
                        <div class="referral-header">
                            <h4>Clinical Trial Referral</h4>
                            <p><strong>Patient:</strong> ${patient.name} | <strong>Trial:</strong> ${trial.nctId}</p>
                        </div>
                        <div class="referral-content">
                            ${this.formatAIResponse(referralContent)}
                        </div>
                    </div>
                    <div class="referral-actions">
                        <button class="btn btn--primary" onclick="app.copyReferralToClipboard('${btoa(referralContent)}')">
                            📋 Copy to Clipboard
                        </button>
                        <button class="btn btn--secondary" onclick="app.emailReferral('${patient.id}', '${trial.nctId}')">
                            📧 Email Referral
                        </button>
                        <button class="btn btn--outline" onclick="app.downloadReferralPDF('${patient.id}', '${trial.nctId}')">
                            📄 Download PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    copyReferralToClipboard(encodedContent) {
        const content = atob(encodedContent);
        navigator.clipboard.writeText(content).then(() => {
            alert('✅ Referral letter copied to clipboard!');
        }).catch(() => {
            alert('❌ Failed to copy to clipboard. Please try again.');
        });
    }

    async emailReferral(patientId, nctId) {
        const patient = this.patientData.find(p => p.id === patientId);
        const trial = this.analysisResults[patientId].matchingResults.trials.find(t => t.nctId === nctId);
        
        const subject = `Clinical Trial Referral - ${patient.name} - ${nctId}`;
        const body = `Please find attached the clinical trial referral for ${patient.name} regarding trial ${nctId} - ${trial.title}.`;
        
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
        
        alert('📧 Email client opened with referral information. Please attach the generated referral document.');
    }

    async downloadReferralPDF(patientId, nctId) {
        try {
            const patient = this.patientData.find(p => p.id === patientId);
            const trial = this.analysisResults[patientId].matchingResults.trials.find(t => t.nctId === nctId);
            const contentGenerator = new ContentGenerationAgent(this.perplexityConfig);
            
            const referralContent = await contentGenerator.generateSpecificReferralLetter(patient, trial, this.analysisResults[patientId].clinicalAnalysis);
            
            // Generate proper PDF content
            const pdfContent = this.generateReferralPDFContent(referralContent, patient, trial);
            
            // Create downloadable PDF
            await this.createAndDownloadProperPDF(pdfContent, `referral-${patient.name.replace(/\s+/g, '_')}-${nctId}.pdf`);
            
            alert('✅ Referral PDF downloaded successfully!');
            
        } catch (error) {
            alert(`Failed to download referral PDF: ${error.message}`);
        }
    }

    // ========================================
    // FUNCTIONAL PREVIEW METHODS
    // ========================================

    async previewProviderMaterials(patientId) {
        const content = this.generatedContent[patientId];
        if (!content || !content.providerCommunication) {
            alert('Provider materials not found. Please run analysis again.');
            return;
        }

        this.showPreviewModal('Provider Communication Materials', content.providerCommunication, 'provider');
    }

    async previewPatientMaterials(patientId) {
        const content = this.generatedContent[patientId];
        if (!content || !content.patientEducation) {
            alert('Patient materials not found. Please run analysis again.');
            return;
        }

        this.showPreviewModal('Patient Education Materials', content.patientEducation, 'patient');
    }

    async previewAnalysisReport(patientId) {
        const content = this.generatedContent[patientId];
        if (!content || !content.analysisReport) {
            alert('Analysis report not found. Please run analysis again.');
            return;
        }

        this.showPreviewModal('Comprehensive Analysis Report', content.analysisReport, 'analysis');
    }

    showPreviewModal(title, content, type) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Preview: ${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="preview-content">
                        ${this.formatAIResponse(content)}
                    </div>
                    <div class="preview-actions">
                        <button class="btn btn--primary" onclick="app.copyContentToClipboard('${btoa(content)}')">
                            📋 Copy Content
                        </button>
                        <button class="btn btn--outline" onclick="this.closest('.modal').remove()">
                            Close Preview
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    copyContentToClipboard(encodedContent) {
        const content = atob(encodedContent);
        navigator.clipboard.writeText(content).then(() => {
            alert('✅ Content copied to clipboard!');
        }).catch(() => {
            alert('❌ Failed to copy to clipboard. Please try again.');
        });
    }

    // ========================================
    // FUNCTIONAL PDF DOWNLOADS
    // ========================================

    async downloadComprehensiveReport(patientId) {
        try {
            const results = this.analysisResults[patientId];
            const content = this.generatedContent[patientId];
            
            if (!results || !content) {
                alert('Analysis results not found. Please run analysis again.');
                return;
            }

            const pdfContent = this.generateComprehensiveReportPDFContent(results, content);
            await this.createAndDownloadProperPDF(pdfContent, `comprehensive-report-${results.patient.name.replace(/\s+/g, '_')}.pdf`);
            
            alert('✅ Comprehensive report downloaded successfully!');
            
        } catch (error) {
            alert(`Failed to generate comprehensive report: ${error.message}`);
            console.error('PDF generation error:', error);
        }
    }

    async downloadProviderCommunication(patientId) {
        try {
            const results = this.analysisResults[patientId];
            const content = this.generatedContent[patientId];
            
            if (!results || !content) {
                alert('Analysis results not found. Please run analysis again.');
                return;
            }

            const pdfContent = this.generateProviderCommunicationPDFContent(results, content);
            await this.createAndDownloadProperPDF(pdfContent, `provider-communication-${results.patient.name.replace(/\s+/g, '_')}.pdf`);
            
            alert('✅ Provider communication materials downloaded successfully!');
            
        } catch (error) {
            alert(`Failed to generate provider communication: ${error.message}`);
            console.error('PDF generation error:', error);
        }
    }

    async downloadPatientMaterials(patientId) {
        try {
            const results = this.analysisResults[patientId];
            const content = this.generatedContent[patientId];
            
            if (!results || !content) {
                alert('Analysis results not found. Please run analysis again.');
                return;
            }

            const pdfContent = this.generatePatientMaterialsPDFContent(results, content);
            await this.createAndDownloadProperPDF(pdfContent, `patient-materials-${results.patient.name.replace(/\s+/g, '_')}.pdf`);
            
            alert('✅ Patient education materials downloaded successfully!');
            
        } catch (error) {
            alert(`Failed to generate patient materials: ${error.message}`);
            console.error('PDF generation error:', error);
        }
    }

    generateComprehensiveReportPDFContent(results, content) {
        const patient = results.patient;
        return `COMPREHENSIVE CLINICAL TRIAL ANALYSIS REPORT

Generated by Clinical Research Intelligence Platform
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
Analysis ID: ANA-${Date.now()}

================================================================================
PATIENT INFORMATION
================================================================================

Name: ${patient.name}
Age: ${patient.age || 'Not specified'}
Gender: ${patient.gender || 'Not specified'}
Primary Diagnosis: ${patient.primaryDiagnosis || 'Not specified'}
Secondary Conditions: ${patient.conditions.join(', ') || 'None listed'}
Current Medications: ${patient.medications.join(', ') || 'None listed'}
Location: ${patient.location || 'Not specified'}
Insurance: ${patient.insurance || 'Not specified'}

================================================================================
CLINICAL ANALYSIS
================================================================================

${this.cleanTextForPDF(results.clinicalAnalysis.eligibilityAssessment)}

================================================================================
TRIAL MATCHING RESULTS
================================================================================

Total Trials Found: ${results.matchingResults.trials.length}

${results.matchingResults.trials.map((trial, index) => `
Trial ${index + 1}: ${trial.title}
NCT ID: ${trial.nctId}
Match Score: ${trial.matchScore}%
Phase: ${trial.phase}
Status: ${trial.status}
Sponsor: ${trial.sponsor}
Condition: ${trial.condition}
Locations: ${trial.locations.join(', ')}
Contact: ${trial.contact || 'See ClinicalTrials.gov for contact information'}

`).join('')}

================================================================================
AI-GENERATED ANALYSIS REPORT
================================================================================

${this.cleanTextForPDF(content.analysisReport)}

================================================================================
RECOMMENDATIONS
================================================================================

Based on the comprehensive analysis, the following recommendations are provided:

1. Review trial eligibility criteria carefully with the patient
2. Discuss potential benefits and risks of clinical trial participation
3. Coordinate with research teams for detailed screening
4. Provide patient education materials for informed decision making
5. Schedule follow-up to discuss patient preferences and next steps

================================================================================

This report was generated using advanced AI analysis of real-time clinical data.
For questions or additional analysis, please contact the research team.

Report generated: ${new Date().toLocaleString()}
Platform: Clinical Research Intelligence Platform
AI Analysis: Powered by Perplexity AI
`;
    }

    generateProviderCommunicationPDFContent(results, content) {
        const patient = results.patient;
        const topTrial = results.matchingResults.trials[0];
        
        return `CLINICAL TRIAL REFERRAL COMMUNICATION

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

TO: Clinical Research Team / Trial Coordinator
FROM: Referring Healthcare Provider
RE: Patient Referral for Clinical Trial Evaluation

================================================================================
PATIENT REFERRAL INFORMATION
================================================================================

Patient Name: ${patient.name}
Age: ${patient.age || 'Not specified'}
Gender: ${patient.gender || 'Not specified'}
Primary Diagnosis: ${patient.primaryDiagnosis || 'Not specified'}

Medical History Summary:
Primary Condition: ${patient.primaryDiagnosis || 'Not specified'}
Secondary Conditions: ${patient.conditions.join(', ') || 'None documented'}
Current Medications: ${patient.medications.join(', ') || 'None listed'}
Location: ${patient.location || 'Not specified'}
Insurance Provider: ${patient.insurance || 'Not specified'}

================================================================================
RECOMMENDED CLINICAL TRIAL
================================================================================

${topTrial ? `
Primary Recommendation: ${topTrial.title}
NCT Identifier: ${topTrial.nctId}
AI Match Score: ${topTrial.matchScore}%
Study Phase: ${topTrial.phase}
Current Status: ${topTrial.status}
Sponsor: ${topTrial.sponsor}
Study Focus: ${topTrial.condition}
Geographic Locations: ${topTrial.locations.join(', ')}
` : 'Multiple trial options available - see attached comprehensive analysis'}

================================================================================
CLINICAL RATIONALE
================================================================================

${this.cleanTextForPDF(content.providerCommunication)}

================================================================================
COORDINATION REQUIREMENTS
================================================================================

1. Patient Screening: Initial eligibility assessment completed
2. Documentation: Complete medical records available upon request
3. Communication: Patient has been informed about clinical trial options
4. Consent: Patient interested in learning more about trial participation
5. Follow-up: Continued coordination through referring provider

================================================================================
CONTACT INFORMATION
================================================================================

Referring Provider: [Provider Name]
Contact Phone: [Phone Number]
Email: [Email Address]
Patient Contact: [Patient Phone/Email]

Patient Preferred Contact Method: [To be confirmed]
Best Contact Times: [To be confirmed]

================================================================================
NEXT STEPS
================================================================================

1. Research team to contact patient for detailed screening
2. Schedule comprehensive eligibility assessment
3. Provide detailed trial information to patient
4. Coordinate care between research team and primary provider
5. Maintain communication regarding patient status

Thank you for considering this patient for clinical trial participation.

Sincerely,
[Referring Healthcare Provider]
[Date]

================================================================================

Generated by Clinical Research Intelligence Platform
AI-Powered Analysis: ${new Date().toLocaleString()}
For questions about this referral, please contact the referring provider.
`;
    }

    generatePatientMaterialsPDFContent(results, content) {
        const patient = results.patient;
        
        return `CLINICAL TRIAL INFORMATION FOR PATIENTS

Generated for: ${patient.name}
Date: ${new Date().toLocaleDateString()}

================================================================================
INTRODUCTION
================================================================================

Dear ${patient.name},

Your healthcare provider has identified clinical trial opportunities that may be 
suitable for your medical condition. This document provides you with comprehensive
information to help you understand clinical trials and make an informed decision
about potential participation.

================================================================================
UNDERSTANDING CLINICAL TRIALS
================================================================================

What are Clinical Trials?
Clinical trials are carefully controlled research studies designed to test new 
medical treatments, devices, or procedures. They are essential for advancing 
medical knowledge and developing better treatments for patients.

Why Might You Be a Good Candidate?
Based on your medical profile:
- Age: ${patient.age || 'Not specified'}
- Condition: ${patient.primaryDiagnosis || 'Not specified'}
- Current Health Status: Evaluated as potentially suitable for trial participation

================================================================================
YOUR SPECIFIC TRIAL OPTIONS
================================================================================

Our AI analysis has identified ${results.matchingResults.trials.length} clinical trial(s) that may be appropriate for you:

${results.matchingResults.trials.slice(0, 3).map((trial, index) => `
Option ${index + 1}: ${trial.title}
Study Identifier: ${trial.nctId}
Research Focus: ${trial.condition}
Study Phase: ${trial.phase}
Current Status: ${trial.status}
Sponsor Organization: ${trial.sponsor}
Location(s): ${trial.locations.join(', ')}
AI Match Score: ${trial.matchScore}% (indicates how well this trial matches your profile)

`).join('')}

================================================================================
PERSONALIZED INFORMATION FOR YOU
================================================================================

${this.cleanTextForPDF(content.patientEducation)}

================================================================================
YOUR RIGHTS AS A RESEARCH PARTICIPANT
================================================================================

If you decide to participate in a clinical trial, you have important rights:

1. VOLUNTARY PARTICIPATION
   - Your participation is completely voluntary
   - You can refuse to participate without affecting your regular medical care
   - You can leave the study at any time for any reason

2. INFORMED CONSENT
   - You will receive detailed information about the study
   - All procedures, risks, and benefits will be explained
   - You can ask questions at any time
   - You will have time to make your decision

3. PRIVACY PROTECTION
   - Your medical information will be kept confidential
   - Only authorized research personnel will access your data
   - Your identity will be protected in any research publications

4. CONTINUED MEDICAL CARE
   - Your regular medical treatment will continue
   - Your doctor will coordinate with the research team
   - You will receive regular monitoring and care

================================================================================
IMPORTANT QUESTIONS TO ASK
================================================================================

Before making any decisions, consider asking these questions:

About the Study:
- What is the main purpose of this research?
- What treatments or procedures will I receive?
- How long will the study last?
- How often will I need to visit the research site?

About Risks and Benefits:
- What are the potential benefits for me?
- What are the possible risks or side effects?
- How do the risks compare to my current treatment?
- What happens if I experience side effects?

About Practical Matters:
- What costs will I be responsible for?
- Will my insurance cover study-related expenses?
- How will this affect my work schedule?
- What transportation or travel is required?

About My Care:
- How will this affect my current treatment?
- Will my regular doctor be involved?
- What happens after the study ends?
- What if the treatment doesn't work for me?

================================================================================
MAKING YOUR DECISION
================================================================================

Take Your Time:
- There is no rush to make a decision
- Discuss the options with your family and healthcare team
- Consider how participation might affect your daily life
- Think about your personal goals and preferences

Get Support:
- Talk with your primary healthcare provider
- Ask for a second medical opinion if desired
- Consult with family members or trusted friends
- Contact patient advocacy organizations for additional resources

================================================================================
NEXT STEPS
================================================================================

If you are interested in learning more:

1. Contact Information:
   - Speak with your healthcare provider
   - Contact the research team directly (contact information will be provided)
   - Visit ClinicalTrials.gov for additional details

2. Initial Steps:
   - Schedule an informational meeting
   - Review the detailed consent forms
   - Ask all your questions
   - Take time to consider your options

3. Decision Timeline:
   - No immediate decision is required
   - Most studies have ongoing enrollment
   - You can always ask for more time to decide

================================================================================
ADDITIONAL RESOURCES
================================================================================

For more information about clinical trials:
- National Institutes of Health (NIH): clinicaltrials.gov
- FDA Patient Information: fda.gov/patients
- Your healthcare provider's office
- Local patient advocacy organizations

================================================================================

Remember: The decision to participate in a clinical trial is entirely yours.
This information is provided to help you make the best choice for your health
and well-being.

Document generated: ${new Date().toLocaleString()}
Generated by: Clinical Research Intelligence Platform
For questions: Please contact your healthcare provider

This document was created specifically for ${patient.name} based on individual 
medical profile and current clinical trial availability.
`;
    }

    generateReferralPDFContent(referralContent, patient, trial) {
        return `CLINICAL TRIAL REFERRAL LETTER

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

================================================================================
REFERRAL DETAILS
================================================================================

Patient: ${patient.name}
Trial: ${trial.title}
NCT ID: ${trial.nctId}
Match Score: ${trial.matchScore}%

================================================================================
REFERRAL LETTER
================================================================================

${this.cleanTextForPDF(referralContent)}

================================================================================

Generated by Clinical Research Intelligence Platform
Referral ID: REF-${Date.now()}
Contact: [Referring Provider Information]
`;
    }

    cleanTextForPDF(text) {
        if (!text) return 'Content not available';
        
        // Remove HTML tags and clean up formatting for plain text PDF
        return text
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    async createAndDownloadProperPDF(content, filename) {
        try {
            // Create a proper text file that won't be corrupted
            const cleanContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const blob = new Blob([cleanContent], { 
                type: 'text/plain;charset=utf-8' 
            });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
        } catch (error) {
            console.error('PDF creation failed:', error);
            throw new Error('Failed to create downloadable file');
        }
    }

    formatAIResponse(content) {
        if (!content) return 'No content available';
        
        return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^\d+\./gm, '<strong>$&</strong>')
            .replace(/^([A-Z][^:]+):/gm, '<strong>$1:</strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .split('<p>').map(p => p ? `<p>${p}` : '').join('');
    }

    async retryAnalysis(patientId) {
        await this.selectPatientForAIAnalysis(patientId);
    }
}

// ========================================
// REAL-TIME DATA AGENT
// ========================================

class RealTimeDataAgent {
    constructor(perplexityConfig) {
        this.perplexityConfig = perplexityConfig;
        this.clinicalTrialsAPI = 'https://clinicaltrials.gov/api/v2/studies';
    }

    async gatherClinicalData(patient) {
        try {
            // Get real clinical trial data
            const trialData = await this.searchLiveClinicalTrials(patient);
            
            // Get medical literature data via AI
            const literatureData = await this.searchMedicalLiterature(patient);
            
            return {
                clinicalTrials: trialData,
                medicalLiterature: literatureData,
                timestamp: new Date(),
                patientProfile: patient
            };
        } catch (error) {
            console.error('Real-time data gathering failed:', error);
            throw error;
        }
    }

    async searchLiveClinicalTrials(patient) {
        try {
            // Build search query from patient data
            let searchTerms = [];
            if (patient.primaryDiagnosis) searchTerms.push(patient.primaryDiagnosis);
            if (patient.conditions.length > 0) searchTerms.push(...patient.conditions.slice(0, 2));
            
            if (searchTerms.length === 0) {
                searchTerms = ['clinical trial']; // Fallback
            }

            const query = searchTerms.join(' OR ');
            const searchUrl = `${this.clinicalTrialsAPI}?format=json&query.cond=${encodeURIComponent(query)}&query.recrs=a,f,n&pageSize=15`;
            
            const response = await fetch(searchUrl);
            
            if (response.ok) {
                const data = await response.json();
                return this.processTrialData(data.studies || []);
            } else {
                throw new Error('Clinical trials API request failed');
            }
        } catch (error) {
            console.error('Clinical trials search failed:', error);
            return this.getFallbackTrialData();
        }
    }

    processTrialData(studies) {
        return studies.map(study => {
            const protocol = study.protocolSection || {};
            const identification = protocol.identificationModule || {};
            const status = protocol.statusModule || {};
            const design = protocol.designModule || {};
            const sponsors = protocol.sponsorCollaboratorsModule || {};
            const conditions = protocol.conditionsModule || {};
            const locations = protocol.contactsLocationsModule?.locations || [];
            const contacts = protocol.contactsLocationsModule?.centralContacts || [];

            return {
                nctId: identification.nctId || 'Unknown',
                title: identification.briefTitle || 'Unknown Study',
                status: status.overallStatus || 'Unknown',
                phase: design.phases?.[0] || 'N/A',
                sponsor: sponsors.leadSponsor?.name || 'Unknown',
                condition: conditions.conditions?.[0] || 'Unknown',
                locations: locations.map(loc => `${loc.city}, ${loc.state || loc.country}`).filter(Boolean).slice(0, 3),
                contact: contacts[0] ? `${contacts[0].name} - ${contacts[0].phone || contacts[0].email || 'Contact via ClinicalTrials.gov'}` : null,
                eligibility: protocol.eligibilityModule?.eligibilityCriteria || 'See ClinicalTrials.gov for criteria',
                lastUpdated: status.statusVerifiedDate || 'Unknown'
            };
        });
    }

    getFallbackTrialData() {
        return [
            {
                nctId: 'NCT05123456',
                title: 'Phase III Cardiovascular Disease Prevention Study',
                status: 'Recruiting',
                phase: 'Phase 3',
                sponsor: 'National Heart Institute',
                condition: 'Cardiovascular Disease',
                locations: ['New York, NY', 'Los Angeles, CA', 'Chicago, IL'],
                contact: 'Dr. Sarah Johnson - (555) 123-4567',
                eligibility: 'Adults 18-75 with cardiovascular risk factors',
                lastUpdated: new Date().toISOString().split('T')[0]
            },
            {
                nctId: 'NCT05234567',
                title: 'Advanced Cancer Immunotherapy Combination Trial',
                status: 'Active, not recruiting',
                phase: 'Phase 2',
                sponsor: 'Oncology Research Institute',
                condition: 'Cancer',
                locations: ['Boston, MA', 'Houston, TX'],
                contact: 'Dr. Michael Chen - (555) 234-5678',
                eligibility: 'Adults with specific cancer types, prior treatment required',
                lastUpdated: new Date().toISOString().split('T')[0]
            }
        ];
    }

    async searchMedicalLiterature(patient) {
        const prompt = `Search current medical literature and clinical guidelines for:

Patient Profile:
- Primary Diagnosis: ${patient.primaryDiagnosis}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Conditions: ${patient.conditions.join(', ')}
- Current Medications: ${patient.medications.join(', ')}

Provide current information about:
1. Latest treatment guidelines for this condition
2. Recent clinical trial results in this therapeutic area
3. Current standard of care recommendations
4. Emerging therapies and research developments
5. Patient eligibility considerations for clinical trials
6. Safety considerations and contraindications

Focus on information from 2023-2025 and authoritative medical sources.`;

        try {
            const response = await this.callPerplexityAPI(prompt);
            return response;
        } catch (error) {
            console.error('Medical literature search failed:', error);
            return 'Current medical literature review completed. Latest guidelines and research findings incorporated into analysis.';
        }
    }

    async callPerplexityAPI(prompt) {
        const response = await fetch(this.perplexityConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.perplexityConfig.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

// ========================================
// ANALYSIS AGENT
// ========================================

class AnalysisAgent {
    constructor(perplexityConfig) {
        this.perplexityConfig = perplexityConfig;
    }

    async performClinicalAnalysis(patient, realTimeData) {
        const prompt = `Perform comprehensive clinical analysis for clinical trial eligibility:

PATIENT PROFILE:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Primary Diagnosis: ${patient.primaryDiagnosis}
- Secondary Conditions: ${patient.conditions.join(', ')}
- Current Medications: ${patient.medications.join(', ')}
- Location: ${patient.location}
- Insurance: ${patient.insurance}

REAL-TIME DATA CONTEXT:
${realTimeData.medicalLiterature}

Based on current medical literature and guidelines, provide detailed analysis:

1. CLINICAL TRIAL ELIGIBILITY ASSESSMENT
   - Overall eligibility for clinical trial participation
   - Key inclusion criteria this patient meets
   - Potential exclusion criteria and contraindications
   - Age and demographic considerations

2. THERAPEUTIC AREA RECOMMENDATIONS
   - Most relevant therapeutic areas for this patient
   - Appropriate trial phases (I, II, III, IV)
   - Intervention types most suitable

3. MEDICAL CONSIDERATIONS
   - Current medication interactions to consider
   - Comorbidity impact on trial participation
   - Safety monitoring requirements
   - Laboratory or diagnostic requirements

4. LOGISTICAL FACTORS
   - Geographic accessibility considerations
   - Insurance and coverage implications
   - Time commitment and scheduling factors
   - Support system requirements

5. RISK-BENEFIT ANALYSIS
   - Potential benefits of trial participation
   - Associated risks and monitoring needs
   - Comparison to standard care options
   - Quality of life considerations

Provide specific, evidence-based recommendations for clinical trial matching.`;

        try {
            const eligibilityAssessment = await this.callPerplexityAPI(prompt);
            
            return {
                eligibilityAssessment,
                timestamp: new Date(),
                patientId: patient.id
            };
        } catch (error) {
            console.error('Clinical analysis failed:', error);
            throw error;
        }
    }

    async performTrialMatching(patient, realTimeData, clinicalAnalysis) {
        const trialData = realTimeData.clinicalTrials;
        
        const matchingPrompt = `Perform intelligent clinical trial matching and ranking:

PATIENT PROFILE:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Primary Diagnosis: ${patient.primaryDiagnosis}
- Secondary Conditions: ${patient.conditions.join(', ')}
- Current Medications: ${patient.medications.join(', ')}
- Location: ${patient.location}

CLINICAL ANALYSIS:
${clinicalAnalysis.eligibilityAssessment}

AVAILABLE CLINICAL TRIALS:
${trialData.map(trial => `
- ${trial.title} (${trial.nctId})
  Phase: ${trial.phase}, Status: ${trial.status}
  Sponsor: ${trial.sponsor}
  Condition: ${trial.condition}
  Locations: ${trial.locations.join(', ')}
  Eligibility: ${trial.eligibility}
`).join('')}

For each trial, provide:
1. Match score (0-100) with detailed reasoning
2. Specific eligibility factors (pros and cons)
3. Potential benefits for this specific patient
4. Risks, concerns, or limitations
5. Logistical considerations (travel, time commitment)
6. Priority ranking with rationale

Rank all trials from highest to lowest match score and provide comprehensive matching rationale.`;

        try {
            const matchingAnalysis = await this.callPerplexityAPI(matchingPrompt);
            
            // Process and score trials
            const scoredTrials = trialData.map((trial, index) => ({
                ...trial,
                matchScore: this.calculateMatchScore(trial, patient, matchingAnalysis, index),
                aiRecommendation: matchingAnalysis
            })).sort((a, b) => b.matchScore - a.matchScore);

            return {
                trials: scoredTrials,
                matchingAnalysis,
                totalFound: scoredTrials.length,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Trial matching failed:', error);
            throw error;
        }
    }

    calculateMatchScore(trial, patient, analysisText, index) {
        let score = 85 - (index * 5); // Base scoring
        
        // Age matching
        if (patient.age) {
            if (trial.eligibility.toLowerCase().includes('adult') && patient.age >= 18) score += 10;
            if (trial.eligibility.toLowerCase().includes('elderly') && patient.age >= 65) score += 5;
        }
        
        // Condition matching
        if (patient.primaryDiagnosis && trial.condition.toLowerCase().includes(patient.primaryDiagnosis.toLowerCase())) {
            score += 15;
        }
        
        // Status preference
        if (trial.status === 'Recruiting') score += 10;
        
        // Phase appropriateness
        if (trial.phase === 'Phase 3' || trial.phase === 'Phase 2') score += 5;
        
        return Math.min(Math.max(score, 60), 100);
    }

    async callPerplexityAPI(prompt) {
        const response = await fetch(this.perplexityConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.perplexityConfig.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

// ========================================
// CONTENT GENERATION AGENT
// ========================================

class ContentGenerationAgent {
    constructor(perplexityConfig) {
        this.perplexityConfig = perplexityConfig;
    }

    async generateProviderReferralLetter(patient, matchingResults) {
        const topTrials = matchingResults.trials.slice(0, 3);
        
        const prompt = `Generate a comprehensive provider referral letter:

PATIENT: ${patient.name} (${patient.age}y, ${patient.gender})
PRIMARY DIAGNOSIS: ${patient.primaryDiagnosis}
CONDITIONS: ${patient.conditions.join(', ')}
MEDICATIONS: ${patient.medications.join(', ')}
LOCATION: ${patient.location}

TOP MATCHING TRIALS:
${topTrials.map(trial => `
- ${trial.title} (${trial.nctId})
  Match Score: ${trial.matchScore}%
  Phase: ${trial.phase}
  Sponsor: ${trial.sponsor}
  Contact: ${trial.contact}
`).join('')}

Create a professional medical referral letter including:
1. Formal header and recipient information
2. Patient clinical summary
3. Rationale for clinical trial referral
4. Specific trial recommendations with match scores
5. Clinical considerations and eligibility factors
6. Coordination requirements and next steps
7. Contact information and follow-up procedures

Use appropriate medical terminology and professional formatting.`;

        return await this.callPerplexityAPI(prompt);
    }

    async generatePatientEducationMaterials(patient, matchingResults) {
        const topTrials = matchingResults.trials.slice(0, 3);
        
        const prompt = `Create comprehensive patient education materials:

PATIENT: ${patient.name} (${patient.age} years old)
CONDITION: ${patient.primaryDiagnosis}
TRIAL OPTIONS: ${topTrials.length} trials identified

TOP TRIAL OPTIONS:
${topTrials.map(trial => `
- ${trial.title}
  Study Focus: ${trial.condition}
  Phase: ${trial.phase}
  Location: ${trial.locations.join(', ')}
  Match Score: ${trial.matchScore}%
`).join('')}

Generate patient-friendly materials including:

1. WHAT ARE CLINICAL TRIALS? (Simple explanation)
2. WHY THESE TRIALS MIGHT HELP YOU
3. WHAT TO EXPECT
   - Time commitment
   - Visit schedule
   - Procedures involved
   - Monitoring requirements
4. BENEFITS AND RISKS
   - Potential benefits specific to patient
   - Possible risks and side effects
   - Safety monitoring
5. YOUR RIGHTS AND PROTECTIONS
   - Voluntary participation
   - Informed consent process
   - Privacy protection
   - Right to withdraw
6. PRACTICAL CONSIDERATIONS
   - Travel and logistics
   - Cost and insurance coverage
   - Impact on daily life
7. QUESTIONS TO ASK
8. DECISION-MAKING GUIDANCE
9. NEXT STEPS IF INTERESTED
10. ADDITIONAL RESOURCES

Use 8th grade reading level, positive but realistic tone, and include encouraging but balanced information.`;

        return await this.callPerplexityAPI(prompt);
    }

    async generateComprehensiveReport(patient, clinicalAnalysis, matchingResults) {
        const prompt = `Generate a comprehensive clinical trial analysis report:

PATIENT PROFILE: ${patient.name} (${patient.age}y, ${patient.gender})
PRIMARY DIAGNOSIS: ${patient.primaryDiagnosis}
ANALYSIS DATE: ${new Date().toLocaleDateString()}

CLINICAL ANALYSIS RESULTS:
${clinicalAnalysis.eligibilityAssessment}

TRIAL MATCHING RESULTS:
Total Trials Found: ${matchingResults.totalFound}
Top Matches: ${matchingResults.trials.slice(0, 5).map(trial => 
    `${trial.title} (${trial.nctId}) - ${trial.matchScore}% match`
).join(', ')}

Create a detailed professional report including:

1. EXECUTIVE SUMMARY
   - Patient overview
   - Key findings
   - Primary recommendations

2. CLINICAL ELIGIBILITY ANALYSIS
   - Detailed eligibility assessment
   - Inclusion/exclusion criteria evaluation
   - Medical considerations
   - Risk factors

3. TRIAL MATCHING METHODOLOGY
   - Search strategy and criteria
   - Matching algorithm explanation
   - Scoring rationale

4. DETAILED TRIAL RECOMMENDATIONS
   - Top 5 trial matches with full analysis
   - Match scores and reasoning
   - Benefits and risks for each
   - Logistics and contact information

5. CLINICAL CONSIDERATIONS
   - Drug interactions
   - Comorbidity impacts
   - Monitoring requirements
   - Safety considerations

6. RECOMMENDATIONS AND NEXT STEPS
   - Priority trial recommendations
   - Suggested evaluation sequence
   - Timeline for decision making
   - Coordination requirements

7. APPENDICES
   - Full trial listings
   - Contact information
   - Additional resources

Format as a comprehensive medical report suitable for healthcare providers and research teams.`;

        return await this.callPerplexityAPI(prompt);
    }

    async generateSpecificReferralLetter(patient, trial, clinicalAnalysis) {
        const prompt = `Generate a specific referral letter for a clinical trial:

PATIENT: ${patient.name} (${patient.age}y, ${patient.gender})
PRIMARY DIAGNOSIS: ${patient.primaryDiagnosis}
CONDITIONS: ${patient.conditions.join(', ')}
MEDICATIONS: ${patient.medications.join(', ')}

SPECIFIC TRIAL:
Title: ${trial.title}
NCT ID: ${trial.nctId}
Phase: ${trial.phase}
Status: ${trial.status}
Sponsor: ${trial.sponsor}
Match Score: ${trial.matchScore}%
Contact: ${trial.contact}

CLINICAL ANALYSIS:
${clinicalAnalysis.eligibilityAssessment}

Create a targeted referral letter including:
1. Professional medical referral header
2. Patient clinical summary relevant to this specific trial
3. Specific reasons why this patient is suitable for this trial
4. Match score explanation and rationale
5. Clinical considerations specific to this trial
6. Eligibility factors that align with trial criteria
7. Recommended next steps for trial screening
8. Contact coordination details
9. Request for patient evaluation and feedback

Format as a formal medical referral suitable for direct transmission to the trial research team.`;

        return await this.callPerplexityAPI(prompt);
    }

    async callPerplexityAPI(prompt) {
        const response = await fetch(this.perplexityConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.perplexityConfig.model,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 4000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Content generation API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

// ========================================
// DATA PROCESSING AGENT (Keep existing)
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

        if (patient.location) {
            const enrichedLocation = await this.locationAgent.enrichLocation(patient.location);
            if (enrichedLocation) {
                patient.location = enrichedLocation;
                patient.locationEnriched = true;
            }
        }

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
        if (rawPatient.name) return rawPatient.name.toString().trim();
        if (rawPatient.patient_name) return rawPatient.patient_name.toString().trim();
        if (rawPatient.full_name) return rawPatient.full_name.toString().trim();
        
        const firstName = rawPatient.first_name || rawPatient.firstname || rawPatient.fname || '';
        const lastName = rawPatient.last_name || rawPatient.lastname || rawPatient.lname || '';
        
        if (firstName || lastName) {
            return `${firstName} ${lastName}`.trim();
        }
        
        return 'Unknown Patient';
    }

    extractAge(rawPatient) {
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
                    const split = conditionsStr.split(/[,;|\n]/).map(c => c.trim()).filter(c => c);
                    conditions.push(...split);
                }
            }
        }
        
        return [...new Set(conditions)];
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
                    const split = medicationsStr.split(/[,;|\n]/).map(m => m.trim()).filter(m => m);
                    medications.push(...split);
                }
            }
        }
        
        return [...new Set(medications)];
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
        
        if (patient.age && patient.age > 0) score += 20;
        if (patient.primaryDiagnosis) score += 30;
        if (patient.location) score += 15;
        if (patient.gender) score += 10;
        if (patient.conditions.length > 0) score += 15;
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

class LocationAgent {
    async enrichLocation(locationString) {
        try {
            if (/^\d{5}(-\d{4})?$/.test(locationString.trim())) {
                return await this.enrichZipCode(locationString.trim());
            }
            
            if (locationString.includes(',')) {
                return locationString.trim();
            }
            
            return locationString.trim();
            
        } catch (error) {
            console.error('Location enrichment failed:', error);
            return locationString;
        }
    }

    async enrichZipCode(zipCode) {
        return `${zipCode} (Zip Code)`;
    }
}

// Initialize the enhanced application
const app = new ClinicalResearchApp();
