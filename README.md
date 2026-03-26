# 📰 AI-Powered Fake News Detection & Credibility Analyzer

An intelligent web application that analyzes news content and determines its authenticity using real-world data sources and AI-based scoring logic.

---

## 🚀 Overview

This system evaluates whether a piece of news is real, fake, or uncertain by combining:

- Verified fact-check data  
- Credible news sources  
- Writing pattern analysis  

Unlike keyword-based systems, this project uses a weighted multi-signal AI decision engine to produce a confidence score (0–99%).

---

## 🧠 Technology Stack

| Layer | Technology |
|------|------------|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js + Express.js |
| Database | MySQL |
| APIs | Google Fact Check Tools API, Google Custom Search API |
| AI Engine | Custom Weighted Scoring Logic |

---

## 🔗 System Workflow

User enters news text  
↓  
Backend receives input  
↓  
API 1 → Google Fact Check API  
API 2 → Google Custom Search API  
↓  
AI Decision Engine processes signals  
↓  
Final result generated  
↓  
Stored in MySQL + shown to user  

---

## ⚙️ APIs Used

### 1. Google Fact Check Tools API
- Searches verified claims database  
- Returns ratings like TRUE, FALSE, MISLEADING  
- Free: 10,000 requests/day  

### 2. Google Custom Search API
- Searches web for related news  
- Returns top results  
- Free: 100 searches/day  

---

## 🤖 AI Decision Engine

| Signal | Weight | Source |
|--------|--------|--------|
| Fact Check Score | 35% | Fact Check API |
| Source Credibility | 40% | Search API |
| Text Analysis | 25% | Custom Logic |

---

### 🧪 Text Analysis Includes

- Word count and structure analysis  
- PTI / ANI / IANS detection (boost)  
- Sensational words detection (penalty)  
- Uppercase ratio check  
- Numerical evidence detection  
- Official statements detection  

---

## 🧮 Final Score Formula

Final Score =  
(FactCheck × 0.35) +  
(Source × 0.40) +  
(Text × 0.25) +  
Consensus Bonus  

---

## 📊 Result Interpretation

| Score Range | Verdict |
|------------|--------|
| 82–99% | VERIFIED REAL |
| 65–81% | LIKELY REAL |
| 45–64% | UNCERTAIN |
| 28–44% | LIKELY FAKE |
| 0–27% | HIGHLY FAKE |

---

## 📌 Output Fields

### 1. AI Verdict  
Final classification of the news  

### 2. Confidence Score  
Overall confidence level based on all signals  

### 3. Fact Check Score  
Based on verified claims  

### 4. Source Credibility Score  
Based on trusted domains  

### 5. Text Analysis Score  
Based on writing style and patterns  

### 6. AI Explanation  
Explains reasoning behind decision  

### 7. Fact Check Results  
Shows verified claims and ratings  

### 8. Related Sources  
Top articles with links and snippets  

### 9. Recent Analyses (History)

- Stores last 10 analyses  
- Data stored in MySQL  
- Older data is محفوظ but not displayed  

---

## 🔍 Why This Is NOT Keyword-Based

| Keyword-Based | Our System |
|--------------|-----------|
| Checks words | Uses scoring logic |
| Binary output | Confidence-based |
| No context | Context-aware |
| Static rules | Dynamic analysis |

---

## 💡 Features

- Real-time fact-check integration  
- Multi-source validation  
- AI-based scoring system  
- MySQL history tracking  
- Human-readable explanations  

---

## 🛠️ Future Improvements

- NLP models (BERT/GPT integration)  
- Multilingual support  
- Real-time news APIs  
- Browser extension  

---

## 📌 Conclusion

This project provides a scalable and intelligent approach to fake news detection using:

- Real-world APIs  
- AI-driven scoring  
- Context-aware analysis  

It delivers a reliable confidence-based decision system beyond basic keyword matching.
