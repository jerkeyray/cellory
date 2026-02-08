/**
 * Fix existing transcript: add speaker labels
 * Run: bun run scripts/fix-existing-transcript.ts <transcript-id>
 */

import { PrismaClient } from "@/app/generated/prisma";
import { addSpeakerLabels } from "@/app/lib/diarization";

const prisma = new PrismaClient();

async function main() {
  const transcriptId = process.argv[2];

  if (!transcriptId) {
    console.error("Usage: bun run scripts/fix-existing-transcript.ts <transcript-id>");
    process.exit(1);
  }

  console.log(`Fixing transcript ${transcriptId}...`);

  // Get transcript
  const transcript = await prisma.transcript.findUnique({
    where: { id: transcriptId },
  });

  if (!transcript) {
    console.error("Transcript not found");
    process.exit(1);
  }

  console.log(`Current content (first 200 chars):\n${transcript.content.substring(0, 200)}`);

  // Add speaker labels
  console.log("\nAdding speaker labels...");
  const labeled = await addSpeakerLabels(transcript.content);

  // Update
  await prisma.transcript.update({
    where: { id: transcriptId },
    data: { content: labeled },
  });

  console.log(`\n✅ Updated! New content (first 300 chars):\n${labeled.substring(0, 300)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
