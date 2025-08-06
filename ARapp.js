// Clinical Research Intelligence Platform - Main Application
class ClinicalResearchApp {
    constructor() {
        this.currentStakeholder = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.initializeData();
        this.startRealTimeUpdates();
    }

    // Sample data for the application
    initializeData() {
        this.sampleTrials = [
            {
                nctId: "NCT05123456",
                title: "Phase III Trial of CardioStent Pro in Complex Coronary Lesions",
                condition: "Coronary Artery Disease",
                phase: "Phase 3",
                status: "Recruiting",
                location: "Multiple US Sites",
                sponsor: "CardioTech Solutions",
                estimatedEnrollment: 2400,
                eligibility: {
                    ageMin: 18,
                    ageMax: 80,
                    gender: "All",
                    conditions: ["Coronary Artery Disease", "Chest Pain", "Myocardial Infarction"]
                }
            },
            {
                nctId: "NCT05234567",
                title: "CAR-T Cell Therapy for Relapsed B-Cell Lymphoma",
                condition: "B-Cell Lymphoma",
                phase: "Phase 2",
                status: "Active",
                location: "Cancer Centers Nationwide",
                sponsor: "ImmunoGen Therapeutics",
                estimatedEnrollment: 180,
                eligibility: {
                    ageMin: 18,
                    ageMax: 75,
                    gender: "All",
                    conditions: ["B-Cell Lymphoma", "Relapsed Lymphoma", "Non-Hodgkin Lymphoma"]
                }
            },
            {
                nctId: "NCT05345678",
                title: "Novel Alzheimer's Drug XR-2024 Phase II Study",
                condition: "Alzheimer's Disease",
                phase: "Phase 2",
                status: "Recruiting",
                location: "Neurology Centers",
                sponsor: "NeuroPharm Inc",
                estimatedEnrollment: 450,
                eligibility: {
                    ageMin: 55,
                    ageMax: 85,
                    gender: "All",
                    conditions: ["Alzheimer's Disease", "Dementia", "Mild Cognitive Impairment"]
                }
            }
        ];

        this.fdaGuidance = [
            {
                id: "FDA-CYBER2025",
                title: "Cybersecurity in Medical Devices: Updated Requirements for 2025",
                date: "2025-08-01",
                impact: "High",
                category: "Device Security",
                description: "New mandatory cybersecurity requirements for all connected medical devices."
            },
            {
                id: "FDA-AI2025",
                title: "AI/ML Software as Medical Device Framework Update",
                date: "2025-07-15",
                impact: "Medium",
                category: "AI/ML Devices",
                description: "Updated guidance for artificial intelligence and machine learning in medical devices."
            },
            {
                id: "FDA-BIOMARKER2025",
                title: "Biomarker Qualification Process Modernization",
                date: "2025-06-30",
                impact: "Medium",
                category: "Biomarkers",
                description: "Streamlined process for biomarker qualification in drug development."
            },
            {
                id: "FDA-DIGITAL2025",
                title: "Digital Health Technologies for Remote Data Collection",
                date: "2025-06-15",
                impact: "High",
                category: "Digital Health",
                description: "Guidance on using digital health technologies in clinical trials."
            }
        ];

        this.siteMetrics = [
            {
                siteId: "SITE-001",
                name: "Metro Medical Research Center",
                location: "New York, NY",
                enrollmentRate: 8.5,
                retentionRate: 92,
                activeTrials: 12,
                performance: "Excellent"
            },
            {
                siteId: "SITE-002",
                name: "West Coast Clinical Research",
                location: "Los Angeles, CA",
                enrollmentRate: 6.2,
                retentionRate: 88,
                activeTrials: 8,
                performance: "Good"
            },
            {
                siteId: "SITE-003",
                name: "Texas Medical Research Institute",
                location: "Houston, TX",
                enrollmentRate: 7.8,
                retentionRate: 90,
                activeTrials: 15,
                performance: "Excellent"
            },
            {
                siteId: "SITE-004",
                name: "Midwest Clinical Trials Center",
                location: "Chicago, IL",
                enrollmentRate: 5.4,
                retentionRate: 85,
                activeTrials: 6,
                performance: "Average"
            }
        ];
    }

