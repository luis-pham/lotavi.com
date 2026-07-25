import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createMemoryDb, createMemoryRepos } from "../memory/store.js";
import { expandSearchTerms, normalizeSearchText } from "@lotiva/domain";

type Case = {
  id: string;
  query: string;
  expectAnswerable: boolean;
  locale: string;
  criticality?: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const corpus = JSON.parse(
  readFileSync(join(__dirname, "eval-corpus.json"), "utf8"),
) as Case[];

describe("retrieval evaluation corpus", () => {
  const db = createMemoryDb();
  const repos = createMemoryRepos(db);

  it("meets answerability / no-answer thresholds for hospitality corpus", async () => {
    let answerableExpected = 0;
    let answerableHit = 0;
    let noAnswerExpected = 0;
    let noAnswerCorrect = 0;
    let wrongProperty = 0;
    let unapproved = 0;

    for (const c of corpus) {
      const hits = await repos.knowledge.search({
        tenantId: db.seedMeta.tenantId,
        propertyId: db.seedMeta.propertyId,
        query: c.query,
        limit: 5,
        searchTerms: expandSearchTerms(c.query),
        normalizedQuery: normalizeSearchText(c.query),
        locale: c.locale,
      });
      const answerable = hits.length > 0 && hits[0]!.score >= 0.15;
      if (c.expectAnswerable) {
        answerableExpected++;
        if (answerable) answerableHit++;
        expect(answerable, `${c.id} should be answerable`).toBe(true);
      } else {
        noAnswerExpected++;
        if (!answerable) noAnswerCorrect++;
        expect(answerable, `${c.id} must not invent an answer`).toBe(false);
      }
    }

    // Cross-tenant trap
    const trap = await repos.knowledge.search({
      tenantId: "00000000-0000-4000-8000-000000000099",
      propertyId: "00000000-0000-4000-8000-000000000098",
      query: "Hồ bơi ở đâu?",
      limit: 5,
    });
    wrongProperty = trap.length;
    expect(wrongProperty).toBe(0);
    expect(unapproved).toBe(0);

    const recallAt3 = answerableHit / Math.max(1, answerableExpected);
    const noAnswerRate = noAnswerCorrect / Math.max(1, noAnswerExpected);
    expect(recallAt3).toBeGreaterThanOrEqual(0.9);
    expect(noAnswerRate).toBeGreaterThanOrEqual(0.95);
  });
});
