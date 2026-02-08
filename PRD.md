# Cellory — Product Requirements Document

## Context

Companies adopting AI agents for financial calls (collections, support, sales) lose access to years of historical human call recordings because that data is unstructured and incompatible with agent-based systems. Cellory bridges this gap by converting legacy call audio into structured, reusable intelligence that modern AI agents can act on.

Built for the **Hotfoot AI Challenge 1: Financial Audio Intelligence** hackathon track.

---

## 1. Problem

When organizations move from human callers to AI agents, historical call recordings become dead weight — unstructured audio that agents can't learn from. There's no reliable way to retroactively extract structured, actionable intelligence from legacy calls.

## 2. Solution

Cellory processes historical financial call recordings through a two-stage architecture:

**Stage 1 — Transcription** (separate, offline): Audio → timestamped transcript. Done once, ahead of time.

**Stage 2 — Intelligence** (main product): Transcript → structured signals → deterministic aggregation → outcome comparison → agent playbook → persistent memory.

By separating transcription from intelligence, the core pipeline starts from text, runs fast, and is demo-safe.

---

## 3. Architecture: Two Interfaces

### Interface 1: Transcription Tool (Prep/Admin)

**Purpose**: Convert audio files into transcripts. Run separately, before the main workflow.

- Upload audio file
- Run OpenAI Whisper STT
- Save transcript with timestamps
- Mark as "ready"

This is a utility — minimal UI, could even be a script. Used to prepare data before the intelligence pipeline. Removes audio upload latency, flaky network issues, and long STT waits from the main product experience.

### Interface 2: Intelligence Pipeline (Main Product)

**Purpose**: Transform transcripts into structured, agent-consumable intelligence.

- Select existing transcript
- Assign outcome label (success / failure)
- Run extraction → aggregation pipeline (fast, starts from text)
- Compare outcomes across calls
- Generate playbook
- Persist to Backboard for compounding memory

This is where the product value lives. Because it starts from text, it's fast and nearly synchronous.

---

## 4. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS | Fast to build, SSR, good DX |
| **Backend** | Next.js API Routes + Server Actions | Unified codebase, no separate server |
| **Database** | Neon Postgres + Prisma ORM | Serverless Postgres, mature ORM with migrations, introspection, and Prisma Studio |
| **STT** | OpenAI Whisper API (`whisper-1`) | Simple, reliable, via OpenAI SDK |
| **LLM** | OpenAI GPT-4o (via OpenAI SDK) | Structured outputs, JSON mode |
| **Memory** | Backboard AI | Persistent memory, document RAG, cross-session intelligence |
| **Deployment** | Vercel | Native Next.js support, serverless |

### Key SDK/API Details

**OpenAI SDK** — single SDK for both STT and LLM:
- `openai.audio.transcriptions.create()` — Whisper transcription (Interface 1 only)
- `openai.chat.completions.create()` with `response_format: { type: "json_schema" }` — structured extraction
- `openai.chat.completions.create()` — playbook generation

**Backboard AI** (`https://app.backboard.io/api`, auth via `X-API-Key` header):

Backboard is the **cross-call memory layer**. While Postgres stores per-call structured data (signals, aggregates), Backboard stores *intelligence that compounds over time* — insights the system learns from analyzing many calls. Without it, every playbook generation starts from scratch. With it, the system remembers patterns from all prior calls and produces increasingly better playbooks.

- **Assistants** — a single Cellory assistant with a financial-call-analysis system prompt. Created once, reused across all calls.
- **Threads** — one thread per processed call. Holds the call's transcript + analysis as conversational context so Backboard can reason about it.
- **Documents** — transcripts and generated playbooks uploaded for RAG retrieval. When generating a new playbook, Backboard can pull relevant sections from past playbooks and raw transcripts.
- **Memories** — the key differentiator. When a message is sent with `memory: "Auto"`, Backboard auto-extracts facts (e.g., "customers who mention hardship early are 3x more likely to settle") and stores them permanently. These memories surface automatically in future threads without re-processing old calls.
- **Messages** — the interface for sending analysis requests. Each message can leverage the full memory store, meaning the 50th call's playbook benefits from insights extracted from calls 1–49.

