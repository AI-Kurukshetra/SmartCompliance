# SmartCompliance Architecture Summary

## System Shape

SmartCompliance is an API-first, multi-tenant compliance platform with a Next.js App Router frontend, Supabase-backed data and authentication, and modular feature boundaries aligned to operational domains.

Primary flow:

1. Tenant users access the dashboard or API.
2. Next.js route handlers and server components orchestrate platform logic.
3. Supabase Auth manages identity and session state.
4. Postgres stores tenant-scoped operational data behind RLS.
5. External providers will plug into verification, OCR, and watchlist services in later phases.

## Core Domains

- `customers`: customer lifecycle and profile management
- `verifications`: onboarding sessions and decision state
- `documents`: uploaded evidence and OCR payloads
- `watchlist`: sanctions and PEP screening results
- `risk`: scoring, thresholds, and profile updates
- `cases`: manual review workflow
- `rules`: configurable scoring and approval logic
- `audit`: immutable operational trace
- `analytics`: platform and compliance reporting

## Delivery Decisions

- Use route groups: `(auth)` and `(dashboard)` keep public and protected shells separate.
- Keep shared code outside `app/` in `components`, `lib`, `modules`, and `services`.
- Model tenancy explicitly with a `tenants` table and `tenant_id` on every operational table.
- Use Supabase Auth plus a public `users` profile table to map auth identities to tenant roles.
- Enable RLS across all public tables from the first migration.

