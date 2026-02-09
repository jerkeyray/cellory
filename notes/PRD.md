# Cellory — Product Requirements Document

**Financial Audio Intelligence Layer**

Built for **Hotfoot AI Challenge 1: Financial Audio Intelligence**

---

## 1. Context

Financial organizations generate large volumes of call recordings across collections, support, and sales. These recordings contain valuable behavioral and operational intelligence, but exist as unstructured audio that cannot be systematically analyzed, audited, or reused by modern AI systems.

Cellory is a **financial audio intelligence layer** that converts raw call recordings into structured, reviewable insights and cross-call behavioral patterns. These insights can be consumed by downstream systems such as AI agents, QA workflows, or human analysts.

---

## 2. Problem

Legacy financial call data is difficult to reuse because:

* Audio is unstructured and inconsistent
* Call formats vary widely across teams and time
* Insights are locked inside individual recordings
* No persistent memory exists across calls
* AI agents and analytics systems cannot learn from historical calls

As organizations adopt AI-driven workflows, years of valuable call data becomes effectively unusable.

---

## 3. Solution Overview

Cellory converts unstructured financial call audio into **structured, auditable intelligence** through a two-stage pipeline:

### Stage 1 — Audio to Transcript (Preparation Layer)

* Raw audio is converted into timestamped text
* This step is run once and stored
* Decoupled from downstream intelligence for speed and reliability

### Stage 2 — Intelligence Pipeline (Core Product)

* Transcripts are transformed into structured signals
* Signals are aggregated deterministically
* Calls are compared across outcomes
* Cross-call patterns are stored as persistent memory
* Behavioral guidance is generated for downstream consumption

This separation ensures the system is fast, testable, and robust to noisy audio.

---

## 4. System Architecture

### Interface A — Transcription & Audio Metadata (Prep Tool)

**Purpose:** Convert raw audio into structured transcripts and metadata.

Capabilities:

* Upload financial call audio (WAV, MP3, M4A)
* Normalize audio format
* Transcribe via Whisper
* Extract audio-level metadata:

  * language
  * duration
  * transcription confidence proxy
* Store transcript as a reusable artifact

This interface is minimal and can be implemented as an admin UI or script. It exists to prepare data before intelligence processing.

---

### Interface B — Intelligence Pipeline (Primary Product)

**Purpose:** Convert transcripts into structured financial intelligence.

Capabilities:

* Select existing transcript
* Assign external outcome label (success / failure)
* Run signal extraction and aggregation
* Compare calls across outcomes
* Generate behavioral guidance
* Persist cross-call intelligence

This interface represents the core product value.

---

## 5. Role of Backboard AI (Explicit)

Backboard is **not** used for primary extraction or computation.
It is used as a **persistent intelligence memory layer**.

### Backboard is responsible for:

* Storing cross-call insights that compound over time
* Remembering behavioral patterns discovered in prior analyses
* Injecting historical context into future playbook generation
* Enabling retrieval of prior transcripts and playbooks via RAG

### Backboard is NOT responsible for:

* Transcription
* Signal extraction
* Deterministic aggregation
* Outcome comparison logic

This separation ensures correctness, auditability, and predictable behavior.

---

## 6. Technology Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Frontend       | Next.js 16 + Tailwind CSS 4         |
| Backend        | Next.js API Routes / Server Actions |
| Database       | Neon Postgres + Prisma              |
| AI SDK         | Vercel AI SDK                       |
| Speech-to-Text | OpenAI Whisper (via Vercel AI SDK)  |
| LLM            | OpenAI GPT-4o (via Vercel AI SDK)   |
| Memory Layer   | Backboard AI                        |
| Deployment     | Vercel                              |

---

## 7. Data Model (Core Entities)

### `transcripts`

Stores prepared text artifacts derived from audio.

* id
* filename
* content
* duration_seconds
* word_timestamps
* language
* quality_score
* status
* created_at

---

### `calls`

Represents a single analyzed call.

* id
* transcript_id
* outcome (success | failure)
* status
* backboard_thread_id
* created_at

---

### `call_signals`

Atomic extracted events.

* id
* call_id
* chunk_index
* signal_type
* signal_data
* confidence
* start_time
* end_time

---

### `call_aggregates`

Deterministic features derived from signals.

* id
* call_id
* features
* computed_at

---

### `playbooks`

Generated behavioral guidance artifacts.

* id
* title
* content
* call_count
* confidence_scores
* backboard_document_id
* created_at

---

## 8. Processing Pipeline

### Stage 1 — Transcription

1. Upload audio
2. Normalize format
3. Transcribe via Whisper
4. Store transcript + metadata
5. Mark transcript as ready

This stage is run offline or asynchronously.

---

### Stage 2 — Intelligence Pipeline

#### Step 1: Call Submission

* Select prepared transcript
* Assign outcome label
* Create call record

#### Step 2: Deterministic Chunking

* Segment transcript into time-based chunks
* Add overlap to preserve context

#### Step 3: Signal Extraction (LLM)

* Run GPT-4o on each chunk
* Extract abstract behavioral signals:

  * objection
  * escalation
  * agreement
  * uncertainty
  * resolution_attempt
* Enforced JSON schema
* Signals may be empty

#### Step 4: Aggregation (Non-LLM)

* Count signals
* Compute timing distributions
* Identify common sequences
* Produce deterministic feature set

#### Step 5: Backboard Memory Write

* Create thread per call
* Upload transcript as document
* Send structured summary with `memory: Auto`
* Backboard extracts and stores durable insights

#### Step 6: Outcome Comparison

* Compare aggregates across success vs failure
* Identify statistically meaningful differences
* Pure computation, no LLM

#### Step 7: Playbook Generation

* Retrieve Backboard memories
* Combine with outcome deltas
* Generate behavioral guidance
* Store playbook locally and in Backboard

---

## 9. Frontend Experience

Minimal, functional UI:

* Transcript preparation page
* Call analysis dashboard
* Call detail view (signals + aggregates)
* Comparison view (success vs failure)
* Playbook viewer (markdown)

UI prioritizes auditability and clarity over polish.

---

## 10. Implementation Phases (High Level)

1. Data schema + Neon
2. Transcript ingestion (text-first)
3. Chunking logic
4. Signal extraction
5. Aggregation
6. Outcome comparison
7. Playbook generation
8. Backboard integration
9. UX polish

---

## 11. Success Criteria

* Raw audio can be ingested and reviewed
* Calls produce structured, timestamped signals
* Aggregates are deterministic and auditable
* Cross-call patterns are observable
* Playbooks improve as more calls are processed
* Backboard memory compounds insights over time

---

## 12. Positioning Summary (Judge-Facing)

> Cellory is a financial audio intelligence layer that converts unstructured call recordings into structured, auditable insights and reusable behavioral guidance. It focuses on abstraction, aggregation, and persistence, enabling downstream systems — including AI agents — to learn from historical financial calls.

