/**
 * Mark calls as error if they're stuck with no data
 */

import { prisma } from '../app/lib/prisma';

async function markStuckAsError() {
  const stuckCalls = await prisma.call.findMany({
    where: {
      OR: [
        { status: 'pending' },
        { status: 'extracting' },
        { status: 'aggregating' },
      ],
    },
    include: {
      _count: { select: { signals: true } },
      transcript: { select: { filename: true } },
    },
  });

  const toMarkError = stuckCalls.filter((c) => c._count.signals === 0);

  console.log(`Found ${toMarkError.length} calls with no signals to mark as error\n`);

  for (const call of toMarkError) {
    console.log(`Marking ${call.id} (${call.transcript.filename}) as error`);
    await prisma.call.update({
      where: { id: call.id },
      data: { status: 'error' },
    });
  }

  console.log(`\n✅ Marked ${toMarkError.length} calls as error`);
  await prisma.$disconnect();
}

markStuckAsError();
