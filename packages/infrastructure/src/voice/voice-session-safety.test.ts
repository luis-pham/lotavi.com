import { describe, expect, it } from "vitest";
import { createMemoryDb, createMemoryRepos } from "../memory/store.js";

describe("V0 voice session ownership", () => {
  it("persists session and enforces guest ownership", async () => {
    const db = createMemoryDb();
    const repos = createMemoryRepos(db);
    const guest = await repos.sessions.create({
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      qrContextId: db.qr[0]!.id,
      roomId: db.seedMeta.roomId,
      locale: "vi-VN",
      themeVersionId: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const conversation = await repos.conversations.getOrCreate(guest.id, db.seedMeta.tenantId);

    const id = "018f0000-0000-7000-8000-0000000000aa";
    await repos.voiceSessions.create({
      id,
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      guestSessionId: guest.id,
      conversationId: conversation.id,
      transport: "relay",
      status: "active",
    });

    const owned = await repos.voiceSessions.assertOwnedByGuest(
      id,
      guest.id,
      db.seedMeta.tenantId,
    );
    expect(owned?.id).toBe(id);

    const other = await repos.voiceSessions.assertOwnedByGuest(
      id,
      "018f0000-0000-7000-8000-0000000000bb",
      db.seedMeta.tenantId,
    );
    expect(other).toBeNull();

    await repos.voiceSessions.updateStatus({
      id,
      tenantId: db.seedMeta.tenantId,
      status: "ended",
      endedAt: new Date(),
    });
    const afterEnd = await repos.voiceSessions.assertOwnedByGuest(
      id,
      guest.id,
      db.seedMeta.tenantId,
    );
    expect(afterEnd).toBeNull();
  });

  it("counts open sessions per property", async () => {
    const db = createMemoryDb();
    const repos = createMemoryRepos(db);
    const guest = await repos.sessions.create({
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      qrContextId: db.qr[0]!.id,
      roomId: db.seedMeta.roomId,
      locale: "vi-VN",
      themeVersionId: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const conversation = await repos.conversations.getOrCreate(guest.id, db.seedMeta.tenantId);
    await repos.voiceSessions.create({
      id: "018f0000-0000-7000-8000-0000000000c1",
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      guestSessionId: guest.id,
      conversationId: conversation.id,
      transport: "direct",
    });
    const n = await repos.voiceSessions.countOpenForProperty(
      db.seedMeta.propertyId,
      db.seedMeta.tenantId,
    );
    expect(n).toBe(1);
  });
});
