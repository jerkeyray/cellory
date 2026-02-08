/**
 * Add speaker labels to transcript using gpt-4o-mini
 * Cost: ~$0.0005 per transcript (one-time, not per chunk)
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Add Agent/Customer labels to transcript
 */
export async function addSpeakerLabels(rawTranscript: string): Promise<string> {
  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Add speaker labels to this financial call transcript. Label each line as "Agent:" or "Customer:".

Rules:
- Agent speaks first (greeting)
- Format: "Speaker: text"
- Keep exact wording
- One line per speaking turn
- No extra commentary

Transcript:
${rawTranscript}

Output format:
Agent: [text]
Customer: [text]`,
      temperature: 0,
      maxTokens: 2000,
    });

    return result.text;
  } catch (error) {
    console.error("Speaker labeling error:", error);
    // Fallback: return original with basic formatting
    return rawTranscript;
  }
}
