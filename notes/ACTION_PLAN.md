---

## 13. Action Plan — Step-by-Step Implementation

### Current State (What Already Exists)

- Next.js 16 project scaffolded with TypeScript + Tailwind CSS 4
- Prisma schema fully defined (9 models, 3 enums) — pushed to Neon Postgres
- NextAuth v5 wired with PrismaAdapter, database sessions, custom sign-in page
- Prisma client singleton (`app/lib/prisma.ts`)
- Session proxy for Next.js 16 middleware (`proxy.ts`)
- Home page and sign-in page are placeholder/template — no product UI yet
- **Zero API routes** beyond `/api/auth/[...nextauth]`
- **Zero business logic** — no transcription, extraction, aggregation, or playbook code

---

### Phase 1 — Authentication & Session Foundation

**Goal:** Get a working login flow so all subsequent pages can be auth-gated.

#### Step 1.1: Configure Google OAuth Provider
- Add `next-auth/providers/google` import in `auth.ts`
- Add Google provider to the `providers` array with `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` env vars
- Verify env vars are set in `.env.local` (and on Vercel for production)

#### Step 1.2: Update Sign-In Page
- Replace the placeholder sign-in page (`app/auth/signin/page.tsx`) with a proper branded page
- Show a "Sign in with Google" button that calls the Google provider
- Add Cellory branding (logo, tagline: "Financial Audio Intelligence")
- Minimal dark-mode-aware styling with Tailwind

#### Step 1.3: Session Provider & Auth Guard
- Create a `SessionProvider` wrapper component (`app/components/SessionProvider.tsx`) using `next-auth/react`
- Wrap `{children}` in `app/layout.tsx` with the session provider
- Create a reusable `AuthGuard` component or use `auth()` in server components to gate protected pages
- Redirect unauthenticated users to `/auth/signin`

#### Step 1.4: Update Root Layout & Metadata
- Change `<title>` from "Create Next App" to "Cellory — Financial Audio Intelligence"
- Update meta description
- Remove leftover Next.js template references

#### Step 1.5: Add a Global Navbar
- Create `app/components/Navbar.tsx`
- Show: Cellory logo/name, nav links (Transcripts, Calls, Playbooks), user avatar + sign-out button
- Responsive: collapse to hamburger on mobile
- Include in `layout.tsx` so it appears on all pages

**Deliverable:** User can sign in with Google, sees a branded navbar, and is redirected if not authenticated.

---

### Phase 2 — Transcript Ingestion (Interface A — Prep Tool)

**Goal:** Users can upload audio files, get them transcribed via Whisper, and view transcripts.

#### Step 2.1: Install Dependencies
- `ai` — Vercel AI SDK core
- `@ai-sdk/openai` — OpenAI provider for Vercel AI SDK (for Whisper + GPT-4o)
- Use Next.js built-in `Request.formData()` for file uploads (no additional upload library needed)
- UUIDs handled by Prisma (no additional package needed)

#### Step 2.2: Audio Upload API Route
- Create `app/api/transcripts/upload/route.ts`
- Accept `POST` with `multipart/form-data` (audio file: WAV, MP3, M4A)
- Validate file type and size (cap at ~25 MB for Whisper limit)
- Create a `Transcript` record with `status: processing`
- Return the transcript ID immediately (async processing)

#### Step 2.3: Whisper Transcription Logic
- Create `app/lib/whisper.ts` — utility to call OpenAI Whisper via Vercel AI SDK
- Use `@ai-sdk/openai` provider to access Whisper API
- Send audio file to transcription endpoint
- Request `verbose_json` response format to get word-level timestamps
- Extract: transcribed text, duration, word timestamps, language
- Handle errors gracefully (network, file too large, unsupported format)

#### Step 2.4: Transcription Processing
- After upload, call Whisper (can be done inline for v1, or via a background job)
- On success: update transcript record with `content`, `durationSeconds`, `wordTimestamps`, `status: ready`
- On failure: update `status: error`
- Consider adding a `language` and `qualityScore` field to the schema if not already present (PRD mentions them — schema currently omits `language` and `quality_score`, will need a migration)

#### Step 2.5: Schema Migration for Missing Fields
- Add `language String?` and `qualityScore Float? @map("quality_score")` to the `Transcript` model
- Run `prisma db push` to sync

