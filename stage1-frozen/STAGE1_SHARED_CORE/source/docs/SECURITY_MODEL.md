# Security model

This is a controlled operational prototype, not an authorised live emergency-dispatch system.

- Individual named accounts only; no shared staff login design.
- Passwords use Node.js `scrypt`; plaintext passwords are never stored.
- Opaque random session tokens are stored only as SHA-256 digests server-side.
- Idle and absolute session expiry are enforced by the database session record; logout revokes the session.
- Server-side RBAC applies to every protected API route.
- Agency tenancy is checked server-side for every event-scoped request. A hidden UI control is never treated as authorisation.
- Audit records capture allow/deny/error outcomes. PostgreSQL blocks UPDATE and DELETE of audit rows.
- Named primary owner and backup owner are explicit event fields.
- Handover is two-phase: request then explicit acceptance. Ownership changes only after recipient acceptance.
- State changes use GREEN -> AMBER -> RED -> CRITICAL -> GOVERNANCE semantics with validated transitions.
- Production integrations, CAD/dispatch, tactical command, weapons, classified systems and real patient/person data are excluded until the relevant agency authorises and validates them.

## Production hardening still required before any agency pilot

MFA/SSO integration, secret manager, TLS termination, rate limiting at edge/API gateway, account lockout policy, formal privacy/security threat modelling, penetration testing, backup/restore drills, monitoring, data retention policy, disaster recovery and agency accreditation.
