# Cellory Technical Documentation

Detailed technical reference for the Cellory financial audio intelligence platform.

---

## Architecture Overview

Cellory processes call recordings through a two-stage pipeline:

**Stage 1 — Preparation** (run once per recording):

```
Audio File → Whisper API → Speaker Diarization (gpt-4o-mini) → Stored Transcript
```

**Stage 2 — Intelligence Pipeline** (run per analysis):

```
Transcript → Chunk (75s windows) → Extract Markers (gpt-4o-mini) → Aggregate (deterministic) → Persist + Backboard
```

**Playbook Generation** (cross-call):

```
Success Aggregates + Failure Aggregates → Compare (deterministic) → Backboard RAG → Generate Playbook (gpt-4o)
```

Key design principles:
- LLM calls only where necessary (extraction and playbook generation)
- Aggregation and comparison are pure computation — deterministic, auditable, zero cost
- Backboard integration is non-blocking and fail-safe
- Cost discipline: gpt-4o-mini for extraction (~$0.0015/call), gpt-4o only for playbooks

---

## Pipeline Orchestration

**Entry point:** `app/lib/pipeline.ts`

### `processCall(callId: string): Promise<PipelineResult>`

Orchestrates the full analysis pipeline for a single call:

| Step | Function | LLM? | Description |
|------|----------|------|-------------|
| 1 | Validate | No | Fetch call + transcript, verify status is `ready` |
| 2 | `chunkTranscript()` | No | Split transcript into 75s windows with 10s overlap |
| 3 | `extractMarkersBatchV3()` | gpt-4o-mini | Extract behavioral markers per chunk |
| 4 | `mergeExtractionResultsV3()` | No | Combine chunk results, take final outcome prediction |
| 5 | Persist signals | No | Create `CallSignal` records in database |
| 6 | Auto-set outcome | No | Update `Call.outcome` from AI prediction |
| 7 | `aggregateSignalsV3()` | No | Compute deterministic features from markers |
| 8 | Persist aggregates | No | Create `CallAggregate` record |
| 9 | `sendToBackboard()` | No | Non-blocking memory write |
| 10 | Invalidate cache | No | Clear comparison cache for user |

### Status transitions

```
pending → extracting → aggregating → complete
                ↓ (on error at any step)
              error
```

### `processCallAsync(callId: string): Promise<void>`

Fire-and-forget wrapper. Called from POST `/api/calls` so the API returns immediately while the pipeline runs in the background.

### Return type

```typescript
interface PipelineResult {
  callId: string;
  status: "complete" | "error";
  signalCount: number;
  error?: string;
}
```

---

## Chunker

**File:** `app/lib/chunker.ts`

Splits transcripts into overlapping windows for signal extraction. Zero LLM calls.

### Constants

| Constant | Value | Rationale |
|----------|-------|-----------|
| `CHUNK_DURATION` | 75 seconds | Middle of 60–90s range; balances context vs token cost |
| `OVERLAP_DURATION` | 10 seconds | Preserves context continuity across chunk boundaries |
| `wordsPerChunk` (fallback) | 150 words | ~75s at ~2 words/sec typical speech rate |
| `overlapWords` (fallback) | 20 words | ~10s equivalent |

### `chunkTranscript(content, wordTimestamps?, duration?): Chunk[]`

Three modes, selected by available data:

1. **Word timestamps available** — Uses actual `{word, start, end}` data from Whisper. Filters words by time range per chunk. Most accurate.
2. **Duration available** — Estimates `wordsPerSecond = totalWords / duration`, then derives chunk boundaries. Good approximation.
3. **Neither** — Falls back to fixed 150-word chunks with 20-word overlap. Sets `startTime`/`endTime` to 0.

### Chunk type

```typescript
interface Chunk {
  chunkIndex: number;
  text: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
  wordCount: number;
}
```

### Cost estimation

```typescript
estimateProcessingCost(chunks): {
  chunkCount: number;
  estimatedInputTokens: number;   // ~1.3 tokens/word + 150 system prompt
  estimatedCostUSD: number;       // gpt-4o-mini: $0.15/1M input, $0.60/1M output
}
```

A typical 5-minute call produces ~4 chunks, costing ~$0.0015.

---

## Signal Extraction (V3)

**File:** `app/lib/signals-v3.ts`