#### Step 2.6: Transcript List API
- Create `app/api/transcripts/route.ts`
- `GET` — return all transcripts (id, filename, status, duration, language, createdAt), ordered by `createdAt DESC`
- Paginate if needed (offset/limit query params)

#### Step 2.7: Transcript Detail API
- Create `app/api/transcripts/[id]/route.ts`
- `GET` — return full transcript content + metadata for a given ID
- `DELETE` — remove transcript and cascaded calls/signals/aggregates

#### Step 2.8: Transcript Upload Page (Frontend)
- Create `app/transcripts/page.tsx` — list all transcripts
- Show a table/card list: filename, status badge (processing/ready/error), duration, language, date
- "Upload Audio" button opens a file picker or drag-and-drop zone
- On upload: call the upload API, show a loading state, poll or refetch until `status: ready`

#### Step 2.9: Transcript Detail Page (Frontend)
- Create `app/transcripts/[id]/page.tsx`
- Display full transcript text with timestamps
- Show metadata sidebar: filename, duration, language, quality score, status
- "Analyze Call" button → navigates to call creation flow (Phase 3)

**Deliverable:** User uploads audio, sees it transcribed, can browse and view transcripts.

---

### Phase 3 — Call Analysis & Signal Extraction (Intelligence Pipeline — Steps 1–3)

**Goal:** User submits a transcript for analysis, system extracts behavioral signals via GPT-4o.

#### Step 3.1: Call Submission API
- Create `app/api/calls/route.ts`
- `POST` — accepts `{ transcriptId, outcome }` (outcome = "success" | "failure")
- Creates a `Call` record with `status: pending`
- Returns call ID

#### Step 3.2: Deterministic Chunking Logic
- Create `app/lib/chunker.ts`
- Split transcript content into time-based chunks (~60–90 second windows)
- Use word timestamps to determine chunk boundaries
- Add 10–15 second overlap between adjacent chunks for context continuity
- Each chunk gets a `chunkIndex` (0-based)
- Return array: `{ chunkIndex, text, startTime, endTime }`

#### Step 3.3: Signal Extraction via GPT-4o
- Create `app/lib/signals.ts`
- Use Vercel AI SDK's `generateObject()` with `@ai-sdk/openai` provider
- For each chunk, call GPT-4o with a structured prompt:
  - System prompt defines the signal taxonomy: `objection`, `escalation`, `agreement`, `uncertainty`, `resolution_attempt`
  - User prompt is the chunk text with time context
  - Use Zod schema to enforce type-safe JSON response (array of signals, each with `signalType`, `signalData`, `confidence`, `startTime`, `endTime`)
- Handle empty signal arrays (chunk may have no notable events)
- Handle rate limits / retries gracefully
- Vercel AI SDK provides automatic retries and error handling

#### Step 3.4: Signal Persistence
- After extraction, write each signal to `CallSignal` table
- Batch insert for efficiency (`prisma.callSignal.createMany()`)
- Update `Call.status` to `extracting` when starting, then to `aggregating` when signals are done

#### Step 3.5: Call Processing Orchestrator
- Create `app/lib/pipeline.ts`
- Orchestrate the full pipeline for a single call:
  1. Fetch transcript content + word timestamps
  2. Chunk the transcript
  3. Extract signals from each chunk (can parallelize with `Promise.all` with concurrency limit)
  4. Persist signals
  5. Trigger aggregation (Phase 4)
  6. Update call status at each stage

#### Step 3.6: Process Call API Route
- Create `app/api/calls/[id]/process/route.ts`
- `POST` — triggers the pipeline orchestrator for a given call
- Returns immediately with status (processing is async)
- Or: merge this into the call creation route so submission + processing happen in one step

#### Step 3.7: Call List API
- Create `app/api/calls/route.ts` — add `GET` handler
- Return all calls with: id, outcome, status, transcript filename, signal count, createdAt
- Include filter by outcome (`?outcome=success`)

#### Step 3.8: Call Detail API
- Create `app/api/calls/[id]/route.ts`
- `GET` — return call record + all signals + aggregates
- Include the linked transcript content

#### Step 3.9: Call Analysis Dashboard (Frontend)
- Create `app/calls/page.tsx`
- "New Analysis" button: select a transcript + assign outcome → submit
- Table of existing calls: outcome badge, status badge, signal count, date
- Filter tabs: All / Success / Failure
- Click a call → navigate to detail page

