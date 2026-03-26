// ============================================
// TRUTHGUARD AI - FRONTEND LOGIC
// ============================================

const API_BASE = 'http://localhost:3000/api';

// ============================================
// CHARACTER COUNTER
// ============================================
document.getElementById('newsInput').addEventListener('input', function () {
    const count = this.value.length;
    const counter = document.getElementById('charCounter');
    counter.textContent = `${count.toLocaleString()} / 10,000`;
    if (count > 8000) {
        counter.style.color = '#dc2626';
    } else if (count > 5000) {
        counter.style.color = '#d97706';
    } else {
        counter.style.color = '#94a3b8';
    }
});

// ============================================
// CLEAR INPUT
// ============================================
function clearInput() {
    document.getElementById('newsInput').value = '';
    document.getElementById('charCounter').textContent = '0 / 10,000';
    document.getElementById('charCounter').style.color = '#94a3b8';
    hideResults();
}

// ============================================
// ANALYZE NEWS - MAIN FUNCTION
// ============================================
async function analyzeNews() {
    const newsText = document.getElementById('newsInput').value.trim();

    // Validation
    if (!newsText) {
        showAlert('Please enter a news article to analyze.', 'warning');
        return;
    }

    if (newsText.length < 10) {
        showAlert('Please enter more text for accurate analysis.', 'warning');
        return;
    }

    // Show loading
    showLoading();
    animateLoadingSteps();

    try {
        const response = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newsText })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Analysis failed');
        }

        // Hide loading and show results
        hideLoading();
        displayResults(data.result);
        loadHistory();

    } catch (error) {
        hideLoading();
        showAlert('Analysis failed: ' + error.message, 'error');
        console.error('Analysis Error:', error);
    }
}

// ============================================
// DISPLAY RESULTS
// ============================================
function displayResults(result) {
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'flex';
    resultSection.style.flexDirection = 'column';
    resultSection.style.gap = '20px';

    // Scroll to results
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Set verdict
    setVerdict(result.decision, result.confidenceScore);

    // Set breakdown scores
    setBreakdown(result.breakdown);

    // Set explanation
    document.getElementById('explanationText').textContent = result.explanation;

    // Set fact check results
    setFactCheck(result.factCheck);

    // Set sources
    setSources(result.sources);
}

// ============================================
// SET VERDICT CARD
// ============================================
function setVerdict(decision, confidenceScore) {
    const verdictCard = document.getElementById('verdictCard');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictDecision = document.getElementById('verdictDecision');
    const verdictSubtitle = document.getElementById('verdictSubtitle');
    const progressRing = document.getElementById('progressRing');
    const confidenceNumber = document.getElementById('confidenceNumber');

    // Remove all previous classes
    const classes = ['verified-real', 'likely-real',
        'uncertain', 'likely-fake', 'highly-fake'];
    verdictCard.classList.remove(...classes);
    verdictIcon.classList.remove(...classes);
    verdictDecision.classList.remove(...classes);

    // Map decision to class and details
    const decisionMap = {
        'VERIFIED REAL': {
            class: 'verified-real',
            icon: 'fas fa-check-circle',
            subtitle: 'This news appears to be authentic and verified.',
            ringColor: '#059669'
        },
        'LIKELY REAL': {
            class: 'likely-real',
            icon: 'fas fa-thumbs-up',
            subtitle: 'This news is likely authentic with good credibility.',
            ringColor: '#10b981'
        },
        'UNCERTAIN': {
            class: 'uncertain',
            icon: 'fas fa-question-circle',
            subtitle: 'Could not confidently verify or deny this news.',
            ringColor: '#6b7280'
        },
        'LIKELY FAKE': {
            class: 'likely-fake',
            icon: 'fas fa-exclamation-triangle',
            subtitle: 'This news shows signs of being unreliable.',
            ringColor: '#d97706'
        },
        'HIGHLY FAKE': {
            class: 'highly-fake',
            icon: 'fas fa-times-circle',
            subtitle: 'Strong indicators suggest this news is fabricated.',
            ringColor: '#dc2626'
        }
    };

    const config = decisionMap[decision] || decisionMap['UNCERTAIN'];

    // Apply classes
    verdictCard.classList.add(config.class);
    verdictIcon.classList.add(config.class);
    verdictDecision.classList.add(config.class);

    // Set icon
    verdictIcon.innerHTML = `<i class="${config.icon}"></i>`;

    // Set text
    verdictDecision.textContent = decision;
    verdictSubtitle.textContent = config.subtitle;

    // Animate circular progress
    const circumference = 314;
    const offset = circumference - (confidenceScore / 100) * circumference;
    progressRing.style.stroke = config.ringColor;

    setTimeout(() => {
        progressRing.style.strokeDashoffset = offset;
    }, 300);

    // Animate confidence number
    animateNumber(confidenceNumber, 0, confidenceScore, 1500, '%');
}