Extracts decision-grade behavioral markers using gpt-4o-mini with structured output via Zod schemas. This is the primary extraction system.

### Model configuration

- **Model:** `gpt-4o-mini` (mandatory, cost discipline)
- **Temperature:** 0 (deterministic)
- **Output:** Zod-validated structured JSON

### Marker types

#### Customer Constraint

Identifies what's blocking the customer from proceeding.

```typescript
{
  type: "customer_constraint";
  constraint_type: "trust" | "capability" | "time" | "authority" | "risk" | "clarity";
  explicit: boolean;           // customer stated it directly
  severity: number;            // 0–1
  description: string;         // max 80 chars
  time: number;                // seconds into call
  confidence: number;          // 0–1
}
```

#### Agent Response Strategy

How the agent responds to constraints.

```typescript
{
  type: "agent_response_strategy";
  strategy: "acknowledge_limitation" | "reframe_scope" | "reduce_risk" |
            "defer_detail" | "transfer_authority" | "social_proof" | "push_commitment";
  target_constraint: string;   // describes the constraint being addressed
  description: string;         // max 80 chars
  time: number;
  confidence: number;
}
```

#### Control Dynamics

Who controls the conversation and when control shifts.

```typescript
{
  type: "control_dynamics";
  event: "agent_in_control" | "customer_in_control" | "control_shift" | "control_recovery";
  cause: string;
  description: string;         // max 80 chars
  time: number;
  confidence: number;
}
```

#### Commitment Quality

Measures the strength and timing of commitments made during the call.

```typescript
{
  type: "commitment_quality";
  commitment_type: "followup" | "payment" | "trial" | "demo";
  initiated_by: "agent" | "customer";
  reversibility: "low" | "medium" | "high";
  time_from_last_constraint: number;  // seconds
  description: string;                // max 80 chars
  time: number;
  confidence: number;
}
```

#### Auxiliary Metrics

Per-chunk metadata computed alongside markers.

```typescript
{
  predicted_outcome: "success" | "failure" | null;
  outcome_confidence: number | null;    // 0–1
  outcome_reasoning: string | null;     // max 150 chars
  call_tone: "neutral" | "tense" | "cooperative" | null;
}
```

### Key functions

**`extractMarkersV3(chunkText, startTime, endTime)`** — Extracts markers from a single chunk. Returns empty response on failure (no retries).

**`extractMarkersBatchV3(chunks)`** — Sequential processing with 100ms delay between chunks to avoid rate limits.

**`mergeExtractionResultsV3(results)`** — Concatenates markers from all chunks. Takes the last chunk's `predicted_outcome` (most context). Preserves `call_tone` from any chunk that detected one.

### Legacy versions

| Version | File | Marker types | Notes |
|---------|------|-------------|-------|
| V1 | `signals.ts` | objection, escalation, agreement, uncertainty, resolution_attempt | Original, simple taxonomy |
| V2 | `signals-v2.ts` | commitment_event, blocker_event, resolution_attempt, control_event, stall_event | Agent-trainable markers |
| V3 | `signals-v3.ts` | customer_constraint, agent_response_strategy, control_dynamics, commitment_quality | Decision-grade, current |

---

## Aggregator (V3)

**File:** `app/lib/aggregator-v3.ts`

Pure computation. Zero LLM calls. Converts extracted markers into a deterministic feature set for comparison.

### `aggregateSignalsV3(markers, auxiliaryMetrics): AggregateFeaturesV3`

#### Algorithm

1. Sort all markers by time
2. Partition by type: constraints, strategies, control events, commitments
3. Compute features per category (see below)

#### Output: `AggregateFeaturesV3`

```typescript
{
  schemaVersion: 3;

  // --- Constraints ---
  constraints_per_call: number;
  constraint_type_counts: Record<string, number>;  // e.g. {trust: 2, risk: 1}
  time_to_first_constraint: number | null;          // seconds
  explicit_constraint_ratio: number;                // 0–1
  avg_constraint_severity: number;                  // 0–1

  // --- Resolution ---
  agent_strategy_count_by_type: Record<string, number>;
  avg_resolution_latency: number | null;            // seconds from constraint to next strategy
  unresolved_constraint_count: number;              // constraints with no matching strategy

  // --- Control ---
  control_shifts: number;
  control_recoveries: number;
  control_recovery_before_commitment: boolean;
  agent_control_ratio: number;                      // 0–1

  // --- Commitments ---
  commitment_count: number;
  commitment_types: Record<string, number>;
  commitment_after_unresolved_constraint: boolean;  // RED FLAG
  avg_time_from_last_constraint: number | null;

  // --- Auxiliary ---
  predicted_outcome: string | null;
  outcome_confidence: number | null;
  call_tone: string | null;
}
```

