# AgriVet OS — Phase 9

## Scope
Implement the nine connected veterinary-care capabilities described in sections 1–13, preserving Phases 1–8.1 and real data. The submitted brief ends during section 14; any remaining requirements still need to be supplied. No feature will be presented as complete before implementation and verification.

## Dependency order
1. **Secure foundation:** professional profiles; approved-only public directory; owner-controlled, scoped sharing grants; expiry/revocation and immutable audit records. Public listings expose only explicitly public professional information.
2. **Booking:** veterinarian-published availability and duration; farmer booking requests for owned livestock; database overlap protection; authorized confirmation, decline, cancellation, rescheduling and completion. Start with Africa/Lagos and label displayed timezones.
3. **Conversations:** persisted participant-only messages, read state, blocking and metadata-only abuse reports. Recheck veterinarian approval and sharing authorization on each protected read/write. Add image attachments only through private, validated storage.
4. **Clinical records:** appointment-linked consultations, separate farmer reports and veterinarian assessments, correction history, links to original records, structured prescriptions with explicit issuance review and preserved historical versions. Add readable printing from authorized stored data.
5. **External services:** participant-authorized, short-lived video access for confirmed online appointments. If credentials are absent, provide a genuine setup state, messaging fallback and configuration documentation. AI uses the existing Lovable AI service server-side, with explicit disclosure/consent, safe triage constraints and private labelled assistance history.
6. **Integration:** persistent deduplicated notifications, upcoming appointments and real follow-up dates; useful farmer/vet navigation and workspaces; retain original health, vaccination and treatment sources without automatic administration entries.
7. **Verification:** database access matrix, revoked/expired grants, unapproved vets, forged identities, concurrent booking conflicts, prescription integrity and original-phase regressions; signed-in end-to-end workflows, Hausa/English and 360px layout checks. Remove only fictional test data and report passed, failed, blocked and untested checks separately.

## Technical approach
- Reuse the existing authentication context, roles, verification workflow, service abstractions, translation dictionaries, shared controls and authenticated routes.
- Apply additive migrations in dependency order, with explicit grants, RLS and authenticated database functions. Clinical access requires current approval plus the exact active livestock grant; platform roles alone never bypass private access.
- Preserve farmer access to their historical records after revocation; the veterinarian loses subsequent protected clinical reads and conversation access. Preserve audit metadata without exposing private contents to administrators.
- Restrict writes to authenticated participants; derive owners, senders, reviewers and professional authors from authenticated identity, not supplied IDs. Use atomic database constraints and validated status transitions.
- Freeze issued prescription content and professional identity snapshots; corrections use auditable superseding records. A prescription never implies administration.
- Use server functions for secret-backed integrations; no private keys in browser configuration. No payment, SMS, email, push, pharmacy or default recording claims.
- Maintain the task roadmap throughout implementation. If a pass cannot safely finish everything, report the exact completed foundation and remaining tasks rather than claiming Phase 9 completion.

## Decisions and limits
- No cancellation fees, payment rules, invented availability or fabricated professional data.
- Video provider selection follows available integrations; missing credentials block live-call testing, not the honest setup workflow.
- Optional photo/image support is enabled only with secure storage validation and an appropriate supported integration.
- Native Hausa review and Nigerian veterinary/legal review remain external reviews, not claimed certifications.