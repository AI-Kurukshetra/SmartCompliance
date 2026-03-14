# System Architecture

## Product

SmartCompliance — Identity Verification & Compliance Decision Platform

## Architecture Goals

The system must be:

• Scalable
• Secure
• API-first
• Multi-tenant ready
• Cloud-native
• Modular

Primary goal is to build a **modern compliance infrastructure platform** similar to Alloy that fintech companies can integrate with easily.

---

# High Level Architecture

Client → Next.js App → API Layer → Supabase Services → External Providers

```
Users
   ↓
Next.js Frontend (Vercel)
   ↓
Next.js API / Edge Functions
   ↓
Supabase Platform
   ├── PostgreSQL
   ├── Auth
   ├── Storage
   └── Edge Functions
   ↓
External Services
   ├── Watchlist Providers
   ├── Identity Verification APIs
   └── OCR Services
```

---

# Technology Stack

## Frontend

Framework
Next.js (App Router)

Language
TypeScript

UI
TailwindCSS
shadcn/ui

State Management
React Server Components + minimal client state

Deployment
Vercel

---

## Backend

Backend platform
Supabase

Components

• PostgreSQL database
• Supabase Auth
• Supabase Storage
• Supabase Edge Functions

---

## Infrastructure

Hosting
Vercel

Database
Supabase Postgres

Storage
Supabase Storage

CDN
Vercel Edge Network

---

# Core System Modules

The system should follow **modular domain architecture**.

```
modules
 ├── auth
 ├── customers
 ├── verifications
 ├── documents
 ├── watchlist
 ├── risk
 ├── cases
 ├── transactions
 ├── reports
 ├── rules
 ├── audit
 └── analytics
```

Each module contains:

```
module
 ├── api
 ├── services
 ├── repository
 ├── types
 └── components
```

---

# Frontend Architecture

Next.js uses **App Router structure**.

```
app
 ├── (dashboard)
 │   ├── customers
 │   ├── verifications
 │   ├── cases
 │   ├── monitoring
 │   ├── rules
 │   └── reports
 │
 ├── login
 ├── signup
 └── settings
```

Shared components:

```
components
 ├── layout
 ├── navigation
 ├── tables
 ├── forms
 ├── modals
 └── charts
```

Guidelines

• Prefer server components
• Use client components only when needed
• Use API routes for backend orchestration

---

# Backend Architecture

Backend uses **API routes + Supabase services**.

```
app/api
 ├── customers
 ├── verifications
 ├── documents
 ├── risk
 ├── cases
 ├── rules
 ├── audit
 └── analytics
```

Responsibilities

• request validation
• business logic orchestration
• security checks
• API response formatting

---

# Database Architecture

Primary database: PostgreSQL (Supabase)

## Core Entities

users
customers
verification_sessions
documents
risk_profiles
watchlist_results
cases
rules
audit_logs
alerts

---

## Entity Relationships

Customer → VerificationSessions
VerificationSessions → Documents
VerificationSessions → RiskProfiles
VerificationSessions → WatchlistResults
VerificationSessions → Cases

Cases → AuditLogs

Rules → RiskProfiles

---

## Example Tables

### customers

```
id
first_name
last_name
date_of_birth
country
created_at
updated_at
```

### verification_sessions

```
id
customer_id
status
risk_score
decision
created_at
```

### documents

```
id
verification_id
document_type
file_url
ocr_data
created_at
```

---

# Multi-Tenant Strategy

The platform must support **multiple fintech clients**.

Tenant isolation implemented using:

```
tenant_id
```

All tables include:

```
tenant_id
```

Row Level Security (RLS) ensures tenant isolation.

Example

```
customer.tenant_id = auth.tenant_id
```

---

# Authentication Architecture

Authentication handled by **Supabase Auth**.

Supported methods

• email/password
• OAuth providers
• enterprise SSO (future)

Roles

```
admin
compliance_officer
developer
```

Authorization enforced using:

• JWT tokens
• Row Level Security
• role checks in API layer

---

# File Storage Architecture

Documents stored in:

Supabase Storage

Buckets

```
identity-documents
customer-selfies
compliance-files
```

Security

• private buckets
• signed URLs for access
• encrypted storage

---

# Decision Engine Architecture

Risk scoring is executed during verification.

Pipeline

```
verification started
      ↓
document analysis
      ↓
watchlist screening
      ↓
rule engine
      ↓
risk score
      ↓
decision

approve
reject
manual review
```

Rules stored in database and evaluated dynamically.

Example rule

```
IF country IN high_risk_countries
AND document_confidence < 80
THEN risk_score += 40
```

---

# Case Management System

When risk exceeds threshold:

Case created.

Workflow

```
Verification flagged
      ↓
Case created
      ↓
Compliance officer review
      ↓
Approve / Reject / Request documents
```

Case history stored in audit logs.

---

# API Design

API structure:

```
/api/auth
/api/customers
/api/verifications
/api/documents
/api/risk
/api/cases
/api/rules
/api/audit
/api/analytics
```

All APIs must include

• authentication
• input validation
• error handling

---

# Security Architecture

Mandatory protections:

• HTTPS everywhere
• JWT authentication
• Row Level Security
• audit logging
• encrypted document storage

Compliance considerations

• GDPR
• data retention policies
• auditability

---

# Observability

Monitoring metrics:

• verification success rate
• fraud detection rate
• API latency
• error rate
• system uptime

Logging stored in:

```
audit_logs
system_logs
```

---

# Performance Strategy

To support high traffic:

• use server components
• minimize client-side state
• index frequently queried fields
• use CDN caching for static assets

Target metrics

```
API latency < 200ms
Verification pipeline < 10 seconds
```

---

# Deployment Architecture

Deployment platform

Vercel

Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

Deployment pipeline

```
GitHub
   ↓
Vercel CI/CD
   ↓
Production deployment
```

---

# Scalability Strategy

System must scale horizontally.

Scaling layers

Frontend
Vercel edge scaling

Backend
Supabase managed infrastructure

Database
Postgres read replicas (future)

---

# Future Architecture Extensions

Potential upgrades

• ML fraud detection models
• Graph database for network analysis
• event-driven architecture
• streaming transaction monitoring

---

# Development Principles

Follow these principles:

• modular architecture
• strongly typed code
• reusable components
• API-first design
• automated testing
• secure by default

---

End of Architecture Document