#### Computed metrics detail

| Metric | Computation |
|--------|-------------|
| `avg_resolution_latency` | For each constraint, find the next strategy (by time). Average the time deltas. |
| `unresolved_constraint_count` | Constraints where no strategy follows before the next constraint or end of call. |
| `agent_control_ratio` | Count of `agent_in_control` events / total control events. |
| `control_recovery_before_commitment` | Last `control_recovery` timestamp < first `commitment_quality` timestamp. |
| `commitment_after_unresolved_constraint` | Any commitment exists AND unresolved constraints > 0. This is a red flag — committing before resolving concerns. |

### Legacy aggregator

**File:** `app/lib/aggregator.ts` — Produces `AggregateFeatures` with signal counts, density (signals/min), distribution by thirds (early/mid/late), confidence averages, and bigram sequences (e.g. `"objection→agreement": 3`).

---

## Comparator

**File:** `app/lib/comparator.ts`

Compares success vs failure aggregate distributions. Supports both V2 and V3 schemas with automatic detection.

### `compareOutcomes(successAggregates, failureAggregates)`

Auto-detects schema version by checking for `schemaVersion === 3` and routes accordingly.

Requirements: at least 1 success and 1 failure aggregate.

### V3 comparison

Computes `FeatureProfileV3` for each outcome group:

```typescript
interface FeatureProfileV3 {
  avg_constraints_per_call: number;
  avg_resolution_latency: number | null;
  control_recovery_before_commitment_rate: number;  // 0–1
  commitment_after_unresolved_rate: number;          // 0–1 (RED FLAG)
  avg_time_to_first_constraint: number | null;
  avg_constraint_severity: number;
  explicit_constraint_ratio: number;
  constraint_type_distribution: Record<string, number>;
  strategy_usage: Record<string, number>;
  avg_unresolved_constraints: number;
  control_shift_rate: number;
  control_recovery_rate: number;
  agent_control_ratio: number;
}
```

### Differentiator ranking

Each numeric feature is compared using **Cohen's d** (effect size):

```
d = |mean_success - mean_failure| / pooled_standard_deviation
significance = min(d / 0.8, 1.0)     // 0.8 = "large effect" threshold
```

Differentiators are sorted by significance descending. The top 5 feed into playbook generation.

```typescript
interface Differentiator {
  feature: string;
  successValue: number;
  failureValue: number;
  absoluteDiff: number;
  percentDiff: number;
  significance: number;   // 0–1, derived from Cohen's d
}
```

### Success-only mode

When no failure calls exist, `generateSuccessInsights()` produces a `SuccessInsights` profile from success calls only — constraint distributions, strategy usage rates, timing benchmarks, top patterns. This feeds into `generateSuccessPlaybook()`.

---

## Playbook Generator

**File:** `app/lib/playbook-generator.ts`

Generates coaching playbooks using gpt-4o. The most expensive LLM operation, used only at generation time (not per-call).

### Model configuration

- **Model:** `gpt-4o` (only operation that uses gpt-4o)
- **Temperature:** 0.3 (slightly creative but consistent)
- **No retries:** accepts first output

### `generatePlaybook(comparison): Promise<PlaybookResult>`

Requires at least 2 calls (1 success, 1 failure).

1. Query Backboard for historical context (3 success + 3 failure examples via RAG)
2. Build prompt with comparison data + historical examples
3. Call gpt-4o
4. Compute confidence scores
5. Return markdown playbook

### `generateSuccessPlaybook(insights): Promise<PlaybookResult>`

For success-only scenarios. Same flow but uses `SuccessInsights` instead of a comparison.

### Confidence scoring

```typescript
confidenceScores: {
  dataQuality: number;              // sigmoid: 2 calls → 0.1, 10 → 0.5, 50 → 0.9
  differentiationStrength: number;  // avg significance of top 5 differentiators
}
```