**Where Backboard plugs into the pipeline:**
| Pipeline Step | Backboard Role |
|--------------|----------------|
| Step 5 (after aggregation) | Create thread, upload transcript as document, send structured summary → memories auto-extracted |
| Step 7 (playbook generation) | Query assistant with outcome comparison data → Backboard injects relevant memories from all prior calls into the LLM context → richer playbook |
| Post-playbook | Upload generated playbook as document → available for future RAG retrieval |

---

## 5. Data Model (Neon Postgres via Prisma)

### `transcripts`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Transcript identifier |
| `filename` | text | Original audio filename |
| `content` | text | Full transcript text |
| `duration_seconds` | integer | Call duration |
| `word_timestamps` | jsonb | Word-level timing data from Whisper |
| `status` | enum('processing', 'ready', 'error') | Transcription status |
| `created_at` | timestamp | Upload time |

### `calls`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Call identifier |
| `transcript_id` | uuid (FK → transcripts) | Source transcript |
| `outcome` | enum('success', 'failure') | Externally provided label |
| `backboard_thread_id` | uuid | Linked Backboard thread |
| `status` | enum('pending', 'extracting', 'aggregating', 'complete', 'error') | Pipeline status |
| `created_at` | timestamp | When call was submitted for analysis |

### `call_signals`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Signal identifier |
| `call_id` | uuid (FK → calls) | Parent call |
| `chunk_index` | integer | Which transcript chunk |
| `signal_type` | text | e.g. "objection", "rapport_building", "closing_attempt" |
| `signal_data` | jsonb | Structured extraction result |
| `confidence` | float | LLM confidence score (0-1) |
| `start_time` | float | Position in transcript |
| `end_time` | float | Position in transcript |

### `call_aggregates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Aggregate identifier |
| `call_id` | uuid (FK → calls) | Parent call |
| `features` | jsonb | Deterministic aggregated features |
| `computed_at` | timestamp | When aggregation ran |

### `playbooks`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Playbook identifier |
| `title` | text | Playbook name |
| `content` | text | Markdown playbook content |
| `call_count` | integer | Number of calls analyzed |
| `confidence_scores` | jsonb | Per-section confidence |
| `backboard_document_id` | uuid | Stored in Backboard for RAG |
| `created_at` | timestamp | Generation time |

---

## 6. Processing Pipeline

### Interface 1: Transcription (Separate)

**Step T1: Upload Audio**
- Upload audio file (WAV, MP3, M4A, etc.)
- Create `transcripts` row with status `processing`

**Step T2: Transcribe (OpenAI Whisper)**

```
openai.audio.transcriptions.create({
  model: "whisper-1",
  file: audioFile,
  response_format: "verbose_json",  // word-level timestamps
})
```

- Store transcript text + word timestamps
- Update status → `ready`

This can be a simple admin page or a CLI script. Pre-run before demo.

---

### Interface 2: Intelligence Pipeline (Main Product)

**Step 1: Submit Call**
- User selects a transcript (status: `ready`) from dropdown
- User assigns outcome label: success or failure
- Create `calls` row linked to transcript

**Step 2: Chunking (Deterministic)**
- Segment transcript into ~60-second chunks with overlap
- Use word timestamps for precise boundaries
- Attach metadata: call_id, chunk_index, start/end position
- Pure server-side logic, no LLM

**Step 3: Signal Extraction (GPT-4o)**
- Update call status → `extracting`
- For each chunk, call GPT-4o with strict JSON schema:

