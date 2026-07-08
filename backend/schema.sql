-- Run this script in your Supabase SQL Editor

-- 1. Create Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    skills JSONB,
    education JSONB,
    experience JSONB,
    projects JSONB,
    certifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries by user_id
CREATE INDEX idx_resumes_user_id ON resumes(user_id);

-- 2. Create Interview Reports Table
CREATE TABLE IF NOT EXISTS interview_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    mode TEXT NOT NULL, -- e.g., 'Technical', 'Behavioral'
    overall_score INTEGER NOT NULL,
    technical_score INTEGER,
    communication_score INTEGER,
    confidence_score INTEGER,
    body_language_score INTEGER,
    strengths JSONB,
    weaknesses JSONB,
    improvement_suggestions JSONB,
    history JSONB, -- The raw Q&A history
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries by user_id
CREATE INDEX idx_reports_user_id ON interview_reports(user_id);
