# SCHEMA

## Current Migration Scope

Primary migration:

- `supabase/migrations/20260314110000_initial_schema.sql`
- `supabase/migrations/20260314124500_auth_profile_sync.sql`

Initial foundation includes:

- `tenants`
- `users`
- `customers`
- `verification_sessions`
- `documents`
- `watchlist_results`
- `risk_profiles`
- `cases`
- `rules`
- `transactions`
- `alerts`
- `audit_logs`
- `reports`

## Schema Principles

- Every operational table includes `tenant_id`
- RLS enabled on all public tables
- Soft deletes on mutable records
- Immutable audit log records
- `updated_at` trigger for mutable tables

## Next Schema Work

- Storage buckets and storage policies for uploaded documents
- More granular role-specific policies
- Provider integration metadata tables