```json
{
  "signals": [
    {
      "signal_type": "objection | rapport_building | closing_attempt | payment_discussion | escalation | compliance_mention | sentiment_shift",
      "description": "brief description of what happened",
      "speaker": "agent | customer",
      "confidence": 0.85
    }
  ]
}
```

- Use `response_format: { type: "json_schema", json_schema: { ... } }` for guaranteed structure
- Store each signal in `call_signals`
- Allow empty `signals: []` when chunk has no relevant content

**Step 4: Aggregation (Deterministic)**
- Update call status → `aggregating`
- Pure computation, no LLM:
  - Count of each signal type
  - Timing distribution (when signals appear in call timeline)
  - Speaker ratio (agent vs customer signals)
  - Average confidence per signal type
  - Sequence patterns (e.g., objection → resolution)
- Store in `call_aggregates`
- Update call status → `complete`

**Step 5: Backboard Persistence**
- Create/reuse a Backboard assistant for Cellory
- Create a thread for this call
- Upload transcript as a document to the thread
- Send structured summary as a message with `memory: "Auto"`
  - Backboard auto-extracts key facts and stores them as memories
  - These memories are retrievable across all future threads

**Step 6: Outcome Comparison** (triggered separately, across multiple calls)
- Group `call_aggregates` by outcome
- Compute deltas between success/failure groups:
  - Which signals appear more in successes vs failures?
  - Timing differences (when in the call do key events happen?)
  - Sequence differences
- All deterministic computation — no LLM

**Step 7: Playbook Generation**
- Query Backboard with `memory: "Auto"` to retrieve cross-call memories
- Send outcome comparison data + retrieved memories to GPT-4o
- Generate markdown playbook:
  - High-level behavioral guidance
  - Common failure modes
  - Recommended strategies
  - Confidence indicators per section
- Store in `playbooks` table
- Upload to Backboard as a document for future RAG retrieval

---

## 7. API Routes

### Transcription (Interface 1)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/transcripts/upload` | POST | Upload audio file, start transcription |
| `/api/transcripts` | GET | List all transcripts with status |
| `/api/transcripts/[id]` | GET | Get transcript content + status |

### Intelligence (Interface 2)

| Route | Method | Description |
|-------|--------|-------------|
| `/api/calls` | POST | Submit transcript for analysis with outcome label |
| `/api/calls` | GET | List all analyzed calls |
| `/api/calls/[id]` | GET | Get call with signals + aggregates |
| `/api/calls/[id]/process` | POST | Trigger extraction → aggregation pipeline |
| `/api/analysis/compare` | POST | Run outcome comparison across calls |
| `/api/playbooks/generate` | POST | Generate playbook from analyzed calls |
| `/api/playbooks` | GET | List generated playbooks |
| `/api/playbooks/[id]` | GET | Get specific playbook |

---

## 8. Frontend Pages

### Transcription Interface

| Route | Description |
|-------|-------------|
| `/transcribe` | Upload audio, see transcription status, list ready transcripts |

### Intelligence Interface (Main)

| Route | Description |
|-------|-------------|
| `/` | Dashboard — submit transcripts for analysis, see pipeline status |
| `/calls` | List of all analyzed calls with status indicators |
| `/calls/[id]` | Call detail: transcript, extracted signals, aggregated features |
| `/analysis` | Outcome comparison — success vs failure pattern deltas |
| `/playbooks` | List of generated playbooks |
| `/playbooks/[id]` | Full playbook view with confidence indicators |

Minimal UI — Tailwind CSS, no component library. Focus on:
- Clean transcript selector + outcome label picker
- Status indicators for pipeline progress
- Signal visualization (timeline or table)
- Markdown rendering for playbooks

---

## 9. Project Structure

