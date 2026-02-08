/**
 * List all transcripts
 * Run: bun run scripts/list-transcripts.ts
 */

import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const transcripts = await prisma.transcript.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log("Recent Transcripts:\n");
  transcripts.forEach((t, i) => {
    console.log(`${i + 1}. ID: ${t.id}`);
    console.log(`   Filename: ${t.filename}`);
    console.log(`   Status: ${t.status}`);
    console.log(`   Created: ${t.createdAt.toISOString()}`);
    console.log(`   Content length: ${t.content.length} chars`);
    console.log();
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