Data quality formula: `1 / (1 + exp(-0.15 * (totalCalls - 20)))`

### Playbook output format

The prompt enforces a specific markdown structure (defined in `notes/PLAYBOOK_FORMAT_SPEC.md`):

```markdown
# [Title]
[One-line subtitle]

## Core Success Principles
- **Principle 1** — explanation
- **Principle 2** — explanation

## Top Constraint Types & Winning Responses
### [Constraint Type] ([percentage]%)
- Primary winning strategy: **[strategy]**
- How to apply: [directive]
- Example phrasing: "[quote]"
- Expected outcome: [benchmark]

## Key Timing & Performance Benchmarks
- **Resolution latency**: [value]s (success) vs [value]s (failure)
- **Time to first constraint**: [value]s

## Control & Recovery Guidelines
- Proactive: [rule]
- Never: [anti-pattern]
- Must: [required behavior]

## Recommended Call Flow
1. **[Phase]** — [action + rationale]
2. **[Phase]** — [action + rationale]

## When to Escalate or Pivot
- If [condition] → [action]

## Data Notes
- Derived from: X success vs Y failure calls
- Confidence: [score]
```

**Formatting rules:**
- Bold for strategies, metrics, directive verbs
- Short bullets (1–2 lines max)
- Numbers spelled naturally for TTS: "eight point five seconds"
- Percentages in parentheses: (42% of cases)

---

## Backboard Integration

**File:** `app/lib/backboard.ts`