```
cellory/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard (submit calls)
│   │   ├── transcribe/
│   │   │   └── page.tsx          # Transcription tool
│   │   ├── calls/
│   │   │   ├── page.tsx          # Call list
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Call detail
│   │   ├── analysis/
│   │   │   └── page.tsx          # Outcome comparison
│   │   ├── playbooks/
│   │   │   ├── page.tsx          # Playbook list
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Playbook detail
│   │   └── api/
│   │       ├── transcripts/
│   │       │   ├── upload/route.ts
│   │       │   └── [id]/route.ts
│   │       ├── calls/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── process/route.ts
│   │       ├── analysis/
│   │       │   └── compare/route.ts
│   │       └── playbooks/
│   │           ├── route.ts
│   │           ├── generate/route.ts
│   │           └── [id]/route.ts
│   ├── lib/
│   │   ├── openai.ts             # OpenAI client init
│   │   ├── backboard.ts          # Backboard API client
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── pipeline/
│   │   │   ├── transcribe.ts     # Whisper transcription
│   │   │   ├── chunk.ts          # Transcript chunking (deterministic)
│   │   │   ├── extract.ts        # Signal extraction (GPT-4o)
│   │   │   ├── aggregate.ts      # Deterministic aggregation
│   │   │   ├── compare.ts        # Outcome comparison logic
│   │   │   └── playbook.ts       # Playbook generation
│   │   └── types.ts              # Shared TypeScript types
│   └── components/
│       ├── transcript-upload.tsx  # Audio upload form
│       ├── call-submit-form.tsx   # Transcript selector + outcome picker
│       ├── call-list.tsx          # Call table with status
│       ├── signal-table.tsx       # Extracted signals display
│       ├── comparison-view.tsx    # Success vs failure deltas
│       ├── playbook-viewer.tsx    # Markdown playbook renderer
│       └── status-badge.tsx       # Pipeline status indicator
├── prisma/
│   └── schema.prisma             # Prisma schema (models, enums, relations)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local
```

---

## 10. Environment Variables

```
OPENAI_API_KEY=            # OpenAI API key (Whisper + GPT-4o)
BACKBOARD_API_KEY=         # Backboard AI API key
DATABASE_URL=              # Neon Postgres connection string
```

---

## 11. Implementation Order

### Phase 1: Foundation (scaffold + data layer)

**1. Project scaffold**
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router, `src/` directory
- Install dependencies: `prisma`, `@prisma/client`, `openai`, `@neondatabase/serverless`
- Create `.env.local` with `DATABASE_URL`, `OPENAI_API_KEY`, `BACKBOARD_API_KEY`
- Add `.env.local` to `.gitignore`

**2. Prisma schema + database**
- Write `prisma/schema.prisma` with all five models (`Transcript`, `Call`, `CallSignal`, `CallAggregate`, `Playbook`) and their enums
- Configure the Neon datasource with `provider = "postgresql"`
- Run `npx prisma db push` to sync schema to Neon (or `npx prisma migrate dev` for migration history)
- Create `src/lib/prisma.ts` — singleton Prisma client (avoids hot-reload connection exhaustion in dev)

**3. Client setup**
- `src/lib/openai.ts` — instantiate `new OpenAI()` with `OPENAI_API_KEY`
- `src/lib/backboard.ts` — thin wrapper around `fetch()` for Backboard REST API, handling auth header and base URL
- `src/lib/types.ts` — shared TypeScript types for signal schemas, pipeline inputs/outputs, API request/response shapes

**Checkpoint**: `npx prisma studio` shows empty tables, `npm run dev` boots without errors.

---

### Phase 2: Transcription Interface (audio → text)

**4. Whisper integration** (`src/lib/pipeline/transcribe.ts`)
- Accept a `File` or `Buffer`, call `openai.audio.transcriptions.create()` with `response_format: "verbose_json"`
- Parse response into `{ text, words: { word, start, end }[] }`
- Return structured result ready for DB insert

**5. Transcript upload API + UI**
- `POST /api/transcripts/upload` — accept `multipart/form-data`, create `Transcript` row (status: `processing`), call transcribe function, update row (status: `ready` or `error`)
- `GET /api/transcripts` — return all transcripts ordered by `created_at` desc
- `GET /api/transcripts/[id]` — return single transcript with content
- `/transcribe` page — file upload form, list of transcripts with status badges, click to preview content