// ============================================
// SET BREAKDOWN SCORES
// ============================================
function setBreakdown(breakdown) {
    const scores = {
        factCheck: breakdown.factCheck,
        source: breakdown.sourceCredibility,
        text: breakdown.textAnalysis
    };

    // Fact Check
    document.getElementById('factCheckScore').textContent = scores.factCheck + '%';
    setTimeout(() => {
        document.getElementById('factCheckBar').style.width = scores.factCheck + '%';
    }, 400);

    // Source
    document.getElementById('sourceScore').textContent = scores.source + '%';
    setTimeout(() => {
        document.getElementById('sourceBar').style.width = scores.source + '%';
    }, 600);

    // Text
    document.getElementById('textScore').textContent = scores.text + '%';
    setTimeout(() => {
        document.getElementById('textBar').style.width = scores.text + '%';
    }, 800);
}

// ============================================
// SET FACT CHECK RESULTS
// ============================================
function setFactCheck(factCheck) {
    const factCheckContent = document.getElementById('factCheckContent');

    if (!factCheck || factCheck.claimsFound === 0) {
        factCheckContent.innerHTML = `
            <div class="fact-item">
                <div class="fact-claim">
                    <i class="fas fa-info-circle" 
                       style="color:#94a3b8; margin-right:6px;"></i>
                    No matching fact-check records found in Google's database.
                </div>
                <span class="fact-rating unknown">
                    <i class="fas fa-question"></i> Unverified
                </span>
            </div>
        `;
        return;
    }

    const rating = factCheck.summary || 'Unknown';
    const ratingClass = getRatingClass(rating);
    const ratingIcon = getRatingIcon(rating);

    factCheckContent.innerHTML = `
        <div class="fact-item">
            <div class="fact-claim">
                <i class="fas fa-search" 
                   style="color:#2563eb; margin-right:6px;"></i>
                Google Fact Check found 
                <strong>${factCheck.claimsFound}</strong> 
                related verified claim(s) in their database.
            </div>
            <span class="fact-rating ${ratingClass}" style="margin-top:8px;">
                <i class="${ratingIcon}"></i> ${rating}
            </span>
            <div class="fact-publisher">
                <i class="fas fa-database" style="margin-right:4px;"></i>
                Source: Google Fact Check Tools API
            </div>
        </div>
    `;
}

// ============================================
// SET SOURCES
// ============================================
function setSources(sources) {
    const sourcesCard = document.getElementById('sourcesCard');
    const sourcesList = document.getElementById('sourcesList');

    if (!sources || sources.length === 0) {
        sourcesCard.style.display = 'none';
        return;
    }

    sourcesCard.style.display = 'block';
    sourcesList.innerHTML = '';

    sources.forEach(source => {
        const domain = getDomain(source.link);
        const sourceItem = document.createElement('a');
        sourceItem.href = source.link;
        sourceItem.target = '_blank';
        sourceItem.rel = 'noopener noreferrer';
        sourceItem.className = 'source-item';

        sourceItem.innerHTML = `
            <div class="source-favicon">
                <i class="fas fa-globe"></i>
            </div>
            <div class="source-info">
                <h5>${escapeHtml(source.title)}</h5>
                <p>${escapeHtml(domain)} • 
                   ${escapeHtml(source.snippet.substring(0, 80))}...</p>
            </div>
            <div class="source-link">
                <i class="fas fa-external-link-alt"></i>
            </div>
        `;

        sourcesList.appendChild(sourceItem);
    });
}

// ============================================
// LOADING ANIMATION
// ============================================
function showLoading() {
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('analyzeBtn').disabled = true;

    // Reset steps
    const steps = ['step1', 'step2', 'step3'];
    steps.forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove('done');
        el.classList.add('inactive');
    });

    document.getElementById('step1').classList.remove('inactive');

    setTimeout(() => {
        document.getElementById('loadingSection').scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }, 100);
}

function hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('analyzeBtn').disabled = false;
}

function animateLoadingSteps() {
    const stepMessages = [
        {
            id: 'step1',
            title: 'Connecting to Fact Check Database...',
            subtitle: 'Searching Google verified claims'
        },
        {
            id: 'step2',
            title: 'Analyzing news sources...',
            subtitle: 'Cross-referencing credible websites'
        },
        {
            id: 'step3',
            title: 'Running AI Decision Engine...',
            subtitle: 'Calculating credibility score'
        }
    ];

    stepMessages.forEach((step, index) => {
        setTimeout(() => {
            // Mark previous as done
            if (index > 0) {
                const prevStep = document.getElementById(stepMessages[index - 1].id);
                prevStep.classList.remove('inactive');
                prevStep.classList.add('done');
                prevStep.querySelector('i').className = 'fas fa-check-circle';
            }

            // Activate current
            const currentStep = document.getElementById(step.id);
            currentStep.classList.remove('inactive');
            currentStep.querySelector('i').className = 'fas fa-circle-notch fa-spin';

            // Update title
            document.getElementById('loadingTitle').textContent = step.title;
            document.getElementById('loadingSubtitle').textContent = step.subtitle;

        }, index * 2000);
    });
}

