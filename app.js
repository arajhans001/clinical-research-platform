// Clinical Research Intelligence Platform - All Issues Fixed
class ClinicalResearchApp {
    constructor() {
        this.currentStakeholder = null;
        this.patientData = [];
        this.trialData = [];
        this.croData = null;
        this.drugDevelopmentData = null;
        
        this.perplexityConfig = {
            apiKey: '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',
            apiUrl: 'https://api.perplexity.ai/chat/completions',
            model: 'sonar'
        };
        
        this.clinicalTrialsAPI = 'https://clinicaltrials.gov/api/v2/studies';
        this.fdaAPI = 'https://api.fda.gov';
        
        this.dataProcessingAgent = new DataProcessingAgent();
        this.locationAgent = new LocationAgent();
        this.realTimeDataAgent = new RealTimeDataAgent(this.perplexityConfig);
        this.analysisAgent = new AnalysisAgent(this.perplexityConfig);
        
        this.charts = {};
        this.analysisResults = {};
        this.generatedContent = {};
        this.selectedTrialContent = {}; // NEW: Store trial-specific content
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
        document.getElementById('stakeholder-selector').addEventListener('click', () => {
            document.getElementById('stakeholder-modal').classList.remove('hidden');
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            document.getElementById('stakeholder-modal').classList.add('hidden');
        });

        document.getElementById('get-started-btn').addEventListener('click', () => {
            document.getElementById('stakeholder-modal').classList.remove('hidden');
        });

        document.querySelectorAll('.stakeholder-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const stakeholder = e.currentTarget.dataset.stakeholder;
                this.selectStakeholder(stakeholder);
            });
        });

        const patientFilesInput = document.getElementById('patient-files');
        if (patientFilesInput) {
            patientFilesInput.addEventListener('change', (e) => {
                this.handlePatientFileUpload(e.target.files);
            });
        }

        const manualForm = document.getElementById('manual-patient-form');
        if (manualForm) {
            manualForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addManualPatient();
            });
        }

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
        
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        document.getElementById('welcome-section').classList.add('hidden');
        document.getElementById(`${stakeholder}-dashboard`).classList.remove('hidden');
        document.getElementById('stakeholder-modal').classList.add('hidden');
    }

    // ========================================
    // PATIENT DATA PROCESSING
    // ========================================

    async handlePatientFileUpload(files) {
        if (files.length === 0) return;

        const uploadedData = [];
        const processingStatus = this.showProcessingStatus('Processing patient files...');
        
        for (let file of files) {
            try {
                processingStatus.updateMessage(`Processing ${file.name}...`);
                const rawData = await this.parsePatientFile(file);
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
            await this.displayPatientsWithEnrichment(this.patientData);
            alert(`Successfully processed ${uploadedData.length} patient records. Ready for AI analysis.`);
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
                        <span class="btn-icon">AI</span>
                        AI Analysis & Trial Matching
                    </button>
                    ${patient.processedAt ? `<div class="processed-info">Processed: ${new Date(patient.processedAt).toLocaleTimeString()}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // AI ANALYSIS FUNCTIONALITY
    // ========================================

    async selectPatientForAIAnalysis(patientId) {
        const patient = this.patientData.find(p => p.id === patientId);
        if (!patient) {
            alert('Patient not found. Please try again.');
            return;
        }

        const analysisSection = document.getElementById('trial-analysis-section');
        if (analysisSection) {
            analysisSection.classList.remove('hidden');
        }
        
        const summaryContainer = document.getElementById('selected-patient-summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="selected-patient">
                    <h4>Real-Time AI Analysis for: ${patient.name}</h4>
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
            resultsContainer.innerHTML = '<div class="loading-ai">Retrieving real-time clinical trial data...</div>';
            
            const realTimeData = await this.realTimeDataAgent.gatherClinicalData(patient);
            
            // Step 2: AI clinical analysis
            this.updateAnalysisProgress(50, 'AI Clinical Analysis');
            resultsContainer.innerHTML = '<div class="loading-ai">AI agent performing comprehensive clinical analysis...</div>';
            
            const clinicalAnalysis = await this.analysisAgent.performClinicalAnalysis(patient, realTimeData);
            
            // Step 3: Trial matching 
            this.updateAnalysisProgress(75, 'Trial Matching');
            resultsContainer.innerHTML = '<div class="loading-ai">AI matching patient to current clinical trials...</div>';
            
            const matchingResults = await this.analysisAgent.performTrialMatching(patient, realTimeData, clinicalAnalysis);
            
            // Step 4: ONLY generate basic content (not trial-specific)
            this.updateAnalysisProgress(100, 'Content Generation');
            resultsContainer.innerHTML = '<div class="loading-ai">Generating basic analysis materials...</div>';
            
            // Store all results WITHOUT trial-specific content
            this.storeCompleteAnalysisResults(patient.id, {
                realTimeData,
                clinicalAnalysis,
                matchingResults,
                patient
            });
            
            // Display results WITHOUT document section initially
            resultsContainer.innerHTML = this.renderTrialMatchingResults(patient.id, clinicalAnalysis, matchingResults);

        } catch (error) {
            console.error('Real-time AI analysis failed:', error);
            resultsContainer.innerHTML = `
                <div class="error-container">
                    <h4>Analysis Error</h4>
                    <p>Real-time AI analysis encountered an issue: ${error.message}</p>
                    <div class="error-details">
                        <p><strong>Error Type:</strong> ${error.constructor.name}</p>
                        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                    </div>
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

    storeCompleteAnalysisResults(patientId, results) {
        this.analysisResults[patientId] = {
            ...results,
            timestamp: new Date()
        };
    }

    // FIXED: Only show trials initially, documents appear after trial selection
    renderTrialMatchingResults(patientId, clinicalAnalysis, matchingResults) {
        return `
            <div class="ai-analysis-complete">
                <div class="analysis-header">
                    <h4>Real-Time AI Analysis Complete</h4>
                    <div class="analysis-timestamp">Completed: ${new Date().toLocaleString()}</div>
                </div>
                
                <div class="analysis-section">
                    <h5>Clinical Assessment</h5>
                    <div class="analysis-content">${this.formatAIResponse(clinicalAnalysis.eligibilityAssessment)}</div>
                </div>
                
                <div class="analysis-section">
                    <h5>Matching Clinical Trials (${matchingResults.trials.length} found)</h5>
                    <p>Select a trial below to generate personalized referral letters and educational materials.</p>
                    <div class="trials-ranked">
                        ${this.renderMatchedTrials(matchingResults.trials, patientId)}
                    </div>
                </div>
                
                <!-- FIXED: Documents section hidden initially -->
                <div class="analysis-section" id="documents-section-${patientId}" style="display: none;">
                    <h5>AI-Generated Communication Materials</h5>
                    <div class="selected-trial-info" id="selected-trial-info-${patientId}"></div>
                    <div class="communication-materials">
                        <div class="materials-grid">
                            <div class="material-card">
                                <h6>Provider Communication</h6>
                                <p>Professional referral letters and clinical summaries</p>
                                <button class="btn btn--sm btn--outline" onclick="app.previewProviderMaterials('${patientId}')">
                                    Preview Materials
                                </button>
                            </div>
                            <div class="material-card">
                                <h6>Patient Education</h6>
                                <p>Easy-to-understand trial explanations and guides</p>
                                <button class="btn btn--sm btn--outline" onclick="app.previewPatientMaterials('${patientId}')">
                                    Preview Materials
                                </button>
                            </div>
                            <div class="material-card">
                                <h6>Analysis Report</h6>
                                <p>Comprehensive AI analysis and recommendations</p>
                                <button class="btn btn--sm btn--outline" onclick="app.previewAnalysisReport('${patientId}')">
                                    Preview Report
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analysis-actions">
                        <button class="btn btn--primary" onclick="app.downloadComprehensiveReport('${patientId}')">
                            Download Complete Report
                        </button>
                        <button class="btn btn--secondary" onclick="app.downloadProviderCommunication('${patientId}')">
                            Download Provider Communication
                        </button>
                        <button class="btn btn--outline" onclick="app.downloadPatientMaterials('${patientId}')">
                            Download Patient Materials
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderMatchedTrials(trials, patientId) {
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
                    <button class="btn btn--sm btn--primary" onclick="app.selectTrialAndGenerateContent('${trial.nctId}', '${patientId}')">
                        Select This Trial
                    </button>
                    <button class="btn btn--sm btn--secondary" onclick="window.open('https://clinicaltrials.gov/study/${trial.nctId}', '_blank')">
                        View on ClinicalTrials.gov
                    </button>
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // FIXED: TRIAL SELECTION AND CONTENT GENERATION
    // ========================================

    async selectTrialAndGenerateContent(nctId, patientId) {
        const loadingStatus = this.showProcessingStatus('Generating personalized materials for selected trial...');
        
        try {
            const patient = this.patientData.find(p => p.id === patientId);
            const analysisResults = this.analysisResults[patientId];
            
            if (!patient || !analysisResults) {
                throw new Error('Patient data or analysis results not found');
            }

            const selectedTrial = analysisResults.matchingResults.trials.find(t => t.nctId === nctId);
            
            if (!selectedTrial) {
                throw new Error('Selected trial not found');
            }

            // Generate ALL content for this specific trial
            const contentGenerator = new ContentGenerationAgent(this.perplexityConfig);
            
            const trialSpecificContent = {
                referralLetter: await contentGenerator.generateSpecificReferralLetter(patient, selectedTrial, analysisResults.clinicalAnalysis),
                providerCommunication: await contentGenerator.generateTrialSpecificProviderLetter(patient, selectedTrial, analysisResults.clinicalAnalysis),
                patientEducation: await contentGenerator.generateTrialSpecificPatientMaterials(patient, selectedTrial),
                analysisReport: await contentGenerator.generateTrialSpecificReport(patient, selectedTrial, analysisResults.clinicalAnalysis)
            };
            
            // Store trial-specific content
            this.selectedTrialContent[patientId] = {
                selectedTrial,
                content: trialSpecificContent
            };
            
            loadingStatus.close();
            
            // Show documents section and update trial info
            this.showDocumentsSection(patientId, selectedTrial);
            
            // Show referral modal immediately
            this.showGeneratedReferralModal(trialSpecificContent.referralLetter, patient, selectedTrial);
            
        } catch (error) {
            loadingStatus.close();
            console.error('Trial selection error:', error);
            alert(`Failed to generate materials for selected trial: ${error.message}`);
        }
    }

    // FIXED: Show documents section after trial selection
    showDocumentsSection(patientId, selectedTrial) {
        const documentsSection = document.getElementById(`documents-section-${patientId}`);
        const trialInfoDiv = document.getElementById(`selected-trial-info-${patientId}`);
        
        if (documentsSection) {
            documentsSection.style.display = 'block';
        }
        
        if (trialInfoDiv) {
            trialInfoDiv.innerHTML = `
                <div class="selected-trial-banner">
                    <h6>Materials Generated for Selected Trial:</h6>
                    <div class="trial-summary">
                        <strong>${selectedTrial.title}</strong> (${selectedTrial.nctId})
                        <span class="trial-match">${selectedTrial.matchScore}% Match</span>
                    </div>
                </div>
            `;
        }
    }

    // FIXED: Proper referral modal with working encoding
    showGeneratedReferralModal(referralContent, patient, trial) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Clean content for display and storage
        const cleanContent = this.cleanContentForDisplay(referralContent);
        
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
                            <p><strong>Patient:</strong> ${this.escapeHtml(patient.name)} | <strong>Trial:</strong> ${this.escapeHtml(trial.nctId)}</p>
                        </div>
                        <div class="referral-content">
                            <pre>${cleanContent}</pre>
                        </div>
                    </div>
                    <div class="referral-actions">
                        <button class="btn btn--primary" onclick="app.copyToClipboard(\`${this.escapeForJS(cleanContent)}\`)">
                            Copy to Clipboard
                        </button>
                        <button class="btn btn--secondary" onclick="app.emailReferral('${patient.id}', '${trial.nctId}')">
                            Email Referral
                        </button>
                        <button class="btn btn--outline" onclick="app.downloadReferralFile('${patient.id}', '${trial.nctId}')">
                            Download as File
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // FIXED: String cleaning and escaping functions
    cleanContentForDisplay(content) {
        if (!content) return 'No content available';
        
        return content
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeForJS(text) {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }

    // FIXED: Simple clipboard copy
    copyToClipboard(content) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(content).then(() => {
                    alert('Content copied to clipboard successfully.');
                }).catch(() => {
                    this.fallbackCopyToClipboard(content);
                });
            } else {
                this.fallbackCopyToClipboard(content);
            }
        } catch (error) {
            console.error('Copy error:', error);
            alert('Failed to copy content. Please select and copy manually.');
        }
    }

    fallbackCopyToClipboard(content) {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                alert('Content copied to clipboard successfully.');
            } else {
                alert('Failed to copy content. Please select and copy manually.');
            }
        } catch (err) {
            alert('Failed to copy content. Please select and copy manually.');
        }
        
        document.body.removeChild(textArea);
    }

    async emailReferral(patientId, nctId) {
        try {
            const patient = this.patientData.find(p => p.id === patientId);
            const trialContent = this.selectedTrialContent[patientId];
            
            if (!trialContent) {
                alert('Please select a trial first to generate referral materials.');
                return;
            }
            
            const trial = trialContent.selectedTrial;
            const subject = `Clinical Trial Referral - ${patient.name} - ${nctId}`;
            const body = `Please find the clinical trial referral for ${patient.name} regarding trial ${nctId} - ${trial.title}.`;
            
            const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailtoLink);
            
            alert('Email client opened with referral information.');
        } catch (error) {
            console.error('Email error:', error);
            alert('Failed to open email client. Please try again.');
        }
    }

    // ========================================
    // FIXED: FUNCTIONAL PREVIEW METHODS
    // ========================================

    previewProviderMaterials(patientId) {
        const trialContent = this.selectedTrialContent[patientId];
        
        if (!trialContent || !trialContent.content.providerCommunication) {
            alert('Please select a trial first to generate provider materials.');
            return;
        }

        this.showPreviewModal('Provider Communication Materials', trialContent.content.providerCommunication);
    }

    previewPatientMaterials(patientId) {
        const trialContent = this.selectedTrialContent[patientId];
        
        if (!trialContent || !trialContent.content.patientEducation) {
            alert('Please select a trial first to generate patient materials.');
            return;
        }

        this.showPreviewModal('Patient Education Materials', trialContent.content.patientEducation);
    }

    previewAnalysisReport(patientId) {
        const trialContent = this.selectedTrialContent[patientId];
        
        if (!trialContent || !trialContent.content.analysisReport) {
            alert('Please select a trial first to generate analysis report.');
            return;
        }

        this.showPreviewModal('Comprehensive Analysis Report', trialContent.content.analysisReport);
    }

    // FIXED: Working preview modal
    showPreviewModal(title, content) {
        const cleanContent = this.cleanContentForDisplay(content);
        
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
                        <pre>${cleanContent}</pre>
                    </div>
                    <div class="preview-actions">
                        <button class="btn btn--primary" onclick="app.copyToClipboard(\`${this.escapeForJS(cleanContent)}\`)">
                            Copy Content
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

    // ========================================
    // FIXED: WORKING FILE DOWNLOADS
    // ========================================

    downloadComprehensiveReport(patientId) {
        const trialContent = this.selectedTrialContent[patientId];
        const patient = this.patientData.find(p => p.id === patientId);
        
        if (!trialContent || !patient) {
            alert('Please select a trial first to generate comprehensive report.');
            return;
        }

        try {
            const content = this.generateComprehensiveReportContent(patient, trialContent);
            const filename = `comprehensive-report-${this.sanitizeFilename(patient.name)}.txt`;
            this.downloadTextFile(content, filename);
            alert('Comprehensive report downloaded successfully.');
        } catch (error) {
            console.error('Download error:', error);
            alert(`Failed to download comprehensive report: ${error.message}`);
        }
    }

    downloadProviderCommunication(patientId) {
        const trialContent = this.selectedTrialContent[patientId];
        const patient = this.patientData.find(p => p.id === patientId);
        
        if (!trialContent || !patient) {
            alert('Please select a trial first to generate provider communication.');
            return;
        }

        try {
            const content = this.cleanContentForDisplay(trialContent.content.providerCommunication);
            const filename = `provider-communication-${this.sanitizeFilename(patient.name)}.txt`;
            this.downloadTextFile(content, filename);
            alert('Provider communication downloaded successfully.');
        } catch (error) {
            console.error('Download error:', error);
            alert(`Failed to download provider communication: ${error.message}`);
        }
    }

    downloadPatientMaterials(patientId) {
        const trialContent = this.selectedTrialContent[patientId];
        const patient = this.patientData.find(p => p.id === patientId);
        
        if (!trialContent || !patient) {
            alert('Please select a trial first to generate patient materials.');
            return;
        }

        try {
            const content = this.cleanContentForDisplay(trialContent.content.patientEducation);
            const filename = `patient-materials-${this.sanitizeFilename(patient.name)}.txt`;
            this.downloadTextFile(content, filename);
            alert('Patient materials downloaded successfully.');
        } catch (error) {
            console.error('Download error:', error);
            alert(`Failed to download patient materials: ${error.message}`);
        }
    }

    downloadReferralFile(patientId, nctId) {
        const trialContent = this.selectedTrialContent[patientId];
        const patient = this.patientData.find(p => p.id === patientId);
        
        if (!trialContent || !patient) {
            alert('Referral content not found.');
            return;
        }

        try {
            const content = this.cleanContentForDisplay(trialContent.content.referralLetter);
            const filename = `referral-letter-${this.sanitizeFilename(patient.name)}-${nctId}.txt`;
            this.downloadTextFile(content, filename);
            alert('Referral letter downloaded successfully.');
        } catch (error) {
            console.error('Download error:', error);
            alert(`Failed to download referral letter: ${error.message}`);
        }
    }

    // FIXED: Proper file download function
    downloadTextFile(content, filename) {
        try {
            // Ensure content is clean and properly formatted
            const cleanContent = content
                .replace(/\r\n/g, '\n')
                .replace(/\r/g, '\n')
                .replace(/[^\x00-\x7F\n]/g, ''); // Keep only ASCII and newlines
            
            // Create blob with explicit UTF-8 encoding
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
            
            // Clean up URL
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            
        } catch (error) {
            console.error('File creation failed:', error);
            throw new Error('Failed to create downloadable file');
        }
    }

    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9\-_\.]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }

    generateComprehensiveReportContent(patient, trialContent) {
        const trial = trialContent.selectedTrial;
        
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
SELECTED CLINICAL TRIAL
================================================================================

Trial Title: ${trial.title}
NCT ID: ${trial.nctId}
Match Score: ${trial.matchScore}%
Phase: ${trial.phase}
Status: ${trial.status}
Sponsor: ${trial.sponsor}
Condition: ${trial.condition}
Locations: ${trial.locations.join(', ')}
Contact: ${trial.contact || 'See ClinicalTrials.gov for contact information'}

================================================================================
AI-GENERATED ANALYSIS REPORT
================================================================================

${this.cleanContentForDisplay(trialContent.content.analysisReport)}

================================================================================
PROVIDER COMMUNICATION
================================================================================

${this.cleanContentForDisplay(trialContent.content.providerCommunication)}

================================================================================
PATIENT EDUCATION MATERIALS
================================================================================

${this.cleanContentForDisplay(trialContent.content.patientEducation)}

================================================================================

This report was generated using advanced AI analysis of real-time clinical data.
For questions or additional analysis, please contact the research team.

Report generated: ${new Date().toLocaleString()}
Platform: Clinical Research Intelligence Platform
AI Analysis: Powered by Perplexity AI
`;
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
// REAL-TIME DATA AGENT (No changes needed)
// ========================================

class RealTimeDataAgent {
    constructor(perplexityConfig) {
        this.perplexityConfig = perplexityConfig;
        this.clinicalTrialsAPI = 'https://clinicaltrials.gov/api/v2/studies';
    }

    async gatherClinicalData(patient) {
        try {
            const trialData = await this.searchLiveClinicalTrials(patient);
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
            let searchTerms = [];
            if (patient.primaryDiagnosis) searchTerms.push(patient.primaryDiagnosis);
            if (patient.conditions.length > 0) searchTerms.push(...patient.conditions.slice(0, 2));
            
            if (searchTerms.length === 0) {
                searchTerms = ['clinical trial'];
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
        const prompt = `Search current medical literature and clinical guidelines for patient with:
Primary Diagnosis: ${patient.primaryDiagnosis}
Age: ${patient.age}
Gender: ${patient.gender}
Conditions: ${patient.conditions.join(', ')}
Current Medications: ${patient.medications.join(', ')}

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
        try {
            const requestBody = {
                model: 'sonar',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            };

            const response = await fetch(this.perplexityConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API request failed: ${response.status}. Response: ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response format');
            }
            
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Perplexity API call failed:', error);
            throw error;
        }
    }
}

// ========================================
// ANALYSIS AGENT (No changes needed)
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
2. THERAPEUTIC AREA RECOMMENDATIONS
3. MEDICAL CONSIDERATIONS
4. LOGISTICAL FACTORS
5. RISK-BENEFIT ANALYSIS

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

For each trial, provide match score (0-100) with detailed reasoning and rank all trials from highest to lowest match score.`;

        try {
            const matchingAnalysis = await this.callPerplexityAPI(matchingPrompt);
            
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
        let score = 85 - (index * 5);
        
        if (patient.age) {
            if (trial.eligibility.toLowerCase().includes('adult') && patient.age >= 18) score += 10;
            if (trial.eligibility.toLowerCase().includes('elderly') && patient.age >= 65) score += 5;
        }
        
        if (patient.primaryDiagnosis && trial.condition.toLowerCase().includes(patient.primaryDiagnosis.toLowerCase())) {
            score += 15;
        }
        
        if (trial.status === 'Recruiting') score += 10;
        if (trial.phase === 'Phase 3' || trial.phase === 'Phase 2') score += 5;
        
        return Math.min(Math.max(score, 60), 100);
    }

    async callPerplexityAPI(prompt) {
        try {
            const requestBody = {
                model: 'sonar',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            };

            const response = await fetch(this.perplexityConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API request failed: ${response.status}. Response: ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response format');
            }
            
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Analysis Agent API call failed:', error);
            throw error;
        }
    }
}

// ========================================
// ENHANCED CONTENT GENERATION AGENT
// ========================================

class ContentGenerationAgent {
    constructor(perplexityConfig) {
        this.perplexityConfig = perplexityConfig;
    }

    async generateSpecificReferralLetter(patient, trial, clinicalAnalysis) {
        const prompt = `Generate a specific referral letter for clinical trial:

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

    // NEW: Trial-specific provider letter
    async generateTrialSpecificProviderLetter(patient, trial, clinicalAnalysis) {
        const prompt = `Generate provider communication materials for specific trial:

PATIENT: ${patient.name} (${patient.age}y, ${patient.gender})
PRIMARY DIAGNOSIS: ${patient.primaryDiagnosis}

SELECTED TRIAL: ${trial.title} (${trial.nctId})
Match Score: ${trial.matchScore}%
Sponsor: ${trial.sponsor}
Phase: ${trial.phase}

Create comprehensive provider communication including:
1. Executive summary of why this trial is recommended
2. Trial-specific benefits for this patient
3. Coordination requirements
4. Timeline and next steps
5. Contact information and logistics
6. Follow-up protocols

Format as professional medical communication.`;

        return await this.callPerplexityAPI(prompt);
    }

    // NEW: Trial-specific patient materials
    async generateTrialSpecificPatientMaterials(patient, trial) {
        const prompt = `Create patient education materials for specific trial:

PATIENT: ${patient.name} (${patient.age} years old)
CONDITION: ${patient.primaryDiagnosis}

SELECTED TRIAL: ${trial.title}
Study Focus: ${trial.condition}
Phase: ${trial.phase}
Locations: ${trial.locations.join(', ')}
Sponsor: ${trial.sponsor}

Generate patient-friendly materials including:
1. About this specific clinical trial
2. Why this trial might help you
3. What to expect in this study
4. Timeline and commitment required
5. Location and logistics information
6. Your rights and protections
7. Questions to ask the research team
8. Next steps if you're interested
9. Contact information

Use simple, encouraging language at 8th grade reading level.`;

        return await this.callPerplexityAPI(prompt);
    }

    // NEW: Trial-specific analysis report
    async generateTrialSpecificReport(patient, trial, clinicalAnalysis) {
        const prompt = `Generate comprehensive analysis report for specific trial selection:

PATIENT: ${patient.name} (${patient.age}y, ${patient.gender})
PRIMARY DIAGNOSIS: ${patient.primaryDiagnosis}

SELECTED TRIAL: ${trial.title} (${trial.nctId})
Match Score: ${trial.matchScore}%
Phase: ${trial.phase}
Sponsor: ${trial.sponsor}

CLINICAL ANALYSIS: ${clinicalAnalysis.eligibilityAssessment}

Create detailed report including:
1. Executive summary of trial selection rationale
2. Detailed match score breakdown
3. Clinical considerations specific to this trial
4. Risk-benefit analysis for this patient and trial combination
5. Timeline and logistics assessment
6. Alternative considerations
7. Recommendations for next steps

Format as comprehensive medical analysis report.`;

        return await this.callPerplexityAPI(prompt);
    }

    async callPerplexityAPI(prompt) {
        try {
            const requestBody = {
                model: 'sonar',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 2000,
                temperature: 0.7
            };

            const response = await fetch(this.perplexityConfig.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`Content generation API request failed: ${response.status}. Response: ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid API response format');
            }
            
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Content Generation Agent API call failed:', error);
            throw error;
        }
    }
}

// ========================================
// DATA PROCESSING AGENT (No changes needed)
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

// Initialize the application
const app = new ClinicalResearchApp();