Optional persistent memory layer via [Backboard.io](https://backboard.io). Stores behavioral summaries per call and retrieves historical context for playbook generation via RAG.

### Architecture

- **One assistant**: "Cellory Intelligence" (lazy-created on first use)
- **Three threads**: one per outcome (`success`, `failure`, `unknown`)
- **Messages**: Behavioral summaries sent as user messages with `memory: Auto`

### Key functions

**`sendToBackboard(callId, outcome, markers, aggregates, transcriptContent)`**

Non-blocking. Builds a markdown behavioral summary and sends it to the outcome-specific thread.

Summary includes:
- Call metadata (outcome, timestamp)
- Key metrics (constraints, latency, control recovery, unresolved count)
- Constraint type breakdown
- Primary constraint details with severity
- Resolution strategies used
- Commitment details (type, initiator, reversibility)
- Red flags (commitment after unresolved constraint)
- Transcript preview (first 1500 chars)

**`queryBackboardForContext(outcome, limit): Promise<string[]>`**

RAG retrieval for playbook generation. Fetches recent messages from the outcome thread, filters for user-role messages (stored summaries), and returns up to `limit` results.

### Error handling

All Backboard operations are wrapped in try-catch. Failures are logged but never propagate — the pipeline completes normally without Backboard. Missing `BACKBOARD_API_KEY` causes early return with no error.

---

## Whisper Transcription

**File:** `app/lib/whisper.ts`

### `transcribeAudio(audioFile): Promise<TranscriptionResult>`

- **API:** OpenAI `/v1/audio/transcriptions`
- **Model:** `whisper-1`
- **Response format:** `verbose_json`
- **Granularity:** word-level timestamps
- **Cost:** ~$0.006/minute of audio

Returns:

```typescript
{
  text: string;
  duration: number;        // seconds
  language: string;
  wordTimestamps?: Array<{ word: string; start: number; end: number }>;
}
```

### `validateAudioFile(file): { valid: boolean; error?: string }`

| Constraint | Value |
|-----------|-------|
| Max file size | 25 MB |
| Allowed MIME types | `audio/wav`, `audio/mpeg`, `audio/m4a`, `audio/mp4` |
| Allowed extensions | `.wav`, `.mp3`, `.m4a`, `.mp4` |

---

## Speaker Diarization

**File:** `app/lib/diarization.ts`

### `addSpeakerLabels(rawTranscript): Promise<string>`

Adds `Agent:` and `Customer:` labels to raw transcript lines.

- **Model:** gpt-4o-mini
- **Temperature:** 0
- **Rules:** Agent speaks first (greeting). Keep exact wording. One line per turn.
- **Fallback:** Returns original transcript on LLM error.
- **Cost:** ~$0.0005 per transcript

---

## Database Schema

**File:** `prisma/schema.prisma`

### Enums

```
TranscriptStatus: processing | ready | error
CallOutcome:      success | failure
CallStatus:       pending | extracting | aggregating | complete | error
```

### Entity relationship diagram

```
User
 ├── Transcript[]
 │    └── Call[]
 │         ├── CallSignal[]
 │         ├── CallAggregate[]
 │         ├── CallTag[]
 │         └── CallNote[]
 └── Playbook[]
```

### Models

#### Transcript

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Primary key |
| `userId` | String | Owner |
| `filename` | String | Original upload filename |
| `content` | Text | Full transcript with speaker labels |
| `durationSeconds` | Int? | Audio duration |
| `wordTimestamps` | Json? | `Array<{word, start, end}>` from Whisper |
| `language` | String? | Detected language code |
| `qualityScore` | Float? | Transcription confidence proxy |
| `wordCount` | Int? | Pre-computed for display |
| `status` | TranscriptStatus | `processing` → `ready` or `error` |
| `createdAt` | DateTime | Upload time |

#### Call

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Primary key |
| `userId` | String | Owner |
| `transcriptId` | String | FK to Transcript |
| `outcome` | CallOutcome | `success` or `failure` (set by AI prediction) |
| `backboardThreadId` | String? | Backboard thread for this call |
| `status` | CallStatus | Pipeline progress indicator |
| `createdAt` | DateTime | Analysis start time |

#### CallSignal

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Primary key |
| `callId` | String | FK to Call |
| `chunkIndex` | Int | Which 75s chunk produced this signal |
| `signalType` | String | `customer_constraint`, `agent_response_strategy`, etc. |
| `signalData` | Json | Full marker object (typed by `signalType`) |
| `confidence` | Float | 0–1 extraction confidence |
| `startTime` | Float | Seconds into call |
| `endTime` | Float | Seconds into call (often same as startTime for point events) |

#### CallAggregate

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Primary key |
| `callId` | String | FK to Call |
| `features` | Json | `AggregateFeaturesV3` or legacy `AggregateFeatures` |
| `computedAt` | DateTime | When aggregation ran |

#### Playbook

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Primary key |
| `userId` | String | Owner |
| `title` | String | Generated title |
| `content` | Text | Markdown playbook body |
| `callCount` | Int | Number of calls used for generation |
| `confidenceScores` | Json? | `{dataQuality, differentiationStrength}` |
| `backboardDocumentId` | String? | Backboard document ID if stored |
| `createdAt` | DateTime | Generation time |

#### CallTag

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Primary key |
| `callId` | String | FK to Call |
| `name` | String | Tag label |
| `color` | String? | Hex color for display |
| `createdAt` | DateTime | |

#### CallNote

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (UUID) | Primary key |
| `callId` | String | FK to Call |
| `content` | Text | Free-form note |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

### Indexes

- `Call`: userId, transcriptId, (outcome + status)
- `Transcript`: userId
- `CallSignal`, `CallAggregate`, `CallTag`: callId
- `CallTag`: name

---

## API Routes

### POST `/api/transcripts/upload`

Upload an audio file for transcription.

- **Auth:** Required
- **Content-Type:** `multipart/form-data`
- **Body:** `audio` file field (max 25 MB)
- **Process:**
  1. Validate file type and size
  2. Create Transcript record (status: `processing`)
  3. Async: Whisper transcription → speaker diarization → word count → status: `ready`
- **Response:** `201 {id, filename, status, message}`
- **Errors:** Sets transcript status to `error` on failure

### GET `/api/transcripts`

List all transcripts for the authenticated user.

- **Auth:** Required
- **Response:** Array of transcripts with filename, status, duration, language, call count
- **Order:** `createdAt` desc

### GET `/api/transcripts/[id]`

Fetch a single transcript with its associated calls.

- **Auth:** Required (ownership verified)

### DELETE `/api/transcripts/[id]`

Delete a transcript and all associated calls (cascade).

- **Auth:** Required (ownership verified)

### POST `/api/calls`

Create a new call analysis from a transcript.

- **Auth:** Required
- **Body:** `{transcriptId: string}`
- **Validates:** Transcript exists, status is `ready`, belongs to user
- **Process:** Creates Call record, fires `processCallAsync()` (non-blocking)
- **Response:** `201 {id, outcome, status: "pending"}`

### GET `/api/calls`

List analyzed calls.

- **Auth:** Required
- **Query params:** `outcome` (optional filter: `success` | `failure`)
- **Response:** Array of calls with transcript filename, duration, signal count
- **Order:** `createdAt` desc

### GET `/api/calls/[id]`

Fetch a single call with transcript, signals, aggregates, tags, and notes.

- **Auth:** Required (ownership verified)

### POST `/api/calls/batch`

Batch-analyze multiple transcripts at once.

- **Auth:** Required
- **Body:** `{transcriptIds: string[]}`

### GET `/api/calls/export`

Export call data.

- **Auth:** Required

### POST `/api/calls/[id]/tags`

Add a tag to a call.

- **Auth:** Required
- **Body:** `{name: string, color?: string}`

### DELETE `/api/calls/[id]/tags/[tagId]`

Remove a tag from a call.

### POST `/api/calls/[id]/notes`

Add a note to a call.

- **Body:** `{content: string}`

### PUT `/api/calls/[id]/notes/[noteId]`

Update a note.

### DELETE `/api/calls/[id]/notes/[noteId]`

Delete a note.

### GET `/api/tags`

List all unique tags with usage counts.

- **Auth:** Required
- **Response:** Tags grouped by name/color, sorted by count desc

### GET `/api/compare`

Compare success vs failure outcomes.

- **Auth:** Required
- **Caching:** In-memory with 5-minute TTL per user
- **Headers:** `X-Cache: HIT` or `X-Cache: MISS`
- **Response:** `ComparisonResultV3` with differentiators and profiles

### POST `/api/playbooks`

Generate a new coaching playbook.

- **Auth:** Required
- **Body:** `{mode?: string}` (optional)
- **Logic:**
  - If both success AND failure calls exist → comparative playbook
  - If only success calls exist → success-only playbook
  - Otherwise → 400 error
- **Response:** Playbook record with title, content, confidence scores

### GET `/api/playbooks`

List generated playbooks.

- **Auth:** Required
- **Query params:** `limit` (default 50), `offset` (default 0)
- **Response:** Paginated playbooks + total count

### GET `/api/playbooks/[id]`

Fetch a single playbook.

### DELETE `/api/playbooks/[id]`

Delete a playbook.

---

## Authentication

**File:** `auth.ts`

| Setting | Value |
|---------|-------|
| Provider | Google OAuth |
| Adapter | Prisma (database sessions) |
| Session strategy | Database (not JWT) |
| Session max age | 30 days |
| Session update age | 24 hours |
| Custom page | `/auth/signin` |
| Trust host | `true` (for Vercel deployment) |

The session callback injects `user.id` into the session object so it's available client-side.

---

## Comparison Cache

**File:** `app/lib/comparison-cache.ts`

In-memory cache for comparison results. Prevents recomputation on every page load.

| Setting | Value |
|---------|-------|
| TTL | 5 minutes |
| Key format | `comparison_${userId}` |
| Invalidation | On new call processing, or manual |

Functions:
- `getCachedComparison(userId)` — Returns cached data if within TTL, else null
- `setCachedComparison(userId, data)` — Stores result with timestamp
- `invalidateComparisonCache(userId?)` — Clears for specific user or all users

---

## Cost Model

| Operation | Model | Cost | Frequency |
|-----------|-------|------|-----------|
| Transcription | Whisper | ~$0.006/min audio | Once per recording |
| Speaker labels | gpt-4o-mini | ~$0.0005 | Once per transcript |
| Marker extraction | gpt-4o-mini | ~$0.0012/chunk | ~4 chunks per 5-min call |
| Aggregation | None | $0 | Pure computation |
| Comparison | None | $0 | Pure computation |
| Playbook generation | gpt-4o | ~$0.01–0.03 | Once per generation |

**Total per 5-minute call (extraction only):** ~$0.0015

---

## Error Handling Patterns

| Layer | Strategy |
|-------|----------|
| Pipeline | Catches all errors, marks call `status: error`, logs |
| Backboard | Non-blocking try-catch; failures logged, never propagated |
| Transcription | Catches, marks transcript `status: error` |
| API routes | Returns appropriate HTTP status (400/401/500) with error message |
| LLM calls | Returns empty results on failure; no automatic retries |
