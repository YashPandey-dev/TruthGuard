-- Create Database
CREATE DATABASE IF NOT EXISTS fakenews_db;

-- Use the Database
USE fakenews_db;

-- Create Table
CREATE TABLE IF NOT EXISTS analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    news_text TEXT NOT NULL,
    ai_score FLOAT DEFAULT 0,
    fact_check_result VARCHAR(255) DEFAULT 'No fact check found',
    source_match_score FLOAT DEFAULT 0,
    final_decision VARCHAR(50) NOT NULL,
    confidence_score FLOAT NOT NULL,
    explanation TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
