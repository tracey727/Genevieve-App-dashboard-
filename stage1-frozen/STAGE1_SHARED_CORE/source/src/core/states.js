export const STATES = Object.freeze(["GREEN", "AMBER", "RED", "CRITICAL", "GOVERNANCE"]);

const transitions = new Map([
  ["GREEN", new Set(["AMBER", "RED", "CRITICAL", "GOVERNANCE"])],
  ["AMBER", new Set(["GREEN", "RED", "CRITICAL", "GOVERNANCE"])],
  ["RED", new Set(["AMBER", "CRITICAL", "GOVERNANCE"])],
  ["CRITICAL", new Set(["RED", "GOVERNANCE"])],
  ["GOVERNANCE", new Set(["GREEN", "AMBER", "RED", "CRITICAL"])],
]);

export function assertState(value) {
  if (!STATES.includes(value)) throw new Error(`Invalid state: ${value}`);
  return value;
}

export function assertTransition(from, to, { governanceOverride = false } = {}) {
  assertState(from); assertState(to);
  if (from === to) return true;
  if (governanceOverride) return true;
  if (!transitions.get(from)?.has(to)) throw new Error(`Transition ${from} -> ${to} is not permitted`);
  return true;
}
