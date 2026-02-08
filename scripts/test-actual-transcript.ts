/**
 * Test extraction on actual Nissan transcript
 */

import { extractMarkersBatch, mergeExtractionResults } from "@/app/lib/signals-v2";
import { chunkTranscript } from "@/app/lib/chunker";

const TRANSCRIPT = `Agent: Thank you for calling Nissan. My name is Lauren. Can I have your name?
Customer: Yeah. My name is John Smith.
Agent: Thank you, John. How can I help you?
Customer: I was just calling about to see how much it would cost to update the map in my car.
Agent: I'd be happy to help you with that today. Did you receive a mailer from us?
Customer: I did. Do you need the customer number?
Agent: Yes, please.
Customer: Okay. It's 1-5-2-4-3.
Agent: Thank you. And the year, make, and model of your vehicle?
Customer: Yeah. I have a 2009 Nissan Altima.
Agent: Oh, nice car.
Customer: Yeah. Thank you. We really enjoy it.
Agent: Okay. I think I found your profile here. Can I have you verify your address and phone number, please?
Customer: Yes. It's 1255 North Research Way. That's in Orem, Utah, 84097. And my phone number is 801-431-1000.
Agent: Okay. Thanks, John. I located your information. The newest version we have available for your vehicle is version 7.7, which was released in March of 2012. The price of the new map is $99 plus shipping and tax. Let me go ahead and set up this order for you.
Customer: Well, can we wait just a second? I'm not really sure if I can afford it right now.
Agent: All right. Well, here are a few reasons to consider purchasing today. It looks as though you haven't updated your vehicle for three years. So that would be, you know, if you're going to be using it for a long period of time.
Agent: The price of one.
Customer: Oh, okay.
Agent: In addition, special offers like the current promotion don't come around too often. I would definitely recommend taking advantage of the extra $50 off before it expires.
Customer: Yeah. That does sound pretty good.
Agent: If I set this order up for you now, it'll ship out today and for $50 less. Do you have your credit card handy? And I can place this order for you now.
Customer: Yeah. Let's, uh, you know, let's, let's go ahead and use a Visa.
Agent: Okay. Thank you.
Customer: You're welcome.`;

async function main() {
  console.log("Chunking transcript...");
  const chunks = chunkTranscript(TRANSCRIPT, null, 180); // Assume 3 min duration
  console.log(`Created ${chunks.length} chunks\n`);

  console.log("Extracting markers...");
  const results = await extractMarkersBatch(chunks);
  const merged = mergeExtractionResults(results);

  console.log(`\nExtracted ${merged.agent_markers.length} markers:`);
  console.log(JSON.stringify(merged.agent_markers, null, 2));

  console.log("\nAuxiliary Metrics:");
  console.log(JSON.stringify(merged.auxiliary_metrics, null, 2));
}

main().catch(console.error);