// ============================================
// HIDE RESULTS
// ============================================
function hideResults() {
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'none';

    // Reset progress bars
    document.getElementById('factCheckBar').style.width = '0%';
    document.getElementById('sourceBar').style.width = '0%';
    document.getElementById('textBar').style.width = '0%';

    // Reset ring
    document.getElementById('progressRing').style.strokeDashoffset = '314';
    document.getElementById('confidenceNumber').textContent = '0%';
}

// ============================================
// ANALYZE AGAIN
// ============================================
function analyzeAgain() {
    clearInput();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        document.getElementById('newsInput').focus();
    }, 500);
}

// ============================================
// LOAD HISTORY
// ============================================
async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/history`);
        const data = await response.json();

        if (!data.success) return;

        const historyList = document.getElementById('historyList');

        if (!data.history || data.history.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-inbox"></i>
                    <p>No analyses yet. Start by entering a news article above.</p>
                </div>
            `;
            return;
        }

        historyList.innerHTML = '';

        data.history.forEach(item => {
            const badgeClass = getBadgeClass(item.final_decision);
            const timeAgo = getTimeAgo(item.timestamp);
            const confidence = Math.round(item.confidence_score * 100);

            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-badge ${badgeClass}">
                    ${item.final_decision}
                </span>
                <span class="history-text">
                    ${escapeHtml(item.news_preview)}...
                </span>
                <span class="history-time">
                    ${confidence}% • ${timeAgo}
                </span>
            `;

            historyList.appendChild(historyItem);
        });

    } catch (error) {
        console.error('History load error:', error);
    }
}

// ============================================
// SHOW ALERT
// ============================================
function showAlert(message, type) {
    // Remove existing alerts
    const existing = document.querySelector('.alert-toast');
    if (existing) existing.remove();

    const colors = {
        warning: { bg: '#fef3c7', border: '#d97706', text: '#92400e', icon: 'fas fa-exclamation-triangle' },
        error: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b', icon: 'fas fa-times-circle' },
        success: { bg: '#d1fae5', border: '#059669', text: '#065f46', icon: 'fas fa-check-circle' }
    };

    const config = colors[type] || colors.warning;

    const alert = document.createElement('div');
    alert.className = 'alert-toast';
    alert.style.cssText = `
        position: fixed;
        top: 80px;
        right: 24px;
        z-index: 1000;
        background: ${config.bg};
        border: 1px solid ${config.border};
        border-radius: 12px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 500;
        color: ${config.text};
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        max-width: 380px;
        animation: slideIn 0.3s ease;
    `;

    alert.innerHTML = `
        <i class="${config.icon}"></i>
        <span>${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()" 
            style="margin-left:8px; background:none; border:none; 
                   cursor:pointer; color:${config.text}; font-size:16px;">
            ×
        </button>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(alert);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }
    }, 4000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function animateNumber(element, start, end, duration, suffix = '') {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);
        element.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function getRatingClass(rating) {
    const r = rating.toLowerCase();
    if (r.includes('true') || r.includes('correct') ||
        r.includes('accurate')) return 'true';
    if (r.includes('false') || r.includes('fake') ||
        r.includes('incorrect')) return 'false';
    if (r.includes('mixed') || r.includes('partial') ||
        r.includes('misleading')) return 'mixed';
    return 'unknown';
}

function getRatingIcon(rating) {
    const r = rating.toLowerCase();
    if (r.includes('true') || r.includes('correct')) return 'fas fa-check';
    if (r.includes('false') || r.includes('fake')) return 'fas fa-times';
    if (r.includes('mixed') || r.includes('partial')) return 'fas fa-minus';
    return 'fas fa-question';
}

function getBadgeClass(decision) {
    const map = {
        'VERIFIED REAL': 'badge-verified-real',
        'LIKELY REAL': 'badge-likely-real',
        'UNCERTAIN': 'badge-uncertain',
        'LIKELY FAKE': 'badge-likely-fake',
        'HIGHLY FAKE': 'badge-highly-fake'
    };
    return map[decision] || 'badge-uncertain';
}

function getDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

// ============================================
// KEYBOARD SHORTCUT - CTRL+ENTER TO ANALYZE
// ============================================
document.getElementById('newsInput').addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'Enter') {
        analyzeNews();
    }
});

// ============================================
// LOAD HISTORY ON PAGE LOAD
// ============================================
window.addEventListener('load', () => {
    loadHistory();
    console.log('✅ TruthGuard AI Frontend Loaded');
    console.log('📌 Press Ctrl+Enter to analyze quickly');
});