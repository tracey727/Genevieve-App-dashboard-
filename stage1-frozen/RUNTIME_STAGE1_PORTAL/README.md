# V10.3 Stage-1 portal runtime

This is an integration wrapper only. It mounts the existing V10.3 static portal under the exact Stage-1 Shared Emergency Operations Core v1.0.2 Express application.

- Existing Stage-1 endpoints remain unchanged: `/health`, `/auth/login`, `/auth/logout`, `/events`, event acknowledgement/assignment/state, handover request/acceptance and `/audit`.
- The browser adapter uses same-origin requests and HttpOnly session cookies.
- The wrapper does not add agency-specific Ambulance or later-stage workflows.
- `DATABASE_URL` is required for server runtime.
