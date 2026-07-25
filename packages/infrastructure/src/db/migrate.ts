import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../../drizzle");

async function main() {
  const url = process.env.DATABASE_URL ?? "postgres://lotiva:lotiva@localhost:5432/lotiva";
  const sql = postgres(url, { max: 1 });

  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const applied = await sql<{ id: string }[]>`select id from schema_migrations where id = ${file}`;
    if (applied.length) {
      console.log(`skip ${file}`);
      continue;
    }
    const body = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`apply ${file}`);
    await sql.unsafe(body);
    await sql`insert into schema_migrations (id) values (${file})`;
  }

  await sql.end();
  console.log("migrations complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