#### Step 3.10: Call Detail Page (Frontend)
- Create `app/calls/[id]/page.tsx`
- Display transcript text with signals overlaid (highlighted regions)
- Signal timeline: visual bar showing signal positions across the call duration
- Signal list: type, confidence, chunk, time range, data
- Status indicator showing pipeline progress (pending → extracting → aggregating → complete)

**Deliverable:** User submits calls for analysis, signals are extracted and displayed per-call.

---

### Phase 4 — Aggregation & Outcome Comparison (Pipeline Steps 4 & 6)

**Goal:** Compute deterministic features from signals, then compare success vs. failure calls.

#### Step 4.1: Aggregation Engine
- Create `app/lib/aggregator.ts`
- Input: all signals for a single call
- Compute features (pure computation, no LLM):
  - **Signal counts** by type (e.g., `{ objection: 3, escalation: 1, agreement: 5, ... }`)
  - **Timing distributions**: when do signals appear? (early/mid/late thirds of the call)
  - **Average confidence** per signal type
  - **Signal density**: signals per minute
  - **Sequence patterns**: common signal transitions (e.g., objection → resolution_attempt)
  - **First/last signal timing**: how early does the first objection appear? When is the last agreement?
- Output: a deterministic JSON feature set

#### Step 4.2: Aggregation Persistence
- Write the feature set to `CallAggregate` table
- One aggregate per call (upsert if re-run)
- Update `Call.status` to `complete`

#### Step 4.3: Wire Aggregation into Pipeline
- Add aggregation step to `app/lib/pipeline.ts` after signal extraction
- Call → extract signals → aggregate → update status to `complete`

#### Step 4.4: Outcome Comparison Engine
- Create `app/lib/comparator.ts`
- Input: aggregates from all success calls + all failure calls
- Compute deltas (pure computation, no LLM):
  - **Mean feature values** per outcome group
  - **Differences**: which features diverge most between success and failure?
  - **Statistical significance** (simple: absolute difference and percentage difference; advanced: t-test if enough samples)
  - **Key differentiators**: ranked list of features that most separate outcomes
- Output: structured comparison object

#### Step 4.5: Comparison API
- Create `app/api/compare/route.ts`
- `GET` — runs comparator on all completed calls, returns comparison results
- Optional: cache results and invalidate when new calls complete

#### Step 4.6: Comparison View (Frontend)
- Create `app/compare/page.tsx`
- Side-by-side view: success vs. failure aggregate averages
- Bar charts or tables showing feature differences
- Highlight statistically significant differentiators
- Minimum call count warning (e.g., "Need at least 3 calls per outcome for meaningful comparison")

#### Step 4.7: Update Call Detail Page
- Add aggregates section to `app/calls/[id]/page.tsx`
- Show the computed feature set as a summary card
- Visual: signal distribution chart across call timeline

**Deliverable:** Each call has deterministic aggregates; comparison view shows success vs. failure patterns.

---

### Phase 5 — Backboard AI Integration (Pipeline Steps 5 & Memory)

**Goal:** Persist cross-call intelligence in Backboard for memory compounding and RAG retrieval.

#### Step 5.1: Backboard Client Setup
- Create `app/lib/backboard.ts`
- Initialize Backboard SDK/API client with env vars (`BACKBOARD_API_KEY`, `BACKBOARD_PROJECT_ID`)
- Utility functions: `createThread()`, `uploadDocument()`, `sendMessage()`, `retrieveMemories()`

#### Step 5.2: Per-Call Memory Write (Pipeline Step 5)
- After aggregation, create a Backboard thread per call
- Upload the transcript as a document to the thread
- Send a structured summary message with `memory: "Auto"`:
  - Call outcome
  - Signal summary (counts + timing)
  - Aggregate features
  - Key behavioral observations
- Store the `backboardThreadId` on the `Call` record

#### Step 5.3: Wire into Pipeline
- Add Backboard memory write as a step in `app/lib/pipeline.ts`
- Runs after aggregation, before marking call as `complete`
- Fail gracefully (Backboard being down should not block the pipeline — log error and continue)

