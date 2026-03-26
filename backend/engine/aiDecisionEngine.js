

class AIDecisionEngine {

    constructor() {
        // Weight distribution
        this.weights = {
            factCheck: 0.35,
            sourceSearch: 0.40,
            textAnalysis: 0.25
        };

        // ✅ EXPANDED - Indian + International credible domains
        this.credibleDomains = [
            // Indian National News
            'ndtv.com', 'thehindu.com', 'hindustantimes.com',
            'timesofindia.com', 'indianexpress.com', 'indiatoday.in',
            'news18.com', 'zeenews.india.com', 'firstpost.com',
            'theprint.in', 'thewire.in', 'scroll.in', 'quint.com',
            'thequint.com', 'livemint.com', 'businessstandard.com',
            'economictimes.indiatimes.com', 'moneycontrol.com',
            'financialexpress.com', 'deccanherald.com', 'tribuneindia.com',
            'thestatesman.com', 'telegraphindia.com', 'dnaindia.com',
            'freepressjournal.in', 'newindianexpress.com',
            'asianage.com', 'millenniumpost.com', 'dailypioneer.com',

            // Indian Regional
            'mathrubhumi.com', 'manoramaonline.com', 'dinamalar.com',
            'eenadu.net', 'sakshi.com', 'andhrajyothy.com',
            'lokmat.com', 'loksatta.com', 'maharashtratimes.com',

            // Indian Government & Official
            'pib.gov.in', 'india.gov.in', 'mygov.in',
            'mohfw.gov.in', 'meity.gov.in', 'pmindia.gov.in',

            // Indian Fact Check Sites
            'boomlive.in', 'altnews.in', 'vishvasnews.com',
            'factchecker.in', 'newschecker.in', 'indiacheck.org',
            'factcrescendo.com', 'checkfactuali.com',

            // International Credible
            'bbc.com', 'bbc.co.uk', 'bbc.in',
            'reuters.com', 'apnews.com', 'theguardian.com',
            'nytimes.com', 'washingtonpost.com', 'bloomberg.com',
            'forbes.com', 'aljazeera.com', 'cnn.com',
            'abcnews.go.com', 'nbcnews.com', 'cbsnews.com',
            'usatoday.com', 'npr.org', 'economist.com',
            'ft.com', 'wsj.com', 'time.com', 'snopes.com',
            'factcheck.org', 'politifact.com'
        ];

        // ✅ UPGRADED Linguistic patterns
        this.linguisticPatterns = {
            sensationalism: {
                patterns: [
                    /!!+/g, /\?!\?/g,
                    /BREAKING/gi, /SHOCKING/gi,
                    /EXPOSED/gi, /SECRET/gi,
                    /CONSPIRACY/gi, /HOAX/gi,
                    /UNBELIEVABLE/gi, /BOMBSHELL/gi,
                    /EXPLOSIVE/gi, /VIRAL/gi,
                    /YOU WON'T BELIEVE/gi,
                    /SHARE BEFORE DELETE/gi,
                    /FORWARD THIS/gi
                ],
                weight: -0.12
            },
            credibilityMarkers: {
                patterns: [
                    /according to/gi, /study shows/gi,
                    /researchers/gi, /published in/gi,
                    /official statement/gi, /confirmed/gi,
                    /government/gi, /university/gi,
                    /report says/gi, /data shows/gi,
                    /survey found/gi, /experts say/gi,
                    /ministry/gi, /department/gi,
                    /spokesperson/gi, /press release/gi,
                    /officially/gi, /announced/gi,
                    /prime minister/gi, /president/gi,
                    /supreme court/gi, /high court/gi,
                    /parliament/gi, /lok sabha/gi,
                    /rajya sabha/gi, /cabinet/gi
                ],
                weight: +0.10
            },
            uncertaintyMarkers: {
                patterns: [
                    /allegedly/gi, /rumored/gi,
                    /unconfirmed/gi, /sources say/gi,
                    /claims/gi, /reportedly/gi,
                    /it is said/gi, /some people say/gi,
                    /whatsapp forward/gi
                ],
                weight: -0.06
            },
            numericalEvidence: {
                patterns: [
                    /\d+%/g, /\$\d+/g, /₹\d+/g,
                    /\d+ (million|billion|thousand|lakh|crore)/gi,
                    /\d+\.\d+/g
                ],
                weight: +0.07
            },
            quotations: {
                patterns: [
                    /"[^"]{10,}"/g,
                    /'[^']{10,}'/g
                ],
                weight: +0.06
            },
            indianCredibility: {
                patterns: [
                    /ANI/g, /PTI/g, /IANS/g,
                    /Press Trust of India/gi,
                    /Asian News International/gi,
                    /DD News/gi, /Doordarshan/gi,
                    /All India Radio/gi, /AIR/g,
                    /Election Commission/gi,
                    /Reserve Bank/gi, /RBI/gi,
                    /SEBI/gi, /ISRO/gi, /DRDO/gi,
                    /IIT/gi, /IIM/gi, /AIIMS/gi
                ],
                weight: +0.12
            },
            fakeIndicators: {
                patterns: [
                    /forward this message/gi,
                    /share before it gets deleted/gi,
                    /government is hiding/gi,
                    /they don't want you to know/gi,
                    /wake up people/gi,
                    /this will be removed/gi,
                    /banned news/gi,
                    /suppressed news/gi
                ],
                weight: -0.15
            }
        };
    }

    // ============================================
    // MAIN ANALYSIS FUNCTION
    // ============================================
    async analyze(newsText, factCheckData, searchData) {
        try {
            const textScore = this.analyzeText(newsText);
            const factCheckScore = this.processFactCheck(factCheckData, newsText);
            const sourceScore = this.processSearchResults(searchData, newsText);

            const finalScore = this.calculateFinalScore(
                textScore, factCheckScore, sourceScore
            );

            const decision = this.generateDecision(finalScore);
            const explanation = this.generateExplanation(
                finalScore, textScore, factCheckScore,
                sourceScore, factCheckData, searchData
            );

            return {
                success: true,
                finalScore: Math.round(finalScore * 100),
                decision: decision,
                explanation: explanation,
                breakdown: {
                    textAnalysisScore: Math.round(textScore * 100),
                    factCheckScore: Math.round(factCheckScore * 100),
                    sourceScore: Math.round(sourceScore * 100)
                }
            };

        } catch (error) {
            console.error('AI Engine Error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // TEXT ANALYSIS - UPGRADED
    // ============================================
    analyzeText(text) {
        let score = 0.52; // Slightly above neutral start

        if (!text || text.trim().length === 0) return score;

        const wordCount = text.split(/\s+/).length;

        // Length scoring - more content = more credible
        if (wordCount < 10) score -= 0.20;
        else if (wordCount >= 10 && wordCount <= 20) score -= 0.08;
        else if (wordCount >= 21 && wordCount <= 50) score += 0.05;
        else if (wordCount >= 51 && wordCount <= 150) score += 0.10;
        else if (wordCount >= 151 && wordCount <= 300) score += 0.13;
        else if (wordCount > 300) score += 0.15;

        // Apply linguistic pattern weights
        for (const [category, config] of Object.entries(this.linguisticPatterns)) {
            let matchCount = 0;
            for (const pattern of config.patterns) {
                const matches = text.match(pattern);
                if (matches) matchCount += matches.length;
            }
            if (matchCount > 0) {
                const impact = config.weight * Math.log(matchCount + 1);
                score += impact;
            }
        }

        // Uppercase ratio
        const upperCount = (text.match(/[A-Z]/g) || []).length;
        const totalLetters = (text.match(/[a-zA-Z]/g) || []).length;
        if (totalLetters > 0) {
            const upperRatio = upperCount / totalLetters;
            if (upperRatio > 0.6) score -= 0.18;
            else if (upperRatio > 0.4) score -= 0.10;
            else if (upperRatio < 0.15) score += 0.05;
        }

        // Sentence structure
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const avgSentenceLength = wordCount / (sentences.length || 1);
        if (avgSentenceLength < 5) score -= 0.10;
        else if (avgSentenceLength >= 12 && avgSentenceLength <= 35) score += 0.08;

        // Clamp
        return Math.min(0.97, Math.max(0.05, score));
    }

    // ============================================
    // FACT CHECK PROCESSING - UPGRADED
    // ============================================
    processFactCheck(factCheckData, newsText) {
        if (!factCheckData || !factCheckData.claims ||
            factCheckData.claims.length === 0) {
            // ✅ Instead of penalizing, give neutral-positive score
            // Most real news won't have fact checks
            return 0.55;
        }

        let totalScore = 0;
        let claimCount = 0;
        const newsWords = this.extractKeywords(newsText);

        for (const claim of factCheckData.claims) {
            const claimText = (claim.text || '').toLowerCase();
            const claimWords = this.extractKeywords(claimText);
            const similarity = this.calculateSimilarity(newsWords, claimWords);

            if (similarity > 0.10) {
                if (claim.claimReview && claim.claimReview.length > 0) {
                    for (const review of claim.claimReview) {
                        const rating = (review.textualRating || '').toLowerCase();
                        const ratingScore = this.interpretRating(rating);
                        totalScore += ratingScore * similarity;
                        claimCount++;
                    }
                }
            }
        }

        if (claimCount === 0) return 0.55;

        const avgScore = totalScore / claimCount;
        return Math.min(0.98, Math.max(0.05, avgScore));
    }

    // ============================================
    // INTERPRET RATINGS - UPGRADED
    // ============================================
    interpretRating(rating) {
        // TRUE
        if (/\b(true|correct|accurate|verified|confirmed|fact|right)\b/.test(rating)) {
            return 0.95;
        }
        // MOSTLY TRUE
        if (/\b(mostly true|largely true|mostly correct|half true)\b/.test(rating)) {
            return 0.80;
        }
        // MIXED
        if (/\b(mixed|partially|partly|misleading|disputed)\b/.test(rating)) {
            return 0.45;
        }
        // MOSTLY FALSE
        if (/\b(mostly false|largely false|barely true)\b/.test(rating)) {
            return 0.20;
        }
        // FALSE
        if (/\b(false|incorrect|wrong|fake|hoax|fabricated|debunked|lie)\b/.test(rating)) {
            return 0.05;
        }
        // SATIRE
        if (/\b(satire|parody|fiction|humor|joke)\b/.test(rating)) {
            return 0.10;
        }
        return 0.55;
    }

    // ============================================
    // SEARCH RESULTS - UPGRADED
    // ============================================
    processSearchResults(searchData, newsText) {
        if (!searchData || !searchData.items ||
            searchData.items.length === 0) {
            return 0.45;
        }

        let credibilityScore = 0;
        let totalWeight = 0;
        let credibleSourceCount = 0;
        const newsWords = this.extractKeywords(newsText);

        for (const item of searchData.items) {
            const itemUrl = (item.link || '').toLowerCase();
            const itemTitle = (item.title || '').toLowerCase();
            const itemSnippet = (item.snippet || '').toLowerCase();

            const domainScore = this.scoreDomain(itemUrl);

            // Count highly credible sources
            if (domainScore >= 0.85) credibleSourceCount++;

            const titleWords = this.extractKeywords(itemTitle);
            const snippetWords = this.extractKeywords(itemSnippet);
            const allResultWords = [...titleWords, ...snippetWords];
            const relevance = this.calculateSimilarity(newsWords, allResultWords);

            if (relevance > 0.08) {
                credibilityScore += domainScore * relevance;
                totalWeight += relevance;
            }
        }

        // ✅ Bonus for multiple credible sources
        if (credibleSourceCount >= 3) credibilityScore += 0.15;
        else if (credibleSourceCount >= 2) credibilityScore += 0.10;
        else if (credibleSourceCount >= 1) credibilityScore += 0.05;

        if (totalWeight === 0) return 0.45;

        const finalScore = credibilityScore / totalWeight;
        return Math.min(0.98, Math.max(0.05, finalScore));
    }

    // ============================================
    // DOMAIN SCORING - UPGRADED
    // ============================================
    scoreDomain(url) {
        // Check exact credible domains
        for (const domain of this.credibleDomains) {
            if (url.includes(domain)) return 0.92;
        }

        // Government domains
        if (url.includes('.gov') || url.includes('.gov.in') ||
            url.includes('.nic.in') || url.includes('.edu') ||
            url.includes('.ac.in')) {
            return 0.93;
        }

        // Fact check sites
        if (url.includes('snopes.com') || url.includes('factcheck.org') ||
            url.includes('politifact.com') || url.includes('boomlive.in') ||
            url.includes('altnews.in') || url.includes('vishvasnews.com') ||
            url.includes('factchecker.in') || url.includes('newschecker.in')) {
            return 0.90;
        }

        // General .org
        if (url.includes('.org')) return 0.65;

        // Unknown
        return 0.42;
    }

    // ============================================
    // CALCULATE FINAL SCORE - UPGRADED
    // ============================================
    calculateFinalScore(textScore, factCheckScore, sourceScore) {
        let weighted =
            (factCheckScore * this.weights.factCheck) +
            (sourceScore * this.weights.sourceSearch) +
            (textScore * this.weights.textAnalysis);

        // ✅ Consensus boost - if all signals agree it's real
        const allScores = [textScore, factCheckScore, sourceScore];
        const allHigh = allScores.every(s => s >= 0.65);
        const allLow = allScores.every(s => s <= 0.35);
        const variance = this.calculateVariance(allScores);

        // All signals agree = REAL → boost to near 100
        if (allHigh) weighted += 0.12;

        // All signals agree = FAKE → push lower
        if (allLow) weighted -= 0.12;

        // Low variance = signals agree = more confident
        if (variance < 0.03) weighted += 0.05;
        else if (variance < 0.05) weighted += 0.03;

        // ✅ Strong text score boost
        if (textScore >= 0.80) weighted += 0.08;
        else if (textScore >= 0.70) weighted += 0.04;

        // ✅ Strong source score boost
        if (sourceScore >= 0.85) weighted += 0.08;
        else if (sourceScore >= 0.75) weighted += 0.04;

        return Math.min(0.99, Math.max(0.02, weighted));
    }

    // ============================================
    // GENERATE DECISION - UPGRADED THRESHOLDS
    // ============================================
    generateDecision(score) {
        if (score >= 0.82) return 'VERIFIED REAL';
        if (score >= 0.65) return 'LIKELY REAL';
        if (score >= 0.45) return 'UNCERTAIN';
        if (score >= 0.28) return 'LIKELY FAKE';
        return 'HIGHLY FAKE';
    }

    // ============================================
    // GENERATE EXPLANATION - UPGRADED
    // ============================================
    generateExplanation(finalScore, textScore, factCheckScore,
        sourceScore, factCheckData, searchData) {

        const decision = this.generateDecision(finalScore);
        let explanation = '';

        const openings = {
            'VERIFIED REAL': '✅ Our AI engine has HIGH confidence this news is authentic and credible.',
            'LIKELY REAL': '🟢 Our AI engine indicates this news is likely authentic with good credibility signals.',
            'UNCERTAIN': '🟡 Our AI engine could not confidently verify or deny this news.',
            'LIKELY FAKE': '🟠 Our AI engine detected multiple unreliability signals in this news.',
            'HIGHLY FAKE': '🔴 Our AI engine has HIGH confidence this news contains false or fabricated information.'
        };

        explanation += openings[decision] + ' ';

        // Fact check
        if (factCheckData && factCheckData.claims &&
            factCheckData.claims.length > 0) {
            explanation += `Google Fact Check database found ${factCheckData.claims.length} related verified claim(s) matching this news. `;
        } else {
            explanation += 'No direct fact-check records found — this is normal for most genuine news articles. ';
        }

        // Sources
        if (searchData && searchData.items && searchData.items.length > 0) {
            const credibleCount = searchData.items.filter(item =>
                this.scoreDomain((item.link || '').toLowerCase()) >= 0.85
            ).length;

            if (credibleCount >= 3) {
                explanation += `Found ${credibleCount} highly credible sources reporting on this story — strong credibility signal. `;
            } else if (credibleCount >= 1) {
                explanation += `Found ${credibleCount} credible source(s) covering this topic. `;
            } else {
                explanation += 'No highly credible sources found directly covering this story. ';
            }
        } else {
            explanation += 'No matching sources found in web search results. ';
        }

        // Text analysis
        if (textScore >= 0.75) {
            explanation += 'The writing style is professional, well-structured, and contains strong credibility markers.';
        } else if (textScore >= 0.60) {
            explanation += 'The writing style appears mostly professional with some credibility markers present.';
        } else if (textScore >= 0.45) {
            explanation += 'The writing style is neutral — no strong credibility or fake indicators detected.';
        } else if (textScore >= 0.30) {
            explanation += 'The writing style contains some patterns commonly associated with unreliable content.';
        } else {
            explanation += 'The writing style contains multiple red flags typical of fake or misleading content.';
        }

        return explanation;
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    extractKeywords(text) {
        if (!text) return [];
        const stopWords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does',
            'did', 'will', 'would', 'could', 'should', 'may',
            'might', 'shall', 'can', 'to', 'of', 'in', 'for',
            'on', 'with', 'at', 'by', 'from', 'as', 'into',
            'through', 'during', 'before', 'after', 'above',
            'below', 'between', 'out', 'off', 'over', 'under',
            'and', 'but', 'or', 'nor', 'so', 'yet', 'both',
            'not', 'only', 'own', 'same', 'than', 'too', 'very',
            'just', 'this', 'that', 'it', 'its', 'also', 'said',
            'says', 'say', 'their', 'they', 'them', 'he', 'she',
            'his', 'her', 'our', 'we', 'you', 'your', 'who',
            'which', 'what', 'when', 'where', 'how', 'new', 'one'
        ]);

        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.has(word));
    }

    calculateSimilarity(words1, words2) {
        if (words1.length === 0 || words2.length === 0) return 0;
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        return intersection.size / union.size;
    }

    calculateVariance(scores) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        return scores.reduce((sum, score) =>
            sum + Math.pow(score - mean, 2), 0) / scores.length;
    }
}

module.exports = new AIDecisionEngine();