    bindEventListeners() {
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });

        // If DOM is already loaded, setup immediately
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Modal and stakeholder selection
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showStakeholderModal();
            });
        }

        const stakeholderSelector = document.getElementById('stakeholder-selector');
        if (stakeholderSelector) {
            stakeholderSelector.addEventListener('click', (e) => {
                e.preventDefault();
                this.showStakeholderModal();
            });
        }

        const closeModal = document.getElementById('close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideStakeholderModal();
            });
        }

        // Stakeholder card selections
        document.querySelectorAll('.stakeholder-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const stakeholder = card.dataset.stakeholder;
                this.selectStakeholder(stakeholder);
            });
        });

        // Patient form submission
        const patientForm = document.getElementById('patient-form');
        if (patientForm) {
            patientForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.findMatchingTrials();
            });
        }

        // ROI Calculator
        const calculateRoiBtn = document.getElementById('calculate-roi');
        if (calculateRoiBtn) {
            calculateRoiBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.calculateROI();
            });
        }

        // Export buttons
        const exportPhysicianBtn = document.getElementById('export-physician-data');
        if (exportPhysicianBtn) {
            exportPhysicianBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportData('physician');
            });
        }

        const exportPharmaBtn = document.getElementById('export-pharma-data');
        if (exportPharmaBtn) {
            exportPharmaBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportData('pharma');
            });
        }

        const exportCroBtn = document.getElementById('export-cro-data');
        if (exportCroBtn) {
            exportCroBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportData('cro');
            });
        }

        // Modal backdrop click
        const stakeholderModal = document.getElementById('stakeholder-modal');
        if (stakeholderModal) {
            stakeholderModal.addEventListener('click', (e) => {
                if (e.target === stakeholderModal) {
                    this.hideStakeholderModal();
                }
            });
        }

        // Fix age validation
        const ageInput = document.getElementById('patient-age');
        if (ageInput) {
            ageInput.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value && (value < 0 || value > 120)) {
                    e.target.setCustomValidity('Age must be between 0 and 120');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        }
    }

    showStakeholderModal() {
        const modal = document.getElementById('stakeholder-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Focus first stakeholder card for accessibility
            const firstCard = modal.querySelector('.stakeholder-card');
            if (firstCard) {
                firstCard.focus();
            }
        }
    }

    hideStakeholderModal() {
        const modal = document.getElementById('stakeholder-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    selectStakeholder(stakeholder) {
        this.currentStakeholder = stakeholder;
        this.hideStakeholderModal();
        this.showDashboard(stakeholder);
        this.updateNavigation(stakeholder);
        
        // Load stakeholder-specific data
        if (stakeholder === 'physician') {
            this.loadPhysicianDashboard();
        } else if (stakeholder === 'pharma') {
            this.loadPharmaDashboard();
        } else if (stakeholder === 'cro') {
            this.loadCRODashboard();
        }

        this.showNotification('success', `Welcome to the ${this.getStakeholderName(stakeholder)} dashboard!`);
    }

    getStakeholderName(stakeholder) {
        const names = {
            physician: 'Physician',
            pharma: 'Pharmaceutical',
            cro: 'CRO'
        };
        return names[stakeholder] || stakeholder;
    }

    showDashboard(stakeholder) {
        // Hide welcome screen
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.classList.add('hidden');
        }
        
        // Hide all dashboards
        document.querySelectorAll('.dashboard').forEach(dashboard => {
            dashboard.classList.add('hidden');
        });
        
        // Show selected dashboard
        const targetDashboard = document.getElementById(`${stakeholder}-dashboard`);
        if (targetDashboard) {
            targetDashboard.classList.remove('hidden');
        }
    }

    updateNavigation(stakeholder) {
        const currentStakeholderEl = document.getElementById('current-stakeholder');
        if (currentStakeholderEl) {
            currentStakeholderEl.textContent = this.getStakeholderName(stakeholder);
        }
    }

    // Physician Dashboard Functions
    loadPhysicianDashboard() {
        // Dashboard is ready - no additional loading needed
        console.log('Physician dashboard loaded');
    }

    async findMatchingTrials() {
        const loadingSpinner = document.getElementById('physician-loading');
        const resultsContainer = document.getElementById('trial-results');
        
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        if (resultsContainer) resultsContainer.innerHTML = '';

        // Get patient data
        const conditionEl = document.getElementById('patient-condition');
        const ageEl = document.getElementById('patient-age');
        const genderEl = document.getElementById('patient-gender');
        const locationEl = document.getElementById('patient-location');
        const insuranceEl = document.getElementById('patient-insurance');

        if (!conditionEl || !ageEl || !genderEl || !locationEl) {
            this.showNotification('error', 'Please fill in all required fields.');
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            return;
        }

        const patientData = {
            condition: conditionEl.value.trim(),
            age: parseInt(ageEl.value),
            gender: genderEl.value,
            location: locationEl.value.trim(),
            insurance: insuranceEl ? insuranceEl.value : ''
        };

        // Validate required fields
        if (!patientData.condition || !patientData.age || !patientData.location) {
            this.showNotification('error', 'Please fill in all required fields.');
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            return;
        }

        // Simulate API delay
        await this.delay(1500);
        
        if (loadingSpinner) loadingSpinner.classList.add('hidden');

        // Find matching trials
        const matchingTrials = this.findTrialsForPatient(patientData);
        this.displayTrialResults(matchingTrials);

        if (matchingTrials.length > 0) {
            this.showNotification('success', `Found ${matchingTrials.length} matching clinical trials!`);
        } else {
            this.showNotification('info', 'No matching trials found. Try adjusting search criteria.');
        }
    }

    findTrialsForPatient(patientData) {
        return this.sampleTrials.filter(trial => {
            // Check condition match
            const conditionMatch = trial.eligibility.conditions.some(condition => 
                condition.toLowerCase().includes(patientData.condition.toLowerCase()) ||
                patientData.condition.toLowerCase().includes(condition.toLowerCase())
            );

            // Check age eligibility
            const ageMatch = patientData.age >= trial.eligibility.ageMin && 
                            patientData.age <= trial.eligibility.ageMax;

            // Check gender eligibility
            const genderMatch = trial.eligibility.gender === 'All' || 
                               trial.eligibility.gender.toLowerCase() === patientData.gender.toLowerCase();

            return conditionMatch && ageMatch && genderMatch;
        }).map(trial => ({
            ...trial,
            eligibilityScore: this.calculateEligibilityScore(trial, patientData)
        })).sort((a, b) => b.eligibilityScore - a.eligibilityScore);
    }

    calculateEligibilityScore(trial, patientData) {
        let score = 0;
        
        // Base score for meeting basic criteria
        score += 60;
        
        // Condition match strength
        const exactMatch = trial.eligibility.conditions.some(condition => 
            condition.toLowerCase() === patientData.condition.toLowerCase()
        );
        if (exactMatch) score += 25;
        else score += 10;

        // Age range optimization (closer to middle of range = higher score)
        const ageRange = trial.eligibility.ageMax - trial.eligibility.ageMin;
        const agePosition = (patientData.age - trial.eligibility.ageMin) / ageRange;
        const ageOptimality = 1 - Math.abs(agePosition - 0.5) * 2;
        score += ageOptimality * 10;

        // Phase preference (Phase 3 trials often preferred)
        if (trial.phase === 'Phase 3') score += 5;
        else if (trial.phase === 'Phase 2') score += 3;

        return Math.min(Math.max(score, 0), 100);
    }

    displayTrialResults(trials) {
        const container = document.getElementById('trial-results');
        if (!container) return;
        
        if (trials.length === 0) {
            container.innerHTML = '<p style="color: var(--color-text-secondary);">No matching trials found. Please try different search criteria.</p>';
            return;
        }

        container.innerHTML = trials.map(trial => `
            <div class="trial-result">
                <div class="trial-header">
                    <h4 class="trial-title">${trial.title}</h4>
                    <span class="trial-phase">${trial.phase}</span>
                </div>
                <div class="trial-info">
                    <div class="trial-detail"><strong>Condition:</strong> ${trial.condition}</div>
                    <div class="trial-detail"><strong>Status:</strong> ${trial.status}</div>
                    <div class="trial-detail"><strong>Location:</strong> ${trial.location}</div>
                    <div class="trial-detail"><strong>NCT ID:</strong> ${trial.nctId}</div>
                </div>
                <div class="eligibility-score">
                    <span class="score-text">Eligibility Match: ${Math.round(trial.eligibilityScore)}%</span>
                    <div class="score-bar">
                        <div class="score-fill" style="width: ${trial.eligibilityScore}%"></div>
                    </div>
                </div>
                <div class="trial-actions">
                    <button class="btn btn--primary btn--sm" onclick="app.referPatient('${trial.nctId}')">
                        Refer Patient
                    </button>
                    <button class="btn btn--outline btn--sm" onclick="app.getTrialDetails('${trial.nctId}')">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    referPatient(nctId) {
        this.showNotification('success', `Patient referral initiated for trial ${nctId}. Contact information sent to your email.`);
    }

    getTrialDetails(nctId) {
        const trial = this.sampleTrials.find(t => t.nctId === nctId);
        if (trial) {
            this.showNotification('info', `Opening detailed information for ${trial.title}...`);
            // In a real application, this would open a detailed view or modal
        }
    }

    // Pharma Dashboard Functions
    async loadPharmaDashboard() {
        this.loadFDAGuidance();
        setTimeout(() => {
            this.initializeMarketTrendsChart();
        }, 100);
    }

    async loadFDAGuidance() {
        const loadingSpinner = document.getElementById('fda-loading');
        const container = document.getElementById('fda-guidance-list');
        
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        
        // Simulate API delay
        await this.delay(1000);
        
        if (loadingSpinner) loadingSpinner.classList.add('hidden');

        if (!container) return;

        container.innerHTML = this.fdaGuidance.map(guidance => `
            <div class="fda-guidance-item">
                <div class="fda-guidance-header">
                    <h4 class="fda-guidance-title">${guidance.title}</h4>
                    <span class="fda-impact ${guidance.impact.toLowerCase()}">${guidance.impact} Impact</span>
                </div>
                <div class="fda-guidance-meta">
                    ${guidance.category} • ${this.formatDate(guidance.date)}
                </div>
                <p style="margin-top: 8px; color: var(--color-text-secondary); font-size: var(--font-size-sm);">
                    ${guidance.description}
                </p>
            </div>
        `).join('');
    }

    initializeMarketTrendsChart() {
        const ctx = document.getElementById('market-trends-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.marketTrends) {
            this.charts.marketTrends.destroy();
        }

        this.charts.marketTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                datasets: [
                    {
                        label: 'Market Share (%)',
                        data: [18.2, 19.1, 20.3, 19.8, 21.2, 22.1, 23.5, 23.8],
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Competitor Average (%)',
                        data: [22.1, 21.8, 21.5, 21.9, 21.2, 20.8, 20.3, 19.9],
                        borderColor: '#B4413C',
                        backgroundColor: 'rgba(180, 65, 60, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 15,
                        max: 25,
                        title: {
                            display: true,
                            text: 'Market Share (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month (2025)'
                        }
                    }
                }
            }
        });
    }

    calculateROI() {
        const budgetEl = document.getElementById('trial-budget');
        const revenueEl = document.getElementById('expected-revenue');
        const probabilityEl = document.getElementById('success-probability');

        if (!budgetEl || !revenueEl || !probabilityEl) {
            this.showNotification('error', 'ROI calculator fields not found.');
            return;
        }

        const budget = parseFloat(budgetEl.value);
        const revenue = parseFloat(revenueEl.value);
        const probability = parseFloat(probabilityEl.value) / 100;

        if (!budget || !revenue || !probability) {
            this.showNotification('error', 'Please fill in all ROI calculator fields.');
            return;
        }

        const expectedRevenue = revenue * probability;
        const roi = ((expectedRevenue - budget) / budget) * 100;

        const resultsEl = document.getElementById('roi-results');
        const valueEl = document.getElementById('roi-value');

        if (resultsEl) resultsEl.classList.remove('hidden');
        if (valueEl) {
            valueEl.textContent = `${roi.toFixed(1)}%`;
            valueEl.style.color = roi > 0 ? 'var(--color-success)' : 'var(--color-error)';
        }

        this.showNotification('success', `ROI calculated: ${roi.toFixed(1)}%`);
    }

    // CRO Dashboard Functions
    async loadCRODashboard() {
        this.loadSitePerformance();
        setTimeout(() => {
            this.initializeEnrollmentChart();
        }, 100);
    }

    async loadSitePerformance() {
        const loadingSpinner = document.getElementById('site-loading');
        const container = document.getElementById('site-performance-list');
        
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
        
        // Simulate API delay
        await this.delay(1200);
        
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        if (!container) return;

        const sortedSites = [...this.siteMetrics].sort((a, b) => b.enrollmentRate - a.enrollmentRate);

        container.innerHTML = sortedSites.map(site => `
            <div class="site-performance-item">
                <div class="site-info">
                    <h4 class="site-name">${site.name}</h4>
                    <div class="site-location">${site.location}</div>
                </div>
                <div class="site-metrics">
                    <div class="site-metric">
                        <span class="site-metric-value">${site.enrollmentRate}</span>
                        <span class="site-metric-label">Enroll/Mo</span>
                    </div>
                    <div class="site-metric">
                        <span class="site-metric-value">${site.retentionRate}%</span>
                        <span class="site-metric-label">Retention</span>
                    </div>
                    <div class="site-metric">
                        <span class="site-metric-value">${site.activeTrials}</span>
                        <span class="site-metric-label">Trials</span>
                    </div>
                </div>
                <span class="performance-badge ${site.performance.toLowerCase()}">${site.performance}</span>
            </div>
        `).join('');
    }

    initializeEnrollmentChart() {
        const ctx = document.getElementById('enrollment-chart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.charts.enrollment) {
            this.charts.enrollment.destroy();
        }

        this.charts.enrollment = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
                datasets: [
                    {
                        label: 'Actual Enrollment',
                        data: [12, 18, 25, 22, 28, 31, 26, 29],
                        backgroundColor: '#1FB8CD',
                    },
                    {
                        label: 'Target Enrollment',
                        data: [20, 20, 20, 20, 20, 20, 20, 20],
                        backgroundColor: '#FFC185',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Patients Enrolled'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Enrollment Period'
                        }
                    }
                }
            }
        });
    }

    // Export Functions
    exportData(stakeholder) {
        let data = {};
        let filename = '';

        switch (stakeholder) {
            case 'physician':
                data = {
                    exportDate: new Date().toISOString(),
                    stakeholder: 'Physician Dashboard',
                    patientReferrals: 24,
                    matchSuccessRate: '87%',
                    activeTrials: 156,
                    recentSearches: [
                        { condition: 'Coronary Artery Disease', matches: 3 },
                        { condition: 'B-Cell Lymphoma', matches: 2 },
                        { condition: 'Alzheimer Disease', matches: 1 }
                    ]
                };
                filename = 'physician-dashboard-export.json';
                break;
            
            case 'pharma':
                data = {
                    exportDate: new Date().toISOString(),
                    stakeholder: 'Pharmaceutical Dashboard',
                    fdaGuidance: this.fdaGuidance,
                    competitorTrials: 42,
                    marketShare: '23.8%',
                    lastROICalculation: {
                        budget: 50,
                        expectedRevenue: 500,
                        probability: 35,
                        roi: '245%'
                    }
                };
                filename = 'pharma-dashboard-export.json';
                break;
            
            case 'cro':
                data = {
                    exportDate: new Date().toISOString(),
                    stakeholder: 'CRO Dashboard',
                    sites: this.siteMetrics,
                    enrollmentVelocity: [12, 18, 25, 22, 28, 31, 26, 29],
                    budgetStatus: {
                        siteActivation: 'On Track',
                        patientRecruitment: 'Over Budget',
                        dataManagement: 'Under Budget'
                    }
                };
                filename = 'cro-dashboard-export.json';
                break;
        }

        this.downloadJSON(data, filename);
        this.showNotification('success', `${this.getStakeholderName(stakeholder)} data exported successfully!`);
    }

    downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // Utility Functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    showNotification(type, message) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 4px;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} 
                ${type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
            <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                ${message}
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);

        // Remove on click
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    // Real-time Updates Simulation
    startRealTimeUpdates() {
        // Simulate real-time FDA guidance updates
        setInterval(() => {
            if (this.currentStakeholder === 'pharma') {
                this.simulateNewFDAGuidance();
            }
        }, 30000); // Every 30 seconds

        // Simulate enrollment updates
        setInterval(() => {
            if (this.currentStakeholder === 'cro' && this.charts.enrollment) {
                this.updateEnrollmentData();
            }
        }, 45000); // Every 45 seconds

        // Simulate market data updates
        setInterval(() => {
            if (this.currentStakeholder === 'pharma' && this.charts.marketTrends) {
                this.updateMarketData();
            }
        }, 60000); // Every 60 seconds
    }

    simulateNewFDAGuidance() {
        const newGuidance = {
            id: `FDA-${Date.now()}`,
            title: "Real-time FDA Update: New Drug Safety Communication",
            date: new Date().toISOString().split('T')[0],
            impact: Math.random() > 0.5 ? "Medium" : "High",
            category: "Safety",
            description: "Live update from FDA regarding new safety information."
        };

        this.fdaGuidance.unshift(newGuidance);
        this.showNotification('info', 'New FDA guidance available! Check the latest updates.');
        
        // Refresh the FDA guidance display
        this.loadFDAGuidance();
    }

    updateEnrollmentData() {
        if (!this.charts.enrollment) return;

        const data = this.charts.enrollment.data.datasets[0].data;
        const newValue = Math.floor(Math.random() * 15) + 20; // Random value between 20-35
        
        // Shift array and add new value
        data.shift();
        data.push(newValue);
        
        this.charts.enrollment.update();
        this.showNotification('info', `Enrollment data updated: ${newValue} new patients this week.`);
    }

    updateMarketData() {
        if (!this.charts.marketTrends) return;

        const marketData = this.charts.marketTrends.data.datasets[0].data;
        const competitorData = this.charts.marketTrends.data.datasets[1].data;
        
        // Add small random variations
        const lastMarketValue = marketData[marketData.length - 1];
        const lastCompetitorValue = competitorData[competitorData.length - 1];
        
        const newMarketValue = lastMarketValue + (Math.random() - 0.5) * 2;
        const newCompetitorValue = lastCompetitorValue + (Math.random() - 0.5) * 1.5;
        
        marketData.shift();
        marketData.push(Math.max(15, Math.min(30, newMarketValue)));
        
        competitorData.shift();
        competitorData.push(Math.max(15, Math.min(30, newCompetitorValue)));
        
        this.charts.marketTrends.update();
        this.showNotification('info', 'Market trends updated with latest competitive intelligence.');
    }

    // API Integration Simulation
    async fetchFromClinicalTrialsAPI(searchParams) {
        // Simulate API call to ClinicalTrials.gov
        await this.delay(1000);
        return this.sampleTrials.filter(trial => 
            trial.condition.toLowerCase().includes(searchParams.condition?.toLowerCase() || '')
        );
    }

    async fetchFDAData() {
        // Simulate API call to OpenFDA
        await this.delay(800);
        return this.fdaGuidance;
    }

    async fetchPerplexityInsights(query) {
        // Simulate Perplexity Pro API call for competitive intelligence
        await this.delay(1500);
        return {
            insights: `AI-generated competitive analysis for: ${query}`,
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            sources: ['PubMed', 'FDA.gov', 'ClinicalTrials.gov', 'Industry Reports']
        };
    }
}

// Initialize the application
let app;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new ClinicalResearchApp();
        window.app = app;
    });
} else {
    app = new ClinicalResearchApp();
    window.app = app;
}