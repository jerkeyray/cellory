/**
 * Check calls for a transcript
 */

import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const transcriptId = "d6e997fc-bb32-4a90-b893-e9918a4b3b3e";

  const calls = await prisma.call.findMany({
    where: { transcriptId },
    include: {
      _count: {
        select: { signals: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Calls for transcript ${transcriptId}:\n`);

  if (calls.length === 0) {
    console.log("❌ No calls found. You need to analyze this transcript at /calls/new");
    return;
  }

  calls.forEach((call, i) => {
    console.log(`${i + 1}. Call ID: ${call.id}`);
    console.log(`   Outcome: ${call.outcome}`);
    console.log(`   Status: ${call.status}`);
    console.log(`   Signals: ${call._count.signals}`);
    console.log(`   Created: ${call.createdAt.toISOString()}`);
    console.log();
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