**Checkpoint**: Upload a test `.wav` file, see it appear as "ready" with full transcript text and word-level timestamps.

---

### Phase 3: Core Intelligence Pipeline (text → structured signals → aggregates)

**6. Chunking** (`src/lib/pipeline/chunk.ts`)
- Input: transcript content + word timestamps
- Logic: walk the word timestamps, split into chunks at ~60-second boundaries. Include 5-second overlap between chunks to avoid cutting mid-sentence.
- Output: `{ chunkIndex, text, startTime, endTime }[]`
- Pure function, no external calls, fully deterministic

**7. Signal extraction** (`src/lib/pipeline/extract.ts`)
- Input: a single chunk `{ text, startTime, endTime }`
- Call `openai.chat.completions.create()` with:
  - System prompt describing financial call analysis context
  - The chunk text as user content
  - `response_format: { type: "json_schema", json_schema: { strict: true, schema: ... } }` enforcing the signal array structure
- Output: `{ signals: Signal[] }` — may be empty for uneventful chunks
- Each signal has: `signal_type`, `description`, `speaker`, `confidence`

**8. Aggregation** (`src/lib/pipeline/aggregate.ts`)
- Input: all `CallSignal` rows for a call
- Compute:
  - `signal_counts`: `{ [signal_type]: number }`
  - `timing_distribution`: `{ [signal_type]: { mean_position: number, first: number, last: number } }` (normalized 0–1 within call duration)
  - `speaker_ratio`: `{ agent: number, customer: number }` (fraction of signals per speaker)
  - `avg_confidence`: `{ [signal_type]: number }`
  - `sequence_patterns`: detect common two-signal sequences (e.g., objection → closing_attempt) and count them
- Output: single JSON object stored in `call_aggregates.features`
- Pure computation, no LLM

**9. Call submission API + processing trigger**
- `POST /api/calls` — accept `{ transcript_id, outcome }`, create `Call` row (status: `pending`)
- `POST /api/calls/[id]/process` — orchestrates the full pipeline:
  1. Fetch transcript content + timestamps
  2. Chunk the transcript
  3. Update status → `extracting`, run extraction on all chunks (can parallelize with `Promise.all`), save `CallSignal` rows
  4. Update status → `aggregating`, run aggregation, save `CallAggregate` row
  5. Update status → `complete`
  6. If any step throws, update status → `error`
- `GET /api/calls` — list all calls with status, outcome, linked transcript filename
- `GET /api/calls/[id]` — return call + all signals + aggregate

**10. Call detail page** (`/calls/[id]`)
- Show transcript text
- Signal table: type, description, speaker, confidence, timestamp — sortable/filterable
- Aggregate summary: signal counts, speaker ratio, timing chart (or simple table)
- Status badge showing pipeline progress

**Checkpoint**: Submit a ready transcript with outcome "success", trigger processing, see signals and aggregates populate on the call detail page.

---

### Phase 4: Analysis & Playbooks (cross-call intelligence)

**11. Outcome comparison** (`src/lib/pipeline/compare.ts`)
- Input: all calls with status `complete`
- Group aggregates by outcome (success vs failure)
- For each signal type, compute:
  - Average count in success calls vs failure calls
  - Delta (success - failure) — positive means "appears more in successes"
  - Average timing position in success vs failure
- For sequence patterns: which sequences correlate with which outcome
- Output: `{ signal_deltas, timing_deltas, sequence_correlations, success_count, failure_count }`
- `POST /api/analysis/compare` — run comparison, return results (stateless, computed on-demand)

**12. Playbook generation** (`src/lib/pipeline/playbook.ts`)
- Input: outcome comparison results + (optionally) Backboard memories
- Build a detailed prompt including:
  - The numeric comparison data
  - Instructions to generate actionable guidance for AI agents handling financial calls
  - Sections: overview, key success patterns, common failure modes, recommended strategies, timing guidance
