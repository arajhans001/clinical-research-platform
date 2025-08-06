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

        // Patient matching form
        const patientForm = document.getElementById('patient-matching-form');
        if (patientForm) {
            patientForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePatientMatching();
            });
        }

        // Modal outside click
        document.getElementById('stakeholder-modal').addEventListener('click', (e) => {
            if (e.target.id === 'stakeholder-modal') {
                document.getElementById('stakeholder-modal').classList.add('hidden');
            }
        });
    }

    initializeData() {
        this.sampleTrials = [
            {
                nctId: "NCT05123456",
                title: "Phase III Trial of CardioStent Pro in Complex Coronary Lesions",
                condition: "coronary-artery-disease",
                phase: "Phase 3",
                status: "Recruiting",
                location: "New York, NY",
                sponsor: "CardioTech Solutions",
                estimatedEnrollment: 2400,
                contact: "Dr. Sarah Johnson - (555) 123-4567",
                eligibility: {
                    ageMin: 18,
                    ageMax: 80,
                    gender: "All",
                    conditions: ["coronary-artery-disease", "chest-pain", "myocardial-infarction"]
                }
            },
            {
                nctId: "NCT05234567",
                title: "Advanced Diabetes Management with Continuous Glucose Monitoring",
                condition: "diabetes",
                phase: "Phase 2",
                status: "Active",
                location: "Multiple US Sites",
                sponsor: "Diabetes Research Corp",
                estimatedEnrollment: 180,
                contact: "Dr. Michael Chen - (555) 234-5678",
                eligibility: {
                    ageMin: 25,
                    ageMax: 75,
                    gender: "All",
                    conditions: ["diabetes", "type-2-diabetes", "insulin-resistance"]
                }
            },
            {
                nctId: "NCT05345678",
                title: "Novel Alzheimer's Drug XR-2024 Phase II Study",
                condition: "alzheimers",
                phase: "Phase 2",
                status: "Recruiting",
                location: "Boston, MA",
                sponsor: "NeuroTech Research",
                estimatedEnrollment: 300,
                contact: "Dr. Lisa Wang - (555) 345-6789",
                eligibility: {
                    ageMin: 55,
                    ageMax: 85,
                    gender: "All",
                    conditions: ["alzheimers", "dementia", "cognitive-decline"]
                }
            },
            {
                nctId: "NCT05456789",
                title: "Innovative Cancer Immunotherapy Combination Study",
                condition: "cancer",
                phase: "Phase 1/2",
                status: "Recruiting",
                location: "Los Angeles, CA",
                sponsor: "Oncology Innovations Inc",
                estimatedEnrollment: 120,
                contact: "Dr. Robert Martinez - (555) 456-7890",
                eligibility: {
                    ageMin: 18,
                    ageMax: 75,
                    gender: "All",
                    conditions: ["cancer", "solid-tumors", "metastatic-cancer"]
                }
            }
        ];
    }

    selectStakeholder(stakeholder) {
        this.currentStakeholder = stakeholder;
        
        // Update navigation
        const stakeholderNames = {
            physician: 'Physician',
            pharma: 'Pharmaceutical',
            cro: 'CRO'
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

        // Initialize stakeholder-specific features
        if (stakeholder === 'cro') {
            setTimeout(() => this.initializeEnrollmentChart(), 100);
        }
    }

    handlePatientMatching() {
        const condition = document.getElementById('patient-condition').value;
        const age = parseInt(document.getElementById('patient-age').value);
        const location = document.getElementById('patient-location').value;
        
        if (!condition || !age || !location) {
            alert('Please fill in all fields');
            return;
        }
        
        // Show loading state
        const resultsDiv = document.getElementById('trial-results');
        const resultsContainer = document.getElementById('results-container');
        
        resultsContainer.innerHTML = '<div class="loading">🔍 Searching for matching trials...</div>';
        resultsDiv.classList.remove('hidden');
        
        // Simulate API call with realistic delay
        setTimeout(() => {
            const matchingTrials = this.findMatchingTrials(condition, age, location);
            this.displayTrialResults(matchingTrials);
        }, 2000);
    }

    findMatchingTrials(condition, age, location) {
        // Filter and score trials
        return this.sampleTrials.filter(trial => {
            const conditionMatch = trial.condition === condition || 
                                   trial.eligibility.conditions.includes(condition);
            const ageMatch = age >= trial.eligibility.ageMin && age <= trial.eligibility.ageMax;
            return conditionMatch && ageMatch;
        }).map(trial => ({
            ...trial,
            matchScore: this.calculateMatchScore(trial, condition, age, location)
        })).sort((a, b) => b.matchScore - a.matchScore);
    }

    calculateMatchScore(trial, condition, age, location) {
        let score = 0;
        
        // Condition match (50 points)
        if (trial.condition === condition || trial.eligibility.conditions.includes(condition)) {
            score += 50;
        }
        
        // Age eligibility (30 points)
        if (age >= trial.eligibility.ageMin && age <= trial.eligibility.ageMax) {
            score += 30;
        }
        
        // Location proximity (20 points)
        if (trial.location.includes('NY') && location.startsWith('1')) {
            score += 20;
        } else if (trial.location.includes('Multiple') || trial.location.includes('US Sites')) {
            score += 15;
        } else {
            score += 10; // Some points for any location
        }
        
        return Math.min(score, 100);
    }

    displayTrialResults(trials) {
        const resultsContainer = document.getElementById('results-container');
        
        if (trials.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No matching trials found. Please try different criteria.</div>';
            return;
        }
        
        resultsContainer.innerHTML = trials.map(trial => `
            <div class="trial-card">
                <div class="trial-header">
                    <h4>${trial.title}</h4>
                    <div class="match-score">Match: ${trial.matchScore}%</div>
                </div>
                <div class="trial-details">
                    <p><strong>NCT ID:</strong> ${trial.nctId}</p>
                    <p><strong>Phase:</strong> ${trial.phase}</p>
                    <p><strong>Status:</strong> ${trial.status}</p>
                    <p><strong>Location:</strong> ${trial.location}</p>
                    <p><strong>Sponsor:</strong> ${trial.sponsor}</p>
                    <p><strong>Enrollment:</strong> ${trial.estimatedEnrollment.toLocaleString()} patients</p>
                    <p><strong>Contact:</strong> ${trial.contact}</p>
                </div>
                <div class="trial-actions">
                    <button class="btn btn--primary" onclick="app.generateReferral('${trial.nctId}')">
                        Generate Referral
                    </button>
                    <button class="btn btn--outline" onclick="app.getPatientEducation('${trial.nctId}')">
                        Patient Info
                    </button>
                    <button class="btn btn--secondary" onclick="app.contactCoordinator('${trial.nctId}')">
                        Contact Team
                    </button>
                </div>
            </div>
        `).join('');
    }

    generateReferral(nctId) {
        const trial = this.sampleTrials.find(t => t.nctId === nctId);
        alert(`📧 Referral Generated!\n\nTrial: ${trial.title}\nNCT ID: ${nctId}\n\n✅ Referral email prepared and sent to study coordinator\n✅ Patient eligibility pre-screening initiated\n✅ Coordinator will contact patient within 24 hours\n\nReferral ID: REF-${Date.now().toString().slice(-6)}`);
    }

    getPatientEducation(nctId) {
        const trial = this.sampleTrials.find(t => t.nctId === nctId);
        alert(`📚 Patient Education Materials Generated\n\nTrial: ${trial.title}\nNCT ID: ${nctId}\n\n✅ Plain-language study overview\n✅ Risks and benefits summary\n✅ Time commitment details\n✅ Contact information sheet\n✅ Frequently asked questions\n\nMaterials sent to patient portal and email.`);
    }

    contactCoordinator(nctId) {
        const trial = this.sampleTrials.find(t => t.nctId === nctId);
        alert(`📞 Connecting with Study Team\n\nTrial: ${trial.title}\nContact: ${trial.contact}\n\n✅ Direct line to study coordinator\n✅ Email contact form sent\n✅ Patient information shared (with consent)\n✅ Follow-up scheduled within 2 business days`);
    }

    initializeEnrollmentChart() {
        const ctx = document.getElementById('enrollmentChart');
        if (ctx && !this.charts.enrollment) {
            this.charts.enrollment = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: 'Monthly Enrollment',
                        data: [12, 19, 15, 25, 22, 30, 28],
                        borderColor: '#008c8a',
                        backgroundColor: 'rgba(0, 140, 138, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
}

// ROI Calculator function (global)
function calculateROI() {
    const investment = parseFloat(document.getElementById('roi-investment').value) || 0;
    const timeSaved = parseFloat(document.getElementById('roi-time-saved').value) || 0;
    
    if (investment === 0 || timeSaved === 0) {
        alert('Please enter valid investment and time saved values');
        return;
    }
    
    // ROI calculation logic
    const timeSavingsValue = timeSaved * 100000; // $100k per month saved
    const riskReduction = 0.15; // 15% risk reduction
    const riskValue = riskReduction * investment * 1000000; // Convert to actual dollars
    const totalBenefit = timeSavingsValue + riskValue;
    
    const roi = ((totalBenefit - (investment * 1000000)) / (investment * 1000000) * 100).toFixed(1);
    const paybackMonths = Math.ceil((investment * 1000000) / (totalBenefit / 12));
    
    // Display results
    document.getElementById('roi-percentage').textContent = roi + '%';
    document.getElementById('roi-payback').textContent = paybackMonths + ' months';
    document.getElementById('roi-results').classList.remove('hidden');
}

// Initialize app
const app = new ClinicalResearchApp();
