/**
 * Sequentially import normalized transcript JSON files into Cellory.
 *
 * Usage:
 *   npx tsx scripts/import-normalized-batch.ts --api http://localhost:3000 --cookie "authjs.session-token=..." ./a.json ./b.json
 *   npx tsx scripts/import-normalized-batch.ts --api http://localhost:3000 --cookie-env CELLORY_IMPORT_COOKIE ./normalized/
 */

import fs from "node:fs/promises";
import path from "node:path";

interface Args {
  apiBase: string;
  cookie?: string;
  cookieEnv?: string;
  targets: string[];
}

function parseArgs(argv: string[]): Args {
  let apiBase = "http://localhost:3000";
  let cookie: string | undefined;
  let cookieEnv: string | undefined;
  const targets: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--api") apiBase = argv[++i];
    else if (token === "--cookie") cookie = argv[++i];
    else if (token === "--cookie-env") cookieEnv = argv[++i];
    else targets.push(token);
  }

  return { apiBase, cookie, cookieEnv, targets };
}

async function collectJsonFiles(targets: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const target of targets) {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(target);
      for (const entry of entries) {
        if (entry.toLowerCase().endsWith(".json")) {
          files.push(path.join(target, entry));
        }
      }
    } else if (target.toLowerCase().endsWith(".json")) {
      files.push(target);
    }
  }

  return files.sort();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.targets.length === 0) {
    console.error("Provide at least one json file or directory.");
    process.exit(1);
  }

  const cookieHeader = args.cookie || (args.cookieEnv ? process.env[args.cookieEnv] : undefined);
  if (!cookieHeader) {
    console.error("Missing auth cookie. Use --cookie or --cookie-env.");
    process.exit(1);
  }

  const files = await collectJsonFiles(args.targets);
  if (files.length === 0) {
    console.error("No .json files found.");
    process.exit(1);
  }

  console.log(`Importing ${files.length} files into ${args.apiBase}...`);
  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const payload = JSON.parse(raw);

    const response = await fetch(`${args.apiBase}/api/transcripts/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`FAIL ${file}: ${response.status} ${errorBody}`);
      continue;
    }

    const result = await response.json();
    console.log(`OK   ${file} -> transcript ${result.id}`);
  }
}

main().catch((error) => {
  console.error("Batch import failed:", error);
  process.exit(1);
});
