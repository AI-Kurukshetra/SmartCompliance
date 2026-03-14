# DECISIONS

## 2026-03-14 - Base Architecture

Decision: Use Next.js App Router with route groups for `(auth)` and `(dashboard)`.
Reason: The platform needs clear separation between public auth flows and tenant dashboard experiences without polluting route paths.

Decision: Introduce a first-class `tenants` table even though the source schema draft did not include it.
Reason: Multi-tenant isolation is a primary product requirement and should be modeled directly instead of carrying unbounded UUID references.

Decision: Use Supabase Auth identities plus a public `users` profile table.
Reason: Auth concerns stay inside Supabase while business roles and tenant membership remain queryable within application data.

Decision: Create the schema and RLS foundation before authentication wiring.
Reason: Customer, verification, and case modules depend on stable tenant-scoped tables and policies.

## 2026-03-14 - Authentication Bootstrap

Decision: Provision tenant signup from a server action using the service role key instead of exposing open client-side signup against `auth.users`.
Reason: The application must create a tenant and the first admin profile together, which requires privileged writes and a controlled bootstrap path.

Decision: Sync auth identities into `public.users` from `auth.users` metadata with a database trigger.
Reason: SSR route protection and tenant-aware RLS depend on a stable application profile row for every authenticated user.
