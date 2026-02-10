/**
 * Fix calls stuck in processing states that actually have signals
 * Run with: npx tsx scripts/fix-stuck-calls.ts
 */

import { prisma } from '../app/lib/prisma';

async function fixStuckCalls() {
  console.log('🔍 Checking for stuck calls...\n');

  // Find calls in processing states that have signals
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

  console.log(`Found ${stuckCalls.length} calls in processing states\n`);

  let fixedCount = 0;

  for (const call of stuckCalls) {
    const hasSignals = call._count.signals > 0;
    const hasAggregates = call._count.aggregates > 0;

    console.log(`📞 Call ${call.id.slice(0, 8)}... (${call.transcript.filename})`);
    console.log(`   Status: ${call.status}`);
    console.log(`   Signals: ${call._count.signals}`);
    console.log(`   Aggregates: ${call._count.aggregates}`);

    // If has both signals and aggregates, mark as complete
    if (hasSignals && hasAggregates) {
      console.log(`   ✅ Fixing: marking as complete\n`);
      await prisma.call.update({
        where: { id: call.id },
        data: { status: 'complete' },
      });
      fixedCount++;
    } else if (hasSignals && !hasAggregates) {
      console.log(`   ⚠️  Has signals but no aggregates - needs aggregation\n`);
    } else {
      console.log(`   ℹ️  No signals yet - genuinely still processing or errored\n`);
    }
  }

  console.log(`\n✨ Fixed ${fixedCount} stuck calls!`);

  // Also check for calls stuck in transcript processing
  const stuckTranscripts = await prisma.transcript.findMany({
    where: {
      status: 'processing',
      content: { not: '' },
    },
    select: {
      id: true,
      filename: true,
      content: true,
      createdAt: true,
    },
  });

  console.log(`\n🔍 Found ${stuckTranscripts.length} transcripts stuck in processing with content\n`);

  for (const transcript of stuckTranscripts) {
    const ageMinutes = Math.round((Date.now() - transcript.createdAt.getTime()) / 60000);
    console.log(`📝 Transcript ${transcript.id.slice(0, 8)}... (${transcript.filename})`);
    console.log(`   Age: ${ageMinutes} minutes`);

    if (transcript.content && transcript.content.length > 100) {
      console.log(`   ✅ Has content - marking as ready\n`);
      await prisma.transcript.update({
        where: { id: transcript.id },
        data: { status: 'ready' },
      });
    } else {
      console.log(`   ⚠️  Content too short or empty\n`);
    }
  }

  await prisma.$disconnect();
}

fixStuckCalls().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
