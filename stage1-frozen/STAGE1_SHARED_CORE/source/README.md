# GENEVIEVE Shared Emergency Operations Core v1.0.0

Chronological rebuild Step 1. This package is the shared server-side foundation for later Ambulance, Police, SES, Fire & Rescue, Surf/Marine and Multi-Agency EOC modules.

## Included

Identity and individual users; roles; agency/centre boundary; GREEN/AMBER/RED/CRITICAL/GOVERNANCE state engine; acknowledgement; named owner and backup; positive-acceptance handover; append-only audit evidence; idle/absolute session expiry and revocation; server-side authorisation.

## Run

1. Create a PostgreSQL/Neon database and set `DATABASE_URL`.
2. Run `psql "$DATABASE_URL" -f src/db/schema.sql`.
3. Create an agency row, then users with `node scripts/create-user.mjs`.
4. `npm install`
5. `npm test`
6. `npm start`

## Chronology gate

Do **not** begin an agency-specific build until:

- unit tests pass;
- database migration succeeds on the target database;
- two-agency tests prove cross-agency reads/writes are denied;
- responder/dispatcher/supervisor/auditor/admin tests prove role denial server-side;
- session expiry/revocation is demonstrated;
- audit rows cannot be modified or deleted by the application role;
- handover retains the old owner until the recipient explicitly accepts.

This build deliberately stops before Ambulance or Police-specific workflows.
