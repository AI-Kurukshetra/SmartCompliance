# SmartCompliance

SmartCompliance is a multi-tenant KYC, AML, and identity verification SaaS platform built with Next.js and Supabase.

## Implemented Scope

- Architecture and task baseline in [`docs`](./docs)
- Tenant-aware Supabase migrations in [`supabase/migrations`](./supabase/migrations)
- Supabase auth (workspace signup/login/logout) with SSR session protection
- Customer management workspace and API
- Verification sessions, document OCR placeholders, watchlist screening, and decision engine
- Case management queue with assignment and decision workflow
- Transaction ingestion + suspicious pattern detection with alert lifecycle
- Regulatory reporting (SAR/CTR/audit/operations summary) with CSV/PDF exports
- Tenant analytics dashboard (risk/fraud/verification/case metrics)
- Hardening updates: audit logging integration, health checks, and additional indexes

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase URL, anon or publishable key, and `SUPABASE_SERVICE_ROLE_KEY`.
3. Install dependencies with `pnpm install`.
4. Run the app with `pnpm dev`.

## Folder Structure

The working project structure is documented in [`docs/architecture.md`](./docs/architecture.md).
