# Cellory Playbook Format & Backboard Memory Specification
Version: 1.0 — For LLM consumption & generation consistency
Purpose: Standardize output format of behavioral playbooks + define precise Backboard.io integration rules

## 1. Optimal Markdown Structure for Playbooks
All generated playbooks **MUST** follow this exact hierarchy and conventions. This structure is optimized for:

- Human readability
- LLM parsing / RAG chunking
- Spoken TTS flow (ElevenLabs-style agents)
- Deterministic section retrieval

### Required Top-Level Structure

```markdown
# [Playbook Title]
[Short descriptive subtitle — e.g. "Winning Constraint Handling Patterns in Financial Collections Calls"]

## Core Success Principles
- Principle 1. Always [clear directive]...
- Principle 2. Use [strategy] in [X%] of winning calls...
- Principle 3. ...

## Top Constraint / Objection Types & Winning Responses
### [Constraint Type] ([percentage]% of successful calls)
- Primary winning strategy: **[strategy name]**
- How to apply: [short, directive sentences]
- Example phrasing: "You can say: ..."
- Expected outcome: [benefit / benchmark]

### [Next Constraint Type] ([percentage]%)
...

## Key Timing & Performance Benchmarks
- [Metric name]: [value] in successful calls (vs. [value] in failures when available)
- [Another metric]: ...

## Control & Recovery Guidelines
- Proactive rule 1: ...
- Never: ...
- Must: ...

## Recommended Call Flow (Step-by-Step)
1. [Step 1] — [action + rationale]
2. [Step 2] — ...
...

## When to Escalate or Pivot
- Conditions: ...
- Scripts: ...

## Data Notes / Evolution
- Derived from: [N] successful calls (compared to [M] failures where available)
- Last updated: [date or call count]
- Next improvement: Compare against failure patterns to unlock [specific delta]
```

### Formatting Rules (Enforce These)
- Use **bold** for strategy names, key metrics, and directive verbs
- Use short bullet points (1–2 lines max)
- Spell numbers naturally for speech: "eight point five seconds", "around 124 seconds"
- Percentages in parentheses after headings: `(42% of cases)`
- No long paragraphs — break into bullets or numbered steps
- End with an evolution note encouraging delta analysis from failures

This exact structure allows any LLM to:
- Generate consistent playbooks
- Extract sections via string matching or RAG
- Follow as system instructions

## 2. How Backboard.io MUST Be Used in Cellory

Backboard is **only** the persistent cross-call intelligence memory layer.
It is **not** used for transcription, signal extraction, aggregation, or real-time computation.

### Allowed & Required Backboard Operations

1. **Thread Creation**
   - One thread per analyzed call (recommended) OR one thread per outcome group / campaign
   - `createThread()` → returns thread_id
   - Tag threads: e.g. { "type": "collections", "outcome": "success", "campaign": "Q1-2025" }

2. **Document / Memory Upload**
   After deterministic aggregation:
   - Upload full transcript as a document
   - Upload structured JSON summary:
     ```json
     {
       "call_id": "...",
       "outcome": "success",
       "signals_summary": { "objection": 3, "resolution_attempt": 2, ... },
       "aggregates": { "constraint_resolution_latency_sec": 8.5, "first_constraint_sec": 123.8, ... },
       "strategies_used": { "reframe_scope": 0.55, "defer_detail": 0.25 },
       "control_recovery": 0.0
     }
     ```
   - Use `memory: Auto` flag when possible → Backboard extracts durable insights automatically

3. **RAG Retrieval for Playbook Generation**
   When generating a new playbook:
   - Query Backboard with semantic or keyword search:
     Examples:
     - "successful constraint handling patterns in collections calls"
     - "differences in resolution latency between success and failure"
     - "strategies with highest delta between success and failure"
   - Filter by tags: outcome=success, type=collections, min call count, etc.
   - Retrieve top-k memories → feed into LLM prompt for playbook synthesis

4. **Playbook Storage**
   - After generation: store the final markdown playbook as a document in the same thread or a dedicated "playbooks" thread
   - Tag: { "type": "playbook", "version": 3, "focus": "constraint-handling" }
   - Reference previous playbook versions in new ones for compounding

### Strictly Forbidden Backboard Uses
- Do NOT use Backboard for Whisper transcription
- Do NOT send raw audio
- Do NOT use it for initial signal extraction (that is GPT-4o + enforced JSON schema)
- Do NOT use it for deterministic counting/aggregation (timing stats, percentages — do this in code)
- Do NOT rely on Backboard for real-time call guidance (it's async memory, not streaming inference)

### Hackathon-Optimized Pattern (Keep It Simple & Impressive)
- Upload 5–10 sample calls → show initial playbook
- Upload 5–10 more → RAG query shows evolved insights → generate updated playbook
- Demo: "See how resolution latency benchmark improved from 11.2s to 8.5s after 15 calls — memory compounds automatically"

This specification ensures:
- Auditability (everything traceable via threads)
- Compounding intelligence over time
- Decoupling (core logic stays deterministic + local)
- Easy integration (4–5 API calls total)

## 3. Implementation in playbook-generator.ts

The playbook generator uses this specification in the GPT-4o prompt to ensure consistent output format.

Key requirements:
- Include the exact markdown structure in the prompt
- Enforce formatting rules in the prompt
- Use the structure for both comparison playbooks and success-only playbooks
- Adapt sections based on V2 (signal-based) vs V3 (constraint-based) data

## 4. Usage for Downstream LLMs

To use a Cellory playbook with another LLM (Claude, GPT, ElevenLabs agent, etc.):

1. Feed the playbook as system context or reference material
2. The standardized sections allow deterministic extraction:
   - "Core Success Principles" → system rules
   - "Top Constraint Types & Winning Responses" → conditional logic
   - "Recommended Call Flow" → step-by-step execution
   - "Key Timing & Performance Benchmarks" → success metrics

3. For TTS agents: numbers are spelled out naturally for speech synthesis
4. For RAG systems: section headers provide clear chunk boundaries

Use this document as your single source of truth when prompting any LLM to generate or consume Cellory playbooks.
