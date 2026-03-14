-- SmartCompliance Database Schema
-- PostgreSQL / Supabase Compatible

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- USERS
-- =========================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    tenant_id UUID,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- CUSTOMERS
-- =========================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    country TEXT,
    email TEXT,
    phone TEXT,
    risk_level TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- VERIFICATION SESSIONS
-- =========================

CREATE TABLE verification_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    status TEXT,
    risk_score NUMERIC,
    decision TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- DOCUMENTS
-- =========================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES verification_sessions(id),
    document_type TEXT,
    file_url TEXT,
    ocr_data JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- WATCHLIST RESULTS
-- =========================

CREATE TABLE watchlist_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES verification_sessions(id),
    provider TEXT,
    match_score NUMERIC,
    match_details JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- RISK PROFILES
-- =========================

CREATE TABLE risk_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    risk_score NUMERIC,
    risk_level TEXT,
    factors JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- CASES
-- =========================

CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    verification_id UUID REFERENCES verification_sessions(id),
    assigned_to UUID,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- RULE ENGINE
-- =========================

CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    condition JSONB,
    score INTEGER,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- TRANSACTIONS
-- =========================

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    amount NUMERIC,
    currency TEXT,
    transaction_type TEXT,
    status TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- ALERTS
-- =========================

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    alert_type TEXT,
    severity TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- AUDIT LOGS
-- =========================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity TEXT,
    entity_id UUID,
    action TEXT,
    performed_by UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- REPORTS
-- =========================

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type TEXT,
    generated_by UUID,
    report_data JSONB,
    created_at TIMESTAMP DEFAULT now()
);