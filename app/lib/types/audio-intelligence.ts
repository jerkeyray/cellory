/**
 * Audio Intelligence Types
 * TypeScript interfaces for audio metadata, quality scoring, diarization, and NLU
 */

// ============================================================================
// Audio Metadata
// ============================================================================

export interface AudioMetadata {
  format: string;        // e.g., "MP3", "WAV", "M4A"
  sampleRate: number;    // Hz (e.g., 44100, 48000)
  channels: number;      // 1 = mono, 2 = stereo
  bitrate: number;       // bits per second
}

// ============================================================================
// Whisper Segments
// ============================================================================

export interface WhisperSegment {
  start: number;              // Segment start time in seconds
  end: number;                // Segment end time in seconds
  text: string;               // Transcribed text for this segment
  avg_logprob: number;        // Average log probability (-2 to 0, higher is better)
  no_speech_prob: number;     // Probability of no speech (0-1, lower is better)
  compression_ratio: number;  // Text compression ratio (1.0-3.0 is good)
}

// ============================================================================
// Audio Quality Scoring
// ============================================================================

export type QualityFlag =
  | "low_confidence"      // avg_logprob < -1.0
  | "high_noise"          // no_speech_prob > 0.6
  | "poor_compression"    // compression_ratio outside [1.0, 3.0]
  | "short_duration"      // < 30 seconds
  | "low_sample_rate";    // < 16000 Hz

export interface AudioQualityScore {
  overall: number;           // Overall score 0-1 (weighted combination)
  confidence: number;        // Derived from avg_logprob (0-1)
  speechRatio: number;       // 1 - avg(no_speech_prob) (0-1)
  compressionHealth: number; // Quality of compression_ratio (0-1)
  flags: QualityFlag[];      // Array of quality issues detected
}

// ============================================================================
// Structured Diarization
// ============================================================================

export interface DiarizationSegment {
  speaker: "Agent" | "Customer";
  text: string;
  start: number;  // Start time in seconds
  end: number;    // End time in seconds
}

// ============================================================================
// NLU Results
// ============================================================================

export interface IntentClassification {
  intent:
    | "payment_arrangement"
    | "dispute"
    | "information_request"
    | "callback_request"
    | "escalation"
    | "compliance_concern"
    | "settlement_offer";
  speaker: "Agent" | "Customer";
  description: string;
  time: number;
  confidence: number;
}

export interface ObligationDetection {
  obligation_type:
    | "promise_to_pay"
    | "callback_commitment"
    | "document_provision"
    | "escalation_promise"
    | "review_commitment";
  obligor: "Agent" | "Customer";
  deadline: string | null;  // Extracted text or null
  description: string;
  time: number;
  confidence: number;
}

export interface RegulatoryPhrase {
  regulation_type:
    | "mini_miranda"
    | "fdcpa_disclosure"
    | "recording_notice"
    | "cease_communication"
    | "dispute_rights"
    | "validation_notice";
  present: boolean;
  verbatim: string;  // Exact text found (or expected text if missing)
  time: number | null;
  confidence: number;
}

export interface EntityMention {
  entity_type:
    | "amount"
    | "date"
    | "account_number"
    | "phone_number"
    | "reference_number";
  value: string;  // Extracted value
  time: number;
  confidence: number;
}

export interface NLUResults {
  intents: IntentClassification[];
  obligations: ObligationDetection[];
  regulatory_phrases: RegulatoryPhrase[];
  entities: EntityMention[];
}
