import crypto from "node:crypto";
export function requestHandover(event, { fromUserId, toUserId, note = "" }) {
  if (!event.ownerUserId) throw new Error("Event has no current owner");
  if (event.ownerUserId !== fromUserId) throw new Error("Only the current owner can initiate this handover");
  if (!toUserId || toUserId === fromUserId) throw new Error("A different receiving user is required");
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    eventId: event.id,
    fromUserId,
    toUserId,
    note,
    status: "PENDING",
    requestedAt: new Date().toISOString(),
    acceptedAt: null,
  };
}

export function acceptHandover(event, handover, acceptingUserId) {
  if (handover.status !== "PENDING") throw new Error("Handover is not pending");
  if (handover.toUserId !== acceptingUserId) throw new Error("Only the named recipient can accept");
  return {
    handover: { ...handover, status: "ACCEPTED", acceptedAt: new Date().toISOString() },
    event: { ...event, ownerUserId: acceptingUserId },
  };
}
