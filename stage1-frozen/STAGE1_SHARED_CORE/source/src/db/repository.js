import pg from "pg";
import { tokenDigest } from "../core/security.js";
const { Pool } = pg;

export function createRepository(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString, ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false } });

  return {
    pool,
    async getUserByEmail(email) {
      const q = await pool.query(`SELECT u.*, a.code agency_code FROM users u JOIN agencies a ON a.id=u.agency_id WHERE lower(u.email)=lower($1) AND u.active=true`, [email]);
      return q.rows[0] || null;
    },
    async recordLoginFailure(userId) { await pool.query(`UPDATE users SET failed_login_attempts=failed_login_attempts+1, locked_until=CASE WHEN failed_login_attempts+1 >= 5 THEN now()+interval '15 minutes' ELSE locked_until END WHERE id=$1`,[userId]); },
    async clearLoginFailures(userId) { await pool.query(`UPDATE users SET failed_login_attempts=0, locked_until=NULL WHERE id=$1`,[userId]); },
    async getUserById(id) {
      const q = await pool.query(`SELECT u.*, a.code agency_code FROM users u JOIN agencies a ON a.id=u.agency_id WHERE u.id=$1 AND u.active=true`, [id]);
      return q.rows[0] || null;
    },
    async usersBelongToAgency(ids, agencyId) {
      const clean=[...new Set((ids||[]).filter(Boolean))];
      if (!clean.length) return true;
      const q=await pool.query(`SELECT count(*)::int AS n FROM users WHERE id = ANY($1::uuid[]) AND agency_id=$2 AND active=true`, [clean, agencyId]);
      return q.rows[0].n === clean.length;
    },
    async createSession(userId, rawToken, idleMinutes=30, absoluteHours=12) {
      const q = await pool.query(`INSERT INTO sessions(user_id, token_digest, expires_at, absolute_expires_at)
      VALUES($1,$2,now()+($3||' minutes')::interval,now()+($4||' hours')::interval) RETURNING *`, [userId, tokenDigest(rawToken), idleMinutes, absoluteHours]);
      return q.rows[0];
    },
    async resolveSession(rawToken, idleMinutes=30) {
      const q = await pool.query(`SELECT s.*, u.agency_id, u.email, u.display_name, u.role, u.is_platform_admin
      FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_digest=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND s.absolute_expires_at>now() AND u.active=true`, [tokenDigest(rawToken)]);
      const row=q.rows[0]; if(!row) return null;
      await pool.query(`UPDATE sessions SET last_seen_at=now(), expires_at=LEAST(now()+($2||' minutes')::interval, absolute_expires_at) WHERE id=$1`, [row.id, idleMinutes]);
      return { id: row.user_id, agencyId: row.agency_id, email: row.email, displayName: row.display_name, role: row.role, isPlatformAdmin: row.is_platform_admin, sessionId: row.id };
    },
    async revokeSession(sessionId) { await pool.query(`UPDATE sessions SET revoked_at=now() WHERE id=$1 AND revoked_at IS NULL`, [sessionId]); },
    async createEvent(e) {
      const q=await pool.query(`INSERT INTO events(agency_id,title,summary,state,owner_user_id,backup_user_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [e.agencyId,e.title,e.summary||'',e.state||'GREEN',e.ownerUserId||null,e.backupUserId||null,e.createdBy]); return q.rows[0];
    },
    async getEvent(id) { const q=await pool.query(`SELECT * FROM events WHERE id=$1`,[id]); return q.rows[0]||null; },
    async listEvents(agencyId) { const q=await pool.query(`SELECT * FROM events WHERE agency_id=$1 ORDER BY created_at DESC LIMIT 200`,[agencyId]); return q.rows; },
    async acknowledge(id,userId) { const q=await pool.query(`UPDATE events SET acknowledged_at=COALESCE(acknowledged_at,now()), acknowledged_by=COALESCE(acknowledged_by,$2), updated_at=now() WHERE id=$1 RETURNING *`,[id,userId]); return q.rows[0]; },
    async assign(id,owner,backup) { const q=await pool.query(`UPDATE events SET owner_user_id=$2, backup_user_id=$3, updated_at=now() WHERE id=$1 RETURNING *`,[id,owner,backup]); return q.rows[0]; },
    async setState(id,state) { const q=await pool.query(`UPDATE events SET state=$2, updated_at=now() WHERE id=$1 RETURNING *`,[id,state]); return q.rows[0]; },
    async createHandover(h) { const q=await pool.query(`INSERT INTO handovers(agency_id,event_id,from_user_id,to_user_id,note) VALUES($1,$2,$3,$4,$5) RETURNING *`,[h.agencyId,h.eventId,h.fromUserId,h.toUserId,h.note||'']); return q.rows[0]; },
    async getHandover(id){const q=await pool.query(`SELECT * FROM handovers WHERE id=$1`,[id]);return q.rows[0]||null;},
    async acceptHandover(handoverId,eventId,toUserId){const client=await pool.connect();try{await client.query('BEGIN'); const h=await client.query(`UPDATE handovers SET status='ACCEPTED', accepted_at=now() WHERE id=$1 AND status='PENDING' AND to_user_id=$2 RETURNING *`,[handoverId,toUserId]); if(!h.rows[0]) throw new Error('Handover unavailable'); const e=await client.query(`UPDATE events SET owner_user_id=$2, updated_at=now() WHERE id=$1 RETURNING *`,[eventId,toUserId]); await client.query('COMMIT'); return {handover:h.rows[0],event:e.rows[0]};}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}},
    async audit(entry){await pool.query(`INSERT INTO audit_log(agency_id,actor_user_id,actor_role,action,resource_type,resource_id,outcome,request_id,details) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,[entry.agencyId||null,entry.actorUserId||null,entry.actorRole||null,entry.action,entry.resourceType,entry.resourceId||null,entry.outcome,entry.requestId||null,JSON.stringify(entry.details||{})]);},
    async listAudit(agencyId){const q=await pool.query(`SELECT * FROM audit_log WHERE agency_id=$1 ORDER BY occurred_at DESC LIMIT 500`,[agencyId]);return q.rows;},
    async close(){await pool.end();}
  };
}
