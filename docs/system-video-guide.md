# SmartCompliance Functionality Analysis and Video Recording Guide

## 1. Objective
This document summarizes the current implemented functionality in SmartCompliance and provides a recording-ready walkthrough script for a product demo video.

## 2. Current Implemented Functionality (Code-Based Analysis)
The application is a multi-tenant compliance workspace with role-based access.

Implemented modules:
- Authentication and tenant provisioning: signup, login, logout, tenant-scoped profile sync.
- Customers: create, list, filter, edit.
- Verifications: create session, upload placeholder document + OCR metadata, watchlist screening, risk decision execution.
- Risk engine: calculates risk score, level, decision (`approved`, `manual_review`, `rejected`) from document/watchlist/rule signals.
- Monitoring: transaction ingestion, suspicious pattern detection, alert generation, alert status updates.
- Cases: create, assign, update status/decision/notes.
- Reports: generate `sar`, `ctr`, `audit_export`, `operations_summary`; export as CSV/PDF.
- Analytics: dashboard aggregates risk/fraud/verification/case metrics.
- Audit logs: transaction, alert, case, and rule/report actions are logged.
- Health check: `/api/health` includes database reachability check when service key is configured.

Access model:
- `admin` and `compliance_officer`: can create/update/manage workflows.
- `developer`: read-only experience in UI (management actions disabled).

## 3. Pre-Recording Setup
1. Ensure env vars are set in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
2. Start the app:
```bash
pnpm dev
```
3. Sign in with an `admin` or `compliance_officer` account.
4. Verify `Settings` page shows:
- Public Supabase env: `Configured`
- Service role key: `Configured`
- Tenant session: `Active`

If env vars are missing, UI opens in preview mode and write actions are disabled.

## 4. Recommended Demo Data (Deterministic Outcomes)
Use these sample customers to keep watchlist outcomes predictable with placeholder logic:

- Customer A (clear screening path):
  - First name: `Avery`
  - Last name: `Stone`
  - Risk level: `low`
  - Screening provider: `ofac_placeholder`
  - Expected screening status: `clear`

- Customer B (high-risk escalation path):
  - First name: `Reese`
  - Last name: `Keller`
  - Risk level: `critical`
  - Screening provider: `ofac_placeholder`
  - Expected screening status: `confirmed_match`

Transaction payload for alert-heavy monitoring demo:
- Customer: `Reese Keller`
- Amount: `15000`
- Currency: `USD`
- Transaction type: `crypto_transfer`
- Counterparty country: `RU`
- Expected: flagged transaction + multiple alerts.

## 5. Suggested Video Flow (10-12 Minutes)

### Segment A: Platform entry and workspace context (1-2 min)
1. Open landing page (`/`) and show value proposition.
2. Go to login, sign in.
3. Show dashboard:
- Risk/fraud/verification/case metrics
- Quick links (`Add customer`, `Start verification`, `Ingest transaction`, `Generate report`)
4. Open Settings and confirm environment/session readiness.

Narration points:
- Multi-tenant architecture.
- Role-aware workspace operations.
- End-to-end compliance lifecycle from onboarding to reporting.

### Segment B: Customer onboarding and verification pipeline (4-5 min)
1. Go to Customers -> Add customer.
2. Create `Avery Stone` (low risk).
3. Create verification session for Avery.
4. Upload document placeholder for the session.
5. Run screening using `ofac_placeholder`.
6. Run decision engine.
7. Return to Verifications list and show:
- Session status and decision.
- Output counters (documents/screenings/risk profile).

Narration points:
- Document step uses OCR placeholder metadata for demo.
- Screening and decisioning are persisted and visible in pipeline table.

### Segment C: Escalation path, monitoring, and case work (3-4 min)
1. Add customer `Reese Keller` with `critical` risk.
2. Create verification session (you may skip document upload for faster escalation).
3. Run screening with `ofac_placeholder` (expected confirmed match).
4. Run decision engine and show review/reject posture.
5. Open Monitoring -> Ingest transaction.
6. Submit the alert-heavy payload (`15000 USD`, `crypto_transfer`, `RU`).
7. Show generated alerts, severities, and flagged transaction state.
8. Optionally update one alert status in Monitoring -> Update alert.
9. Open Cases -> Create case and assign officer; then Cases -> Update case.

Narration points:
- Risk, transaction patterns, and jurisdiction signals combine into operational alerts.
- Case queue captures escalation and reviewer decisions.

### Segment D: Reporting and exports (1-2 min)
1. Go to Reports -> Generate report.
2. Create one `sar` and one `ctr` report job (short lookback like 30 days).
3. In report list, show ready status.
4. Export CSV and PDF from report row buttons.

Narration points:
- Regulatory output is generated from tenant data.
- Export endpoints support integration-ready outputs.

## 6. Optional API Shots (for technical audience)
Use browser/Postman:
- `GET /api/health`
- `GET /api/analytics`
- `GET /api/customers`
- `GET /api/verifications`
- `POST /api/transactions`
- `GET /api/reports`
- `GET /api/reports/{reportId}/export?format=csv`

## 7. Important Caveats to Mention in Video
- Document OCR and watchlist are placeholder providers/logic in current version.
- Rules UI is list-oriented today; rule create/update is available through API endpoints.
- E2E automation tests are not yet implemented (`tests/e2e/README.md`).
- Current typecheck reports existing issues unrelated to this video guide:
  - `.next/types/validator.ts`: route typing mismatch for `/rules/[ruleId]/edit`
  - `modules/rules/validation.ts`: `z.number(...)` schema typing issue

## 8. Quick Recording Checklist
- Logged in as `admin` or `compliance_officer`.
- Settings page shows all checks green.
- At least two customers created (one low risk, one critical).
- One full verification flow completed.
- One monitoring alert scenario demonstrated.
- One case created/updated.
- One report generated and exported (CSV/PDF).

