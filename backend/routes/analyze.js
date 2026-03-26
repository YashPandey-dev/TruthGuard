const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/db');
const aiEngine = require('../engine/aiDecisionEngine');

// ============================================
// GOOGLE FACT CHECK API
// ============================================
async function fetchFactCheck(query) {
    try {
        const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
        if (!apiKey || apiKey === 'your_google_api_key_here') {
            console.log('⚠️ Fact Check API key not configured');
            return { claims: [] };
        }

        const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search`;
        const response = await axios.get(url, {
            params: {
                query: query.substring(0, 200),
                key: apiKey,
                languageCode: 'en'
            },
            timeout: 8000
        });

        return response.data || { claims: [] };

    } catch (error) {
        console.error('❌ Fact Check API Error:', error.message);
        return { claims: [] };
    }
}

// ============================================
// GOOGLE CUSTOM SEARCH API
// ============================================
async function fetchSearchResults(query) {
    try {
        const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
        const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

        if (!apiKey || apiKey === 'your_google_api_key_here') {
            console.log('⚠️ Search API key not configured');
            return { items: [] };
        }

        const url = `https://www.googleapis.com/customsearch/v1`;
        const response = await axios.get(url, {
            params: {
                q: query.substring(0, 200),
                key: apiKey,
                cx: searchEngineId,
                num: 10,
                dateRestrict: 'm6'
            },
            timeout: 8000
        });

        return response.data || { items: [] };

    } catch (error) {
        console.error('❌ Search API Error:', error.message);
        return { items: [] };
    }
}

// ============================================
// SAVE RESULT TO DATABASE
// ============================================
async function saveToDatabase(newsText, aiScore, factCheckResult,
    finalDecision, confidenceScore, explanation) {
    try {
        const query = `
            INSERT INTO analysis_results 
            (news_text, ai_score, fact_check_result, 
             source_match_score, final_decision, 
             confidence_score, explanation, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const values = [
            newsText.substring(0, 5000),
            aiScore,
            factCheckResult,
            aiScore,
            finalDecision,
            confidenceScore,
            explanation
        ];

        const [result] = await db.execute(query, values);
        return result.insertId;

    } catch (error) {
        console.error('❌ Database Save Error:', error.message);
        return null;
    }
}

// ============================================
// MAIN ANALYZE ROUTE
// POST /api/analyze
// ============================================
router.post('/analyze', async (req, res) => {
    try {
        const { newsText } = req.body;

        // Input validation
        if (!newsText || newsText.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide news text to analyze'
            });
        }

        if (newsText.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'News text is too short. Please provide more content.'
            });
        }

        if (newsText.trim().length > 10000) {
            return res.status(400).json({
                success: false,
                message: 'News text is too long. Please limit to 10,000 characters.'
            });
        }

        console.log('\n========================================');
        console.log('📰 New Analysis Request');
        console.log(`📝 Text Length: ${newsText.length} characters`);
        console.log('========================================');

        // Step 1: Fetch data from both APIs simultaneously
        console.log('🔍 Fetching Fact Check & Search data...');
        const [factCheckData, searchData] = await Promise.all([
            fetchFactCheck(newsText),
            fetchSearchResults(newsText)
        ]);

        console.log(`✅ Fact Check Claims: ${factCheckData?.claims?.length || 0}`);
        console.log(`✅ Search Results: ${searchData?.items?.length || 0}`);

        // Step 2: Run AI Decision Engine
        console.log('🧠 Running AI Decision Engine...');
        const aiResult = await aiEngine.analyze(
            newsText,
            factCheckData,
            searchData
        );

        if (!aiResult.success) {
            throw new Error('AI Engine failed: ' + aiResult.error);
        }

        console.log(`🎯 Decision: ${aiResult.decision}`);
        console.log(`📊 Confidence: ${aiResult.finalScore}%`);

        // Step 3: Prepare fact check summary
        let factCheckSummary = 'No fact-check records found';
        if (factCheckData.claims && factCheckData.claims.length > 0) {
            const firstClaim = factCheckData.claims[0];
            if (firstClaim.claimReview && firstClaim.claimReview.length > 0) {
                factCheckSummary = firstClaim.claimReview[0].textualRating ||
                    'Claim found but no rating available';
            }
        }

        // Step 4: Save to database
        const recordId = await saveToDatabase(
            newsText,
            aiResult.breakdown.textAnalysisScore / 100,
            factCheckSummary,
            aiResult.decision,
            aiResult.finalScore / 100,
            aiResult.explanation
        );

        // Step 5: Prepare search sources for response
        let topSources = [];
        if (searchData.items && searchData.items.length > 0) {
            topSources = searchData.items.slice(0, 5).map(item => ({
                title: item.title || 'Unknown',
                link: item.link || '#',
                snippet: item.snippet || ''
            }));
        }

        // Step 6: Send response
        return res.status(200).json({
            success: true,
            recordId: recordId,
            result: {
                decision: aiResult.decision,
                confidenceScore: aiResult.finalScore,
                explanation: aiResult.explanation,
                breakdown: {
                    textAnalysis: aiResult.breakdown.textAnalysisScore,
                    factCheck: aiResult.breakdown.factCheckScore,
                    sourceCredibility: aiResult.breakdown.sourceScore
                },
                factCheck: {
                    claimsFound: factCheckData?.claims?.length || 0,
                    summary: factCheckSummary
                },
                sources: topSources
            }
        });

    } catch (error) {
        console.error('❌ Analysis Route Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Analysis failed. Please try again.',
            error: error.message
        });
    }
});

// ============================================
// GET HISTORY ROUTE
// GET /api/history
// ============================================
router.get('/history', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, LEFT(news_text, 100) as news_preview,
             final_decision, confidence_score, timestamp
             FROM analysis_results
             ORDER BY timestamp DESC
             LIMIT 10`
        );

        return res.status(200).json({
            success: true,
            history: rows
        });

    } catch (error) {
        console.error('❌ History Route Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch history'
        });
    }
});

module.exports = router;