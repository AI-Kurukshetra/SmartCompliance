# SmartCompliance 5-Minute Demo Script

## 0:00 - 0:30 | What This Is
On screen: Open `/`.

Voiceover:
"SmartCompliance is a tenant-scoped KYC and AML platform that combines onboarding, risk decisions, monitoring, case handling, and reporting in one workspace."

## 0:30 - 1:00 | Login + Dashboard
On screen: Login, open `/dashboard`.

Voiceover:
"After login, the dashboard gives a live view of risk, fraud alerts, verification outcomes, and case workload, with direct actions for each workflow."

## 1:00 - 2:00 | Quick Onboarding + Verification
On screen:
1. Customers -> Add customer (`Avery Stone`, low risk) -> submit.
2. Verifications -> New session for Avery -> submit.
3. Verifications -> Upload document placeholder -> submit.
4. Verifications -> Run screening (`ofac_placeholder`) -> submit.
5. Verifications -> Run decision -> submit.

Voiceover:
"In under a minute, we create a customer, start verification, process a placeholder document, run watchlist screening, and execute the risk decision engine."

## 2:00 - 3:20 | Monitoring and Alerts
On screen:
1. Customers -> Add `Reese Keller` with `critical` risk.
2. Monitoring -> Ingest transaction:
- amount `15000`
- currency `USD`
- type `crypto_transfer`
- counterparty `RU`
3. Show alert list.

Voiceover:
"For ongoing AML monitoring, we ingest transactions and automatically detect suspicious patterns.  
This high-value crypto transfer with a high-risk jurisdiction generates alerts and flags the transaction for compliance review."

## 3:20 - 4:10 | Case Workflow
On screen:
1. Cases -> New case -> assign officer -> submit.
2. Cases -> Update case -> set status/decision.

Voiceover:
"Alerts can be escalated into cases, assigned to compliance officers, and resolved with explicit decisions and notes for operational traceability."

## 4:10 - 4:50 | Reports and Export
On screen:
1. Reports -> Generate `sar`.
2. Export CSV or PDF from ready report.

Voiceover:
"Regulatory outputs are generated as tracked jobs and exported in CSV or PDF for filing and downstream workflows."

## 4:50 - 5:00 | Close
On screen: Dashboard.

Voiceover:
"SmartCompliance provides one operational path from onboarding through monitoring and regulatory reporting, with tenant isolation and role-based control built in."

## Minimal Recording Checklist
- Login successful
- One verification pipeline completed
- One flagged transaction with alerts
- One case action
- One report generated and exported
