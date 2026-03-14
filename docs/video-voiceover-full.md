# SmartCompliance Full Voiceover Script (10-12 Minutes)

Use this as a read-aloud script while recording.

## 0:00 - 0:45 | Landing and Product Context
On screen: Open `/`.

Voiceover:
"This is SmartCompliance, a multi-tenant compliance platform for KYC, AML, transaction monitoring, case management, and regulatory reporting.  
The goal is to give operations and compliance teams one workspace to run onboarding and ongoing monitoring workflows end to end."

## 0:45 - 1:30 | Login and Workspace Access
On screen: Click `Login`, sign in with admin/compliance account.

Voiceover:
"I am signing in with a workspace user who has management permissions.  
SmartCompliance enforces tenant-scoped access, so all records and actions stay isolated per tenant."

## 1:30 - 2:15 | Dashboard Overview
On screen: `/dashboard`, point to metric cards and quick links.

Voiceover:
"The dashboard aggregates operational metrics across risk, fraud alerts, verification outcomes, and case workflow.  
From here, the quick actions let us create customers, start verifications, ingest transactions, and generate reports."

## 2:15 - 2:50 | Settings Readiness Check
On screen: Go to `Settings`, show system checks.

Voiceover:
"Before demoing workflows, we confirm readiness: public Supabase configuration, service role key, and active tenant session.  
With these checks configured, all write actions are enabled."

## 2:50 - 4:25 | Customer Onboarding
On screen: `Customers` -> `Add customer`.
Create Customer A:
- First name: `Avery`
- Last name: `Stone`
- Risk: `low`
- Add optional email/phone/country.
Submit.

Voiceover:
"Now I’ll create a customer profile.  
This captures baseline identity and risk posture before verification starts.  
I’m creating Avery Stone as a low-risk profile for a clean-path example."

## 4:25 - 6:20 | Verification Pipeline (Session -> Document -> Screening -> Decision)
On screen:
1. `Verifications` -> `New session` -> choose Avery -> submit.  
2. `Upload document` -> choose session -> submit placeholder.  
3. `Run screening` -> provider `ofac_placeholder` -> submit.  
4. `Run decision` -> select same session -> submit.  
5. Return to `Verifications` list and highlight row.

Voiceover:
"Next, we run the verification pipeline.  
First, we open a verification session for Avery.  
Then we upload a document placeholder, which simulates OCR extraction and confidence scoring.  
After that, we run watchlist screening with the OFAC placeholder provider.  
Finally, we execute the risk decision engine, which combines document signals, watchlist status, and rules to produce a decision.  
In the queue, we can see status, decision, risk score, and output counts in one place."

## 6:20 - 8:35 | Escalation Scenario (High Risk + Monitoring Alerts)
On screen:
1. `Customers` -> add Customer B:
- First name: `Reese`
- Last name: `Keller`
- Risk: `critical`
2. `Verifications` -> create session for Reese.
3. `Run screening` with `ofac_placeholder`.
4. `Run decision`.
5. Go to `Monitoring` -> `Ingest transaction`:
- Customer: Reese Keller
- Amount: `15000`
- Currency: `USD`
- Type: `crypto_transfer`
- Counterparty country: `RU`
Submit.
6. Show flagged transaction + generated alerts.

Voiceover:
"Now I’ll show an escalation path.  
I’m creating Reese Keller as a critical-risk customer.  
We run screening and decisioning, then move to transaction monitoring.  
I ingest a fifteen-thousand-dollar crypto transfer with a high-risk jurisdiction counterparty.  
The monitoring engine flags the transaction and generates alerts based on amount threshold, customer risk, transaction velocity logic, jurisdiction risk, and crypto exposure checks."

## 8:35 - 9:40 | Alert and Case Workflow
On screen:
1. `Monitoring` -> show alerts panel.
2. `Update alert` -> set one alert to `acknowledged` or `resolved`.
3. `Cases` -> `New case` -> assign officer -> submit.
4. `Cases` -> `Update case` -> set status/decision -> submit.

Voiceover:
"From alerts, analysts can update workflow status as they investigate.  
If escalation is required, we create a case, assign an officer, and capture review decisions and notes.  
This creates a traceable manual-review process around higher-risk events."

## 9:40 - 10:55 | Regulatory Reports and Exports
On screen:
1. `Reports` -> `Generate report`.
2. Create `sar` report (30 days).
3. Create `ctr` report (30 days).
4. In reports list, click export `CSV` and `PDF` for a ready report.

Voiceover:
"For regulatory output, SmartCompliance generates SAR, CTR, audit export, and operations summary reports.  
Each report is tracked as a job, with status and completion time.  
Once ready, reports can be exported in CSV or PDF format for downstream compliance processes."

## 10:55 - 11:30 | Close
On screen: Back to Dashboard.

Voiceover:
"That’s the end-to-end flow: tenant-scoped access, customer onboarding, verification, risk decisioning, transaction monitoring, case operations, and regulatory reporting.  
This creates a single operational control plane for compliance teams."

## Optional Technical Notes (if needed on call)
- Watchlist and OCR are placeholder logic in current build.
- Rules create/update is available through API routes.
- Audit logs are written for key operational actions.
