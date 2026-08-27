import crypto from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  if (typeof password !== "string" || password.length < 12) throw new Error("Password must be at least 12 characters");
  const hash = crypto.scryptSync(password, salt, KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, encoded) {
  const [salt, expectedHex] = String(encoded).split(":");
  if (!salt || !expectedHex) return false;
  const actual = crypto.scryptSync(password, salt, KEYLEN);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function newSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function tokenDigest(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isoNow() { return new Date().toISOString(); }
