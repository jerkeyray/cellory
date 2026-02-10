/**
 * Normalize MAEC-style transcript text into Cellory import JSON.
 *
 * Usage:
 *   npx tsx scripts/normalize-maec.ts --input ./sample.md --output ./sample.normalized.json
 *   npx tsx scripts/normalize-maec.ts --input ./sample.txt --output ./sample.json --transcript-id maec-001 --infer-missing
 */

import fs from "node:fs/promises";
import path from "node:path";
import { parseSanitizedMarkdownTranscript } from "../app/lib/transcript-import";

interface Args {
  input?: string;
  output?: string;
  transcriptId?: string;
  source?: string;
  inferMissing: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { inferMissing: false };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--input") args.input = argv[++i];
    else if (token === "--output") args.output = argv[++i];
    else if (token === "--transcript-id") args.transcriptId = argv[++i];
    else if (token === "--source") args.source = argv[++i];
    else if (token === "--infer-missing") args.inferMissing = true;
  }

  return args;
}

function printUsageAndExit(): never {
  console.error(
    "Usage: npx tsx scripts/normalize-maec.ts --input <file> --output <file> [--transcript-id <id>] [--source <name>] [--infer-missing]"
  );
  process.exit(1);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input || !args.output) {
    printUsageAndExit();
  }
  const inputPath: string = args.input;
  const outputPath: string = args.output;

  const raw = await fs.readFile(inputPath, "utf8");
  const segments = parseSanitizedMarkdownTranscript(raw, {
    defaultSpeakerDurationSeconds: args.inferMissing ? 6 : 5,
    fallbackConfidence: 0.95,
  });

  const transcriptId =
    args.transcriptId ||
    path.basename(inputPath).replace(/\.[^.]+$/, "") ||
    `maec-${Date.now()}`;

  const normalized = {
    transcriptId,
    userId: "external",
    source: args.source || "maec_import",
    metadata: {
      inputFile: args.input,
      outputFile: outputPath,
      normalizedAt: new Date().toISOString(),
      inferredTimestamps: args.inferMissing,
    },
    segments,
  };

  await fs.writeFile(outputPath, JSON.stringify(normalized, null, 2), "utf8");
  console.log(`Wrote normalized transcript to ${outputPath}`);
  console.log(`Segments: ${segments.length}`);
}

main().catch((error) => {
  console.error("Failed to normalize transcript:", error);
  process.exit(1);
});
