CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  email text UNIQUE NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('RESPONDER','DISPATCHER','SUPERVISOR','AUDITOR','ADMIN')),
  password_hash text NOT NULL,
  is_platform_admin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  failed_login_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, agency_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  token_digest text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_digest_idx ON sessions(token_digest);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  external_ref text,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  state text NOT NULL CHECK (state IN ('GREEN','AMBER','RED','CRITICAL','GOVERNANCE')) DEFAULT 'GREEN',
  owner_user_id uuid,
  backup_user_id uuid,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  closed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, agency_id),
  FOREIGN KEY (owner_user_id, agency_id) REFERENCES users(id, agency_id),
  FOREIGN KEY (backup_user_id, agency_id) REFERENCES users(id, agency_id),
  FOREIGN KEY (acknowledged_by, agency_id) REFERENCES users(id, agency_id),
  FOREIGN KEY (created_by, agency_id) REFERENCES users(id, agency_id)
);

CREATE INDEX IF NOT EXISTS events_agency_idx ON events(agency_id, state, created_at DESC);

CREATE TABLE IF NOT EXISTS handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  event_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  note text NOT NULL DEFAULT '',
  status text NOT NULL CHECK(status IN ('PENDING','ACCEPTED','REJECTED','CANCELLED')) DEFAULT 'PENDING',
  requested_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  FOREIGN KEY (event_id, agency_id) REFERENCES events(id, agency_id),
  FOREIGN KEY (from_user_id, agency_id) REFERENCES users(id, agency_id),
  FOREIGN KEY (to_user_id, agency_id) REFERENCES users(id, agency_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  agency_id uuid REFERENCES agencies(id),
  actor_user_id uuid REFERENCES users(id),
  actor_role text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  outcome text NOT NULL CHECK(outcome IN ('ALLOW','DENY','ERROR')),
  request_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION deny_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON audit_log;
CREATE TRIGGER audit_log_no_update BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION deny_audit_mutation();
