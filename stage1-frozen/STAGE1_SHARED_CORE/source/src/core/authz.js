export const ROLES = Object.freeze(["RESPONDER", "DISPATCHER", "SUPERVISOR", "AUDITOR", "ADMIN"]);

const grants = {
  RESPONDER: new Set(["event:read", "event:ack", "handover:request", "handover:accept"]),
  DISPATCHER: new Set(["event:create", "event:read", "event:ack", "event:assign", "event:state", "handover:request", "handover:accept"]),
  SUPERVISOR: new Set(["event:create", "event:read", "event:ack", "event:assign", "event:state", "handover:request", "handover:accept", "audit:read", "session:revoke"]),
  AUDITOR: new Set(["event:read", "audit:read"]),
  ADMIN: new Set(["event:create", "event:read", "event:ack", "event:assign", "event:state", "handover:request", "handover:accept", "audit:read", "session:revoke", "user:manage"]),
};

export function assertRole(role) {
  if (!ROLES.includes(role)) throw new Error(`Invalid role: ${role}`);
}

export function can(user, action, resource = {}) {
  if (!user) return false;
  assertRole(user.role);
  if (!grants[user.role].has(action)) return false;
  if (user.role === "ADMIN" && user.isPlatformAdmin === true) return true;
  if (resource.agencyId && user.agencyId !== resource.agencyId) return false;
  if (resource.restrictedToUserId && resource.restrictedToUserId !== user.id) return false;
  return true;
}

export function requirePermission(user, action, resource = {}) {
  if (!can(user, action, resource)) {
    const err = new Error("Access denied");
    err.code = "FORBIDDEN";
    throw err;
  }
  return true;
}
