/**
 * Retry processing for a specific call
 * Run with: npx tsx scripts/retry-call.ts <callId>
 */

import { prisma } from '../app/lib/prisma';
import { processCall } from '../app/lib/pipeline';

async function retryCall(callId: string) {
  console.log(`🔄 Retrying call ${callId}...\n`);

  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      transcript: { select: { filename: true, status: true } },
      _count: { select: { signals: true, aggregates: true } },
    },
  });

  if (!call) {
    console.error('❌ Call not found');
    process.exit(1);
  }

  console.log(`📞 Call: ${call.transcript.filename}`);
  console.log(`   Current status: ${call.status}`);
  console.log(`   Signals: ${call._count.signals}`);
  console.log(`   Aggregates: ${call._count.aggregates}`);
  console.log(`   Transcript status: ${call.transcript.status}\n`);

  if (call.transcript.status !== 'ready') {
    console.error('❌ Transcript is not ready. Status:', call.transcript.status);
    process.exit(1);
  }

  console.log('🚀 Starting pipeline...\n');

  const result = await processCall(callId);

  console.log(`\n✅ Pipeline complete!`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Signals: ${result.signalCount}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }

  await prisma.$disconnect();
}

const callId = process.argv[2];

if (!callId) {
  console.error('Usage: npx tsx scripts/retry-call.ts <callId>');
  process.exit(1);
}

retryCall(callId).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