#### Step 5.4: Memory Retrieval Utility
- Create function to retrieve Backboard memories relevant to a query
- Used by playbook generation (Phase 6) and potentially by the comparison view

**Deliverable:** Each analyzed call is persisted in Backboard, building a compounding memory layer.

---

### Phase 6 — Playbook Generation (Pipeline Step 7)

**Goal:** Generate behavioral guidance from outcome comparisons + Backboard memories.

#### Step 6.1: Playbook Generation Engine
- Create `app/lib/playbook-generator.ts`
- Input: outcome comparison results + Backboard memories
- Steps:
  1. Retrieve relevant memories from Backboard (`retrieveMemories()`)
  2. Combine with outcome deltas from comparator
  3. Use Vercel AI SDK's `generateText()` with GPT-4o to generate guidance
  4. Prompt: "Given these behavioral differences between successful and failed financial calls, and these historical insights, generate actionable behavioral guidance for call agents."
  5. Response: structured markdown playbook with sections (e.g., Opening, Objection Handling, Closing)
- Output: playbook title + markdown content + confidence scores

#### Step 6.2: Playbook Persistence
- Save to `Playbook` table: title, content (markdown), callCount, confidenceScores
- Also upload to Backboard as a document (`backboardDocumentId`)

#### Step 6.3: Playbook API
- Create `app/api/playbooks/route.ts`
  - `GET` — list all playbooks (title, callCount, createdAt)
  - `POST` — trigger generation of a new playbook (runs comparison + Backboard retrieval + GPT-4o)
- Create `app/api/playbooks/[id]/route.ts`
  - `GET` — return full playbook content
  - `DELETE` — remove playbook

#### Step 6.4: Playbook Viewer (Frontend)
- Create `app/playbooks/page.tsx` — list all generated playbooks
- "Generate Playbook" button triggers creation
- Show: title, call count used, confidence, date
- Create `app/playbooks/[id]/page.tsx` — full playbook viewer
- Render markdown content with proper formatting
- Show metadata: how many calls informed this, confidence scores, generation date

**Deliverable:** System generates actionable playbooks from cross-call analysis, viewable in the UI.

---

### Phase 7 — Dashboard & Home Page

**Goal:** Replace the template home page with a product dashboard.

#### Step 7.1: Dashboard Page
- Replace `app/page.tsx` with a dashboard showing:
  - **Stats cards**: total transcripts, total calls analyzed, success rate, playbooks generated
  - **Recent activity**: last 5 calls with status
  - **Quick actions**: "Upload Audio", "New Analysis", "Generate Playbook"
  - **Pipeline health**: any calls stuck in processing/error state

#### Step 7.2: Dashboard API
- Create `app/api/dashboard/route.ts`
- `GET` — return aggregate stats (counts, recent calls, error counts)

**Deliverable:** Landing page shows a useful overview of the system state.

---

### Phase 8 — Polish, Error Handling & Edge Cases

**Goal:** Harden the app for demo-readiness and real-world resilience.

#### Step 8.1: Loading & Error States
- Add loading skeletons for all pages (transcript list, call list, playbook list)
- Add error boundaries for failed API calls
- Add toast notifications for async operations (upload started, processing complete, error occurred)

#### Step 8.2: Validation & Guards
- Validate file types on upload (WAV, MP3, M4A only)
- Validate file size (max 25 MB)
- Prevent duplicate call creation for the same transcript + outcome
- Guard against running pipeline on a transcript that's still `processing`

#### Step 8.3: Pipeline Status Polling
- On call detail page, poll `/api/calls/[id]` every few seconds while status is not `complete` or `error`
- Show real-time progress updates (pending → extracting → aggregating → complete)

#### Step 8.4: Empty States
- Transcript list: "No transcripts yet. Upload your first audio file."
- Call list: "No calls analyzed. Start by selecting a transcript."
- Comparison: "Need at least 1 success and 1 failure call to compare."
- Playbooks: "No playbooks yet. Analyze some calls first."

#### Step 8.5: Responsive Design Pass
- Ensure all pages work on mobile and tablet
- Navbar collapses properly
- Tables scroll horizontally on small screens

#### Step 8.6: Environment Variable Validation
- Add startup check that all required env vars are set
- Fail fast with clear error messages if missing

**Deliverable:** App is robust, user-friendly, and demo-ready.

---

