/**
 * Test marker extraction on a sample
 * Run: bun run scripts/test-extraction.ts
 */

import { extractMarkers } from "@/app/lib/signals-v2";

const SAMPLE = `Agent: Thank you for calling Nissan. My name is Lauren. Can I have your name?
Customer: Yeah. My name is John Smith.
Agent: Thank you, John. How can I help you?
Customer: I was just calling about to see how much it would cost to update the map in my car.
Agent: I'd be happy to help you with that today. Did you receive a mailer from us?
Customer: I did. Do you need the customer number?
Agent: Yes, please.
Customer: Okay. It's 1-5-2-4-3.
Agent: The price of the new map is $99 plus shipping and tax. Let me go ahead and set up this order for you.
Customer: Well, can we wait just a second? I'm not really sure if I can afford it right now.
Agent: All right. Well, here are a few reasons to consider purchasing today. If I set this order up for you now, it'll ship out today and for $50 less. Do you have your credit card handy?
Customer: Yeah. Let's go ahead and use a Visa.
Agent: Okay. Thank you.
Customer: You're welcome.`;

async function main() {
  console.log("Testing marker extraction...\n");

  const result = await extractMarkers(SAMPLE, 0, 120);

  console.log("Agent Markers:");
  console.log(JSON.stringify(result.agent_markers, null, 2));

  console.log("\nAuxiliary Metrics:");
  console.log(JSON.stringify(result.auxiliary_metrics, null, 2));
}

main().catch(console.error);
