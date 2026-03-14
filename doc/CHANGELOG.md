# CHANGELOG

## 2026-03-14

- Added the initial SmartCompliance Next.js 15 scaffold with App Router, dashboard shell, and auth shell.
- Added repository management docs under `doc/`.
- Added Supabase environment helpers and SSR client utilities.
- Added `supabase/migrations/20260314110000_initial_schema.sql` with tenant-aware tables, enums, triggers, indexes, and baseline RLS.
- Added real Supabase email/password authentication with workspace signup, login, logout, and protected dashboard routing.
- Added `supabase/migrations/20260314124500_auth_profile_sync.sql` to sync `auth.users` metadata into `public.users`.
- Added tenant-scoped customer repository, `/api/customers` list/create handlers, and a working customer management dashboard with search and filters.
- Added verification module repository + validation, `/api/verifications` and `/api/verifications/documents` endpoints, and server actions for session creation and OCR placeholder document processing.
- Replaced the verifications dashboard placeholder with a working verification orchestration UI, including filters, session queue, document OCR output list, and action forms.
- Added watchlist provider placeholders and repository workflows that persist screening outcomes to `watchlist_results`.
- Added `/api/watchlist` and a watchlist server action for running tenant-scoped screening checks from the UI.
- Extended the verifications workspace with watchlist screening controls and watchlist outcome visibility.
- Added risk decision engine services that evaluate documents, watchlist outcomes, and tenant rules to compute risk score and risk level.
- Added `/api/risk` and a decision engine server action that auto-updates verification decision/status and persists `risk_profiles` factors.
- Extended the verifications workspace with decision-engine execution controls and recent risk profile outputs.
- Verified the scaffold with dependency installation, typecheck, lint, and production build.
