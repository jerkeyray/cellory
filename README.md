# cellory 
### Built for DEVSOC'26

Cellory turns call recordings into decision-grade intelligence for revenue, collections, and customer success teams. It transforms raw conversation data into auditable behavioral signals, outcome comparisons, and prescriptive playbooks that compound over time.

## Business Value

- **Reduce revenue leakage** by identifying the behaviors that separate successful calls from failed ones.
- **Standardize coaching** by converting best-practice patterns into reusable playbooks.
- **Accelerate onboarding** with evidence-based guidance tied to real call outcomes.
- **Provide auditable metrics** for leadership without manual review.

## How It Works

```
Upload Recording → Transcribe (Whisper) → Chunk → Extract Markers (GPT-4o) → Aggregate → Compare Outcomes → Generate Playbook
```

1. **Upload** — Drop call recordings (WAV, MP3, M4A) into the Recordings section. Whisper transcribes and extracts audio metadata automatically.
2. **Extract** — Transcripts are chunked and processed by GPT-4o to extract structured behavioral markers (objections, escalations, agreements, resolution attempts, commitments).
3. **Aggregate** — Markers are merged deterministically into outcome-level metrics. No LLM variability in this step.
4. **Compare** — Success vs failure aggregates are compared to surface statistically meaningful differences.
5. **Remember** — Summaries are persisted to Backboard for cross-call context that compounds over time.
6. **Generate** — Coaching playbooks are produced from outcome deltas enriched with historical memory.

## Core Features

### Recording Management

Upload and manage call recordings. Track processing status, batch-analyze multiple recordings, and auto-analyze on upload.

### Behavioral Marker Extraction

Structured extraction of decision-grade markers: constraints, resolution strategies, control shifts, and commitments. Deterministic aggregation produces auditable feature sets.

### Outcome Intelligence

Compare success vs failure to surface what top performers do differently. Works with success-only data when failure samples are unavailable.

### Coaching Playbooks

Auto-generated playbooks follow a structured format optimized for human readability, LLM parsing, and TTS delivery. Playbooks improve as more calls are processed.

### Insights Dashboard

Trend summaries, marker distributions, and outcome-level benchmarks across your call library.

## Getting Started

### Prerequisites

- Node.js 20+ or Bun 1.1+
- PostgreSQL database (Neon recommended)
- OpenAI API key
- Google OAuth credentials (for authentication)

### Setup

```bash
# Clone and install
git clone <repo-url> && cd cellory
bun install

# Configure environment
cp .env.example .env.local
# Fill in the values in .env.local (see Environment Variables below)

# Set up database
bun run db:push

# Start development server
bun run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string (pooled) |
| `DIRECT_URL` | Yes | Postgres direct connection (for migrations) |
| `AUTH_SECRET` | Yes | Generate with `npx auth secret` |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |
| `OPENAI_API_KEY` | Yes | OpenAI API key for marker extraction and playbook generation |
| `BACKBOARD_API_KEY` | No | Backboard.io API key for persistent cross-call memory |

### Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:studio` | Open Prisma Studio |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| UI | React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| Database | Neon Postgres + Prisma |
| Auth | Auth.js (NextAuth v5) with Google OAuth |
| AI | Vercel AI SDK + OpenAI GPT-4o (extraction) + Whisper (transcription) |
| Memory | Backboard.io (optional, for cross-call RAG) |
| Charts | Recharts |
| Deployment | Vercel |

## Backboard Integration

Backboard serves as an optional persistent memory layer:

- Each analyzed call produces a structured behavioral summary.
- Summaries are stored in outcome-specific threads (success/failure/unknown).
- Playbook generation retrieves historical summaries via RAG to enrich prompts.
- Fail-safe: if Backboard is not configured or unavailable, the pipeline completes without blocking.

## Data Model

| Entity | Purpose |
|---|---|
| **Transcript** | Uploaded recording text, audio metadata, and processing state |
| **Call** | Analysis unit linked to a transcript and outcome label |
| **Signal** | Extracted behavioral markers with timestamps and confidence |
| **Aggregate** | Deterministic features computed from signals |
| **Playbook** | Generated coaching guidance from outcome comparisons |

All data is scoped to the authenticated user.

## Project Structure

```
app/
  page.tsx              Landing page (public) / Dashboard (authenticated)
  layout.tsx            Root layout with Navbar
  transcripts/          Recordings section — upload, manage, batch analyze
  calls/                Call analysis — signals, aggregates, transcript view
  insights/             Trend summaries and outcome benchmarks
  playbooks/            Playbook generation and viewing
  auth/                 Sign-in page
  api/                  API routes (calls, transcripts, playbooks, tags, compare)
  lib/                  Pipeline core
    pipeline.ts           Orchestrator — chunking through aggregation
    signals-v3.ts         GPT-4o marker extraction
    aggregator-v3.ts      Deterministic signal aggregation
    comparator.ts         Outcome comparison logic
    playbook-generator.ts Playbook generation with Backboard context
    backboard.ts          Backboard.io integration
    whisper.ts            Audio transcription
    chunker.ts            Transcript chunking
    prisma.ts             Database client
components/
  ui/                   shadcn/ui components
  page-header.tsx       Shared page header
prisma/
  schema.prisma         Database schema
notes/                  Product specs and research docs
```

## Guardrails

- Deterministic aggregation — no LLM in the aggregation step.
- Auditable lineage from transcript to markers to aggregates to playbook.
- Non-blocking external integrations — Backboard failures never break the pipeline.
- User-scoped data access enforced at every layer.

## What Cellory Is Not

- Not a live coaching assistant or real-time agent.
- Not a generic transcription service.
- Not a black-box dashboard — every insight traces back to source markers.

## Use Cases

- **Collections** — identify behaviors that increase promise-to-pay rates.
- **Revenue** — codify successful objection handling across the team.
- **Customer Success** — standardize retention and renewal conversations.
