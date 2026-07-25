import { describe, expect, it } from "vitest";
import { createMemoryDb, createMemoryRepos } from "../memory/store.js";

describe("V1.5 voice heartbeat / abandon", () => {
  async function seed() {
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
    const id = "018f0000-0000-7000-8000-0000000000d1";
    await repos.voiceSessions.create({
      id,
      tenantId: db.seedMeta.tenantId,
      propertyId: db.seedMeta.propertyId,
      guestSessionId: guest.id,
      conversationId: conversation.id,
      transport: "direct",
      status: "active",
    });
    return { db, repos, guest, id };
  }

  it("heartbeat requires ownership", async () => {
    const { repos, guest, id, db } = await seed();
    const ok = await repos.voiceSessions.heartbeat(id, db.seedMeta.tenantId, guest.id);
    expect(ok).toBe(true);
    const denied = await repos.voiceSessions.heartbeat(
      id,
      db.seedMeta.tenantId,
      "018f0000-0000-7000-8000-0000000000ee",
    );
    expect(denied).toBe(false);
  });

  it("abandonStale releases concurrent slot", async () => {
    const { repos, db, id } = await seed();
    const before = await repos.voiceSessions.countOpenForProperty(
      db.seedMeta.propertyId,
      db.seedMeta.tenantId,
    );
    expect(before).toBe(1);

    await repos.voiceSessions.updateStatus({
      id,
      tenantId: db.seedMeta.tenantId,
      status: "active",
      lastHeartbeatAt: new Date(Date.now() - 120_000),
    });
    const n = await repos.voiceSessions.abandonStale(new Date(Date.now() - 90_000));
    expect(n).toBe(1);

    const after = await repos.voiceSessions.countOpenForProperty(
      db.seedMeta.propertyId,
      db.seedMeta.tenantId,
    );
    expect(after).toBe(0);

    const row = await repos.voiceSessions.get(id, db.seedMeta.tenantId);
    expect(row?.status).toBe("abandoned");
    expect(row?.terminationReason).toBe("heartbeat_timeout");
  });
});
