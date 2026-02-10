/**
 * List stuck calls with full IDs
 */

import { prisma } from '../app/lib/prisma';

async function listStuckCalls() {
  const stuckCalls = await prisma.call.findMany({
    where: {
      OR: [
        { status: 'pending' },
        { status: 'extracting' },
        { status: 'aggregating' },
      ],
    },
    include: {
      _count: {
        select: { signals: true, aggregates: true },
      },
      transcript: {
        select: { filename: true },
      },
    },
  });

  console.log('Stuck calls:\n');

  for (const call of stuckCalls) {
    const hasSignals = call._count.signals > 0;
    const hasAggregates = call._count.aggregates > 0;

    let issue = '';
    if (hasSignals && hasAggregates) {
      issue = '✅ FIXABLE: Has both, just needs status update';
    } else if (hasSignals && !hasAggregates) {
      issue = '⚠️  NEEDS RETRY: Has signals but missing aggregates';
    } else {
      issue = 'ℹ️  NO DATA: Needs full reprocess or mark as error';
    }

    console.log(`ID: ${call.id}`);
    console.log(`File: ${call.transcript.filename}`);
    console.log(`Status: ${call.status}`);
    console.log(`Signals: ${call._count.signals}, Aggregates: ${call._count.aggregates}`);
    console.log(`Issue: ${issue}`);
    console.log('---');
  }

  await prisma.$disconnect();
}

listStuckCalls();
