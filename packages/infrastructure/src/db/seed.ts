import {
  defaultThemeDraft,
  generateOpaqueQrToken,
  hashPassword,
  hashQrToken,
  newId,
} from "@lotiva/domain";
import { eq } from "drizzle-orm";
import { closeDb, withBypassRls } from "./client.js";
import * as t from "./schema.js";

async function main() {
  const existing = await withBypassRls(async (db) => {
    const rows = await db.select().from(t.appMeta).where(eq(t.appMeta.key, "seed")).limit(1);
    return rows[0]?.value as
      | {
          guestQrToken: string;
          tenantId: string;
          propertyId: string;
          roomId: string;
        }
      | undefined;
  }).catch(() => undefined);

  if (existing?.guestQrToken) {
    console.log(
      JSON.stringify(
        {
          ...existing,
          guestQrPath: `/g/${existing.guestQrToken}`,
          adminEmail: "admin@lotiva.vn",
          staffEmail: "staff@lotiva.vn",
          password: "admin123",
          note: "seed already present",
        },
        null,
        2,
      ),
    );
    return;
  }

  const tenantId = newId();
  const propertyId = newId();
  const roomId = newId();
  const themeVersionId = newId();
  const docId = newId();
  const chunkId = newId();
  const rawToken = generateOpaqueQrToken();

  await withBypassRls(async (db) => {
    await db.insert(t.tenants).values({
      id: tenantId,
      name: "Green Ruby Hospitality",
      slug: "green-ruby",
    });
    await db.insert(t.properties).values({
      id: propertyId,
      tenantId,
      name: "Green Ruby Demo",
      vertical: "hotel",
    });
    await db.insert(t.rooms).values({
      id: roomId,
      tenantId,
      propertyId,
      label: "1208",
    });
    await db.insert(t.rooms).values({
      id: newId(),
      tenantId,
      propertyId,
      label: "1209",
    });

    // Local/dev seed password — NEVER use in staging/production (ALLOW_DEMO_SEED must be false).
    const passwordHash = hashPassword(process.env.SEED_ADMIN_PASSWORD ?? "admin123");
    await db.insert(t.users).values({
      id: newId(),
      tenantId,
      email: "admin@lotiva.vn",
      passwordHash,
      displayName: "Property Admin",
      role: "property_admin",
    });
    await db.insert(t.users).values({
      id: newId(),
      tenantId,
      email: "staff@lotiva.vn",
      passwordHash,
      displayName: "Front Desk",
      role: "staff",
    });

    await db.insert(t.portalThemeVersions).values({
      id: themeVersionId,
      tenantId,
      propertyId,
      status: "published_immutable",
      tokens: defaultThemeDraft("Green Ruby Demo"),
    });
    await db.insert(t.portalThemePublications).values({
      id: newId(),
      tenantId,
      propertyId,
      versionId: themeVersionId,
    });

    await db.insert(t.qrContexts).values({
      id: newId(),
      tenantId,
      propertyId,
      roomId,
      tokenHash: hashQrToken(rawToken),
      activeFrom: new Date(Date.now() - 60_000),
      activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const wifiDoc = newId();
    const safetyDoc = newId();
    await db.insert(t.knowledgeDocuments).values([
      {
        id: docId,
        tenantId,
        propertyId,
        title: "Pool hours",
        titleNormalized: "pool hours",
        status: "published",
      },
      {
        id: wifiDoc,
        tenantId,
        propertyId,
        title: "Wi-Fi",
        titleNormalized: "wi-fi",
        status: "published",
      },
      {
        id: safetyDoc,
        tenantId,
        propertyId,
        title: "Safety & emergency",
        titleNormalized: "safety & emergency",
        status: "published",
      },
    ]);
    await db.insert(t.knowledgeChunks).values([
      {
        id: chunkId,
        tenantId,
        propertyId,
        documentId: docId,
        content:
          "Hồ bơi mở cửa từ 6:00 đến 22:00 hàng ngày. Trẻ em dưới 12 tuổi cần có người lớn đi kèm. Meeting point: pool deck entrance.",
        contentNormalized:
          "ho boi mo cua tu 6:00 den 22:00 hang ngay. tre em duoi 12 tuoi can co nguoi lon di kem. meeting point: pool deck entrance.",
      },
      {
        id: newId(),
        tenantId,
        propertyId,
        documentId: wifiDoc,
        content: "Wi-Fi network: GreenRuby-Guest. Password available at front desk for verified guests.",
        contentNormalized:
          "wi-fi network: greenruby-guest. password available at front desk for verified guests.",
      },
      {
        id: newId(),
        tenantId,
        propertyId,
        documentId: safetyDoc,
        content:
          "In an emergency dial local emergency services. Hotel security: extension 911 from in-room phone. Assembly point: front driveway.",
        contentNormalized:
          "in an emergency dial local emergency services. hotel security: extension 911 from in-room phone. assembly point: front driveway.",
      },
    ]);

    await db.insert(t.schedules).values({
      id: newId(),
      tenantId,
      propertyId,
      title: "Breakfast buffet",
      location: "Lobby Restaurant",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 1000 * 60 * 120),
      active: true,
    });

    await db.insert(t.announcements).values({
      id: newId(),
      tenantId,
      propertyId,
      title: "Welcome to Green Ruby Demo",
      body: "Quét QR trong phòng để gọi trợ lý AI hoặc gửi yêu cầu dịch vụ.",
      active: true,
      publishedAt: new Date(),
    });

    await db.insert(t.promptProfiles).values({
      id: newId(),
      tenantId: null,
      propertyId: null,
      name: "platform-guest-inform",
      scope: "platform",
    });

    const seedValue = {
      tenantId,
      propertyId,
      roomId,
      tokenHash: hashQrToken(rawToken),
      // Raw token only retained for local demo tooling when explicitly allowed.
      guestQrToken:
        process.env.ALLOW_DEMO_SEED === "true" || process.env.NODE_ENV === "development"
          ? rawToken
          : undefined,
    };
    await db
      .insert(t.appMeta)
      .values({
        key: "seed",
        value: seedValue,
      })
      .onConflictDoUpdate({
        target: t.appMeta.key,
        set: {
          value: seedValue,
          updatedAt: new Date(),
        },
      });

    // ensure tenant readable
    const props = await db.select().from(t.properties).where(eq(t.properties.id, propertyId));
    if (!props.length) throw new Error("seed failed");
  });

  console.log(
    JSON.stringify(
      {
        tenantId,
        propertyId,
        roomId,
        guestQrToken: rawToken,
        guestQrPath: `/g/${rawToken}`,
        adminEmail: "admin@lotiva.vn",
        staffEmail: "staff@lotiva.vn",
        password: "admin123",
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
