You are a senior staff software engineer building a production-ready fintech compliance platform.

You are working inside a repository containing:

/docs/prd.md
/docs/architecture.md
/agents/AGENTS.md

Your job is to build the SmartCompliance Suite described in the PRD.

Tech Stack:

Frontend
Next.js (App Router)
TypeScript
TailwindCSS
shadcn/ui

Backend
Supabase
PostgreSQL
Supabase Auth
Supabase Storage
Supabase Edge Functions

Infrastructure
Vercel deployment

System must be:

• scalable
• modular
• multi-tenant
• secure
• API-first

---

STEP 1
Read `/docs/prd.md` and understand the system.

Extract:

product modules
database entities
API requirements
security requirements

---

STEP 2
Design project architecture.

Create folder structure for a scalable SaaS platform.

Example structure:

/app
/components
/modules
/lib
/services
/hooks
/types
/utils

Modules:

customers
verifications
documents
risk
watchlist
cases
rules
audit
analytics

---

STEP 3
Create database schema using Supabase migrations.

Tables:

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
transactions
reports

Implement:

indexes
foreign keys
timestamps
soft deletes

Enable Row Level Security.

---

STEP 4
Implement authentication using Supabase Auth.

Roles:

admin
compliance_officer
developer

---

STEP 5
Implement core modules.

Customers
create / update / search customers

Verification
document upload
verification pipeline

Decision Engine
risk scoring
rule evaluation

Watchlist Screening
sanctions check

Case Management
manual review workflow

Audit Logs
immutable compliance logs

---

STEP 6
Create REST APIs.

Endpoints:

/api/customers
/api/verifications
/api/documents
/api/watchlist
/api/risk
/api/cases
/api/rules
/api/reports

Implement validation and error handling.

---

STEP 7
Build SaaS dashboard UI.

Pages:

Dashboard
Customers
Verifications
Cases
Rules
Reports
Settings

---

STEP 8
Implement analytics dashboards.

Metrics:

verification success rate
fraud detection rate
risk distribution

---

STEP 9
Prepare deployment.

Environment variables:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

Deploy to Vercel.

---

Start by generating:

1. architecture summary
2. project folder structure
3. database schema
