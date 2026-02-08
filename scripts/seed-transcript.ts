/**
 * Seed database with sample transcript (NO Whisper API calls)
 * Use this for testing instead of uploading audio
 */

import { PrismaClient } from "@/app/generated/prisma";

const prisma = new PrismaClient();

const SAMPLE_TRANSCRIPT = `Hello, thank you for calling ABC Financial Services. My name is Sarah. How can I help you today?

Hi Sarah, I'm calling about my credit card application. I submitted it last week and haven't heard back.

I understand your concern. Let me pull up your account. Can you please provide your application reference number?

Sure, it's REF-2024-7893.

Thank you. I see your application here. It looks like we need some additional documentation. We sent an email about this three days ago.

I never received that email. This is frustrating. I need this card for an upcoming trip.

I completely understand your frustration, and I apologize for any inconvenience. Let me help you resolve this right now. What documentation do you need?

We need proof of income - either recent pay stubs or a tax return from last year. Can you provide that?

Yes, I have my pay stubs. How can I submit them?

You can upload them through our secure portal, or I can email you a direct link right now. Which would you prefer?

The email link would be great, thank you.

Perfect. I'm sending that to you now. Once you upload the documents, your application will be reviewed within 24 hours. Is there anything else I can help you with today?

No, that's all. Thank you for your help, Sarah.

You're very welcome! Have a great day and safe travels on your trip.`;

async function main() {
  console.log("🌱 Seeding sample transcript...");

  const transcript = await prisma.transcript.create({
    data: {
      filename: "sample-call-success.txt",
      content: SAMPLE_TRANSCRIPT,
      durationSeconds: 180, // 3 minutes
      language: "en",
      status: "ready",
      wordTimestamps: null, // No timestamps for text-only
    },
  });

  console.log(`✅ Created transcript: ${transcript.id}`);
  console.log(`   Filename: ${transcript.filename}`);
  console.log(`   Status: ${transcript.status}`);
  console.log(`   Duration: ${transcript.durationSeconds}s`);
  console.log(`   Word count: ${transcript.content.split(/\s+/).length}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding transcript:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