### Phase 9 — Deployment & Vercel Configuration

#### Step 9.1: Vercel Project Setup
- Link repo to Vercel project
- Configure environment variables on Vercel:
  - `DATABASE_URL` (Neon connection string)
  - `AUTH_SECRET`
  - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
  - `OPENAI_API_KEY`
  - `BACKBOARD_API_KEY`, `BACKBOARD_PROJECT_ID`

#### Step 9.2: Build & Deploy Verification
- Run `next build` locally to catch any build errors
- Verify Prisma client generates correctly in production
- Test OAuth flow on deployed URL (redirect URIs must match)

#### Step 9.3: Production Database
- Ensure Neon database has the correct schema (`prisma db push` against production)
- Verify connection pooling settings for serverless

**Deliverable:** App is live on Vercel with all integrations working.

---

### Dependency Install Summary

Packages to add across all phases:

```bash
# Runtime
npm install ai                    # Vercel AI SDK core
npm install @ai-sdk/openai        # OpenAI provider (Whisper + GPT-4o)
npm install zod                   # Schema validation for structured outputs
npm install react-markdown        # Playbook rendering
npm install remark-gfm            # GitHub-flavored markdown support

# Optional UI
npm install lucide-react          # Icons for UI (if needed)
```

---

### File Structure (Final Target)

```
app/
├── api/
│   ├── auth/[...nextauth]/route.ts       ✅ exists
│   ├── transcripts/
│   │   ├── route.ts                      GET (list), POST (create)
│   │   ├── upload/route.ts               POST (file upload)
│   │   └── [id]/route.ts                 GET (detail), DELETE
│   ├── calls/
│   │   ├── route.ts                      GET (list), POST (create + process)
│   │   └── [id]/
│   │       └── route.ts                  GET (detail)
│   ├── compare/
│   │   └── route.ts                      GET (outcome comparison)
│   ├── playbooks/
│   │   ├── route.ts                      GET (list), POST (generate)
│   │   └── [id]/route.ts                 GET (detail), DELETE
│   └── dashboard/
│       └── route.ts                      GET (stats)
├── auth/
│   └── signin/page.tsx                   ✅ exists (will be updated)
├── transcripts/
│   ├── page.tsx                          Transcript list + upload
│   └── [id]/page.tsx                     Transcript detail
├── calls/
│   ├── page.tsx                          Call analysis dashboard
│   └── [id]/page.tsx                     Call detail (signals + aggregates)
├── compare/
│   └── page.tsx                          Success vs. failure comparison
├── playbooks/
│   ├── page.tsx                          Playbook list
│   └── [id]/page.tsx                     Playbook viewer
├── components/
│   ├── Navbar.tsx                        Global navigation
│   ├── SessionProvider.tsx               Auth session wrapper
│   └── ... (shared UI components)
├── lib/
│   ├── prisma.ts                         ✅ exists
│   ├── whisper.ts                        Whisper transcription client
│   ├── chunker.ts                        Transcript chunking logic
│   ├── signals.ts                        GPT-4o signal extraction
│   ├── aggregator.ts                     Deterministic aggregation
│   ├── comparator.ts                     Outcome comparison engine
│   ├── playbook-generator.ts             Playbook generation
│   ├── backboard.ts                      Backboard AI client
│   └── pipeline.ts                       Processing orchestrator
├── types/
│   └── next-auth.d.ts                    ✅ exists
├── layout.tsx                            ✅ exists (will be updated)
├── page.tsx                              ✅ exists (will become dashboard)
└── globals.css                           ✅ exists
```

---

### Execution Order & Dependencies

```
Phase 1 (Auth)          — no blockers, start here
Phase 2 (Transcripts)   — depends on Phase 1 (auth guards)
Phase 3 (Signals)       — depends on Phase 2 (needs transcripts)
Phase 4 (Aggregation)   — depends on Phase 3 (needs signals)
Phase 5 (Backboard)     — depends on Phase 4 (needs aggregates); can start client setup in parallel with Phase 3
Phase 6 (Playbooks)     — depends on Phase 4 + Phase 5
Phase 7 (Dashboard)     — depends on Phase 2–4 (needs stats to display)
Phase 8 (Polish)        — runs throughout but focused pass at the end
Phase 9 (Deploy)        — final phase after all features work locally
```

