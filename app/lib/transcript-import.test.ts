import { describe, expect, it } from "bun:test";
import {
  buildCsvExport,
  buildCsvExportFromTranscriptContent,
  buildMarkdownExport,
  buildNormalizedTranscriptExport,
  normalizedTranscriptSchema,
  parseSpeakerSentenceCsv,
  parseSanitizedMarkdownTranscript,
  prepareImportedTranscript,
} from "./transcript-import";

describe("normalized transcript import", () => {
  it("prepares imported transcripts and derives pipeline fields", () => {
    const payload = normalizedTranscriptSchema.parse({
      transcriptId: "maec-001",
      userId: "external",
      source: "maec_import",
      metadata: { language: "en" },
      segments: [
        { speaker: "Agent", start: 0, end: 5, text: "hello there", confidence: 0.9 },
        { speaker: "Customer", start: 5, end: 9, text: "thanks", confidence: 0.8 },
      ],
    });

    const prepared = prepareImportedTranscript(payload);

    expect(prepared.wordCount).toBeGreaterThan(0);
    expect(prepared.durationSeconds).toBe(9);
    expect(prepared.speakerCount).toBe(2);
    expect(prepared.avgConfidence).toBe(0.85);
    expect(prepared.content).toContain("Agent:");
    expect(prepared.content).toContain("Customer:");
    expect(prepared.wordTimestamps.length).toBeGreaterThan(0);
  });

  it("rejects overlapping segments", () => {
    const payload = normalizedTranscriptSchema.parse({
      transcriptId: "maec-overlap",
      segments: [
        { speaker: "Agent", start: 0, end: 4, text: "first" },
        { speaker: "Customer", start: 3.5, end: 6, text: "second" },
      ],
    });

    expect(() => prepareImportedTranscript(payload)).toThrow("Segment overlap");
  });

  it("parses sanitized markdown with inferred timings", () => {
    const markdown = `Agent: Hello there\nCustomer: I need help`;
    const segments = parseSanitizedMarkdownTranscript(markdown, {
      defaultSpeakerDurationSeconds: 4,
    });

    expect(segments).toHaveLength(2);
    expect(segments[0].start).toBe(0);
    expect(segments[0].end).toBe(4);
    expect(segments[1].start).toBe(4);
    expect(segments[1].end).toBe(8);
  });

  it("exports normalized json and markdown", () => {
    const normalized = buildNormalizedTranscriptExport({
      id: "t-123",
      userId: "u-123",
      source: "imported_normalized",
      importMetadata: { language: "en" },
      importedSegments: [
        { speaker: "Agent", start: 0, end: 3, text: "hello", confidence: 0.9 },
      ],
    });

    expect(normalized.transcriptId).toBe("t-123");
    const markdown = buildMarkdownExport(normalized);
    expect(markdown).toContain("[00:00-00:03] Agent: hello");

    const csv = buildCsvExport(normalized);
    expect(csv).toContain("Speaker,Start,End,Confidence,Sentence");
    expect(csv).toContain("Agent,0,3,0.9,hello");
  });

  it("parses person/sentence csv with quoted multiline rows", () => {
    const csv = `Person,Sentence
Person1,"I'm not in any way, shape or form."
Person2,"Good morning.
In part, we had strong sales in 2014."`;

    const segments = parseSpeakerSentenceCsv(csv);
    expect(segments).toHaveLength(2);
    expect(segments[0].speaker).toBe("Agent");
    expect(segments[1].speaker).toBe("Customer");
    expect(segments[1].text).toContain("strong sales");
    expect(segments[1].start).toBe(5);
    expect(segments[1].end).toBe(10);
  });

  it("builds csv export from speaker-labeled transcript content", () => {
    const content = `Agent: Hello there\nCustomer: Hi`;
    const csv = buildCsvExportFromTranscriptContent(content, 20);

    expect(csv).toContain("Speaker,Start,End,Confidence,Sentence");
    expect(csv).toContain("Agent,0,10,,Hello there");
    expect(csv).toContain("Customer,10,20,,Hi");
  });
});