- Call `openai.chat.completions.create()` — unstructured markdown output
- Parse response, assign confidence scores per section based on sample size and signal confidence
- `POST /api/playbooks/generate` — run generation, save to `playbooks` table, return result
- `GET /api/playbooks` + `GET /api/playbooks/[id]` — list and retrieve

**13. Analysis + playbook pages**
- `/analysis` — trigger comparison, show success vs failure deltas as a table or bar chart, highlight statistically significant differences
- `/playbooks` — list generated playbooks with title, call count, date
- `/playbooks/[id]` — full markdown render with per-section confidence badges

**Checkpoint**: Process 3+ success and 3+ failure calls, run comparison, see meaningful deltas. Generate a playbook, verify it references the comparison data.

---

### Phase 5: Backboard Integration (persistent cross-call memory)

This phase upgrades the pipeline from "stateless analysis" to "compounding intelligence." Before Backboard, each playbook generation only sees the calls in the current comparison. After Backboard, it also sees insights extracted from every prior analysis.

**14. Backboard client** (`src/lib/backboard.ts`)
- `createAssistant(name, systemPrompt)` → returns `assistant_id` (idempotent — check if exists first)
- `createThread(assistantId, metadata)` → returns `thread_id`
- `uploadDocument(threadId, content, filename)` → returns `document_id`
- `sendMessage(threadId, content, options: { memory: "Auto" })` → returns response + any extracted memories
- `getMemories(assistantId)` → returns all stored memories
- All methods are thin `fetch()` wrappers with error handling

**15. Wire Backboard into the pipeline**
- After Step 4 (aggregation complete), add Step 5:
  - Create a thread for this call (store `backboard_thread_id` on `calls` row)
  - Upload the transcript as a document
  - Send a structured message summarizing: outcome, signal counts, top signals, aggregate features
  - `memory: "Auto"` ensures Backboard extracts and stores key facts
- This happens automatically as part of `POST /api/calls/[id]/process`

**16. Memory-aware playbook generation**
- Before generating a playbook, query Backboard for all stored memories
- Inject retrieved memories into the GPT-4o prompt alongside the comparison data
- The playbook now benefits from patterns noticed in prior calls, not just the current batch
- After generation, upload the playbook to Backboard as a document — future playbook generations can reference past ones via RAG

**Checkpoint**: Process several calls, verify Backboard memories accumulate. Generate two playbooks — the second should reference or build on insights from the first batch of calls.

---

### Phase 6: Polish (dashboard + UX)

**17. Dashboard page** (`/`)
- Summary stats: total transcripts, calls processed, success/failure split
- Quick actions: upload audio, submit call, run comparison, generate playbook
- Recent activity: last 5 calls with status, last playbook generated

**18. Error handling + loading states**
- Loading skeletons for all data-fetching pages
- Error boundaries with retry buttons
- Toast notifications for pipeline completion/failure
- Disable buttons while processing is in-flight
- Responsive layout (works on tablet for demo)

---

## 12. Verification

- **Transcription**: Upload a test audio file via `/transcribe`, verify transcript with timestamps appears
- **Submission**: Select a ready transcript, assign outcome, confirm `calls` row created
- **Extraction**: Process a call, verify `call_signals` has structured JSON matching schema
- **Aggregation**: Verify `call_aggregates` has correct counts and distributions
- **Backboard**: Confirm thread + document exist in Backboard, memories are being stored
- **Comparison**: Process 3+ success and 3+ failure calls, run comparison, verify meaningful deltas
- **Playbook**: Generate playbook, confirm markdown with confidence scores and actionable guidance
- **End-to-end**: Pre-transcribe 5-10 calls → submit with labels → process all → compare → generate playbook → verify Backboard retrieves stored intelligence
