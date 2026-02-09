# Decision-Grade Marker System (v3)

## Rationale

The v2 marker system extracts 5 generic types (`commitment_event`, `blocker_event`, `resolution_attempt`, `control_event`, `stall_event`). While better than v1's sentiment signals, these don't answer the core product question:

> "What should an agent do differently next time to increase the chance of a win?"

v3 replaces weak markers with **decision-grade markers** that track constraints, strategies, control dynamics, and commitment quality — the building blocks of trainable agent behavior. The aggregator shifts from generic signal statistics to actionable metrics like resolution latency, control recovery, and constraint-commitment pairing.

---

## Marker Types

### 1. `customer_constraint`
**Replaces:** `blocker_event`

Tracks specific constraints the customer raises that the agent must navigate.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"customer_constraint"` | Marker type |
| `constraint_type` | enum | `trust`, `capability`, `time`, `authority`, `risk`, `clarity` |
| `explicit` | boolean | Whether the constraint was stated explicitly |
| `severity` | number (0-1) | How blocking this constraint is |
| `description` | string (max 80) | Brief description |
| `time` | number | Timestamp in seconds |
| `confidence` | number (0-1) | Extraction confidence |

**Why better than `blocker_event`:** Captures severity gradient and explicit/implicit distinction. A whispered "I'm not sure I trust this" (implicit, severity 0.3) is very different from "I will NOT sign without legal review" (explicit, severity 0.9).

---

### 2. `agent_response_strategy`
**Replaces:** `resolution_attempt`

Tracks what strategy the agent uses and which constraint it targets.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"agent_response_strategy"` | Marker type |
| `strategy` | enum | `acknowledge_limitation`, `reframe_scope`, `reduce_risk`, `defer_detail`, `transfer_authority`, `social_proof`, `push_commitment` |
| `target_constraint` | string | Description of the constraint being addressed |
| `description` | string (max 80) | Brief description |
| `time` | number | Timestamp in seconds |
| `confidence` | number (0-1) | Extraction confidence |

**Why better than `resolution_attempt`:** Links strategy to specific constraint, enabling resolution latency computation. Expanded strategy vocabulary captures real agent behavior.

---

### 3. `control_dynamics`
**Replaces:** `control_event` + `stall_event`

Tracks who has conversational control and shifts between participants.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"control_dynamics"` | Marker type |
| `event` | enum | `agent_in_control`, `customer_in_control`, `control_shift`, `control_recovery` |
| `cause` | string | What caused this control state |
| `description` | string (max 80) | Brief description |
| `time` | number | Timestamp in seconds |
| `confidence` | number (0-1) | Extraction confidence |

**Why better than `control_event` + `stall_event`:** Merges overlapping concepts. `control_recovery` is a new, high-signal event — recovering control before commitment is strongly correlated with wins.

---

### 4. `commitment_quality`
**Replaces:** `commitment_event`

Tracks commitment quality, not just occurrence.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"commitment_quality"` | Marker type |
| `commitment_type` | enum | `followup`, `payment`, `trial`, `demo` |
| `initiated_by` | enum | `agent`, `customer` |
| `reversibility` | enum | `low`, `medium`, `high` |
| `time_from_last_constraint` | number | Seconds since last constraint marker |
| `description` | string (max 80) | Brief description |
| `time` | number | Timestamp in seconds |
| `confidence` | number (0-1) | Extraction confidence |

**Why better than `commitment_event`:** Captures commitment quality dimensions. A customer-initiated, low-reversibility payment commitment is very different from an agent-pushed, high-reversibility followup.

---

## Auxiliary Metrics (Simplified)

Reduced from v2's extensive list to essentials:

| Field | Type |
|-------|------|
| `predicted_outcome` | `"success"` \| `"failure"` \| null |
| `outcome_confidence` | number (0-1) \| null |
| `outcome_reasoning` | string (max 150) \| null |
| `call_tone` | `"neutral"` \| `"tense"` \| `"cooperative"` \| null |

---

## Aggregate Features (v3)

Computed by `aggregator-v3.ts` — pure computation, zero LLM calls.

```
schemaVersion: 3

// Constraints
constraints_per_call        // Total customer_constraint markers
constraint_type_counts      // Record<string, number> by constraint_type
time_to_first_constraint    // Seconds until first constraint appears
explicit_constraint_ratio   // Proportion of explicit constraints
avg_constraint_severity     // Mean severity across all constraints

// Resolution
agent_strategy_count_by_type  // Record<string, number> by strategy
avg_resolution_latency        // Mean time between constraint and matching strategy
unresolved_constraint_count   // Constraints with no subsequent matching strategy

// Control
control_shifts              // Number of control_shift events
control_recoveries          // Number of control_recovery events
control_recovery_before_commitment  // boolean — last recovery < first commitment
agent_control_ratio         // Proportion of agent_in_control events

// Commitments
commitment_count            // Total commitment_quality markers
commitment_types            // Record<string, number> by commitment_type
commitment_after_unresolved_constraint  // boolean — RED FLAG
avg_time_from_last_constraint           // Mean time_from_last_constraint

// Auxiliary
predicted_outcome           // From extraction
outcome_confidence          // From extraction
call_tone                   // From extraction
```

---

## Key Algorithms

### Resolution Latency
1. Sort all markers by `time`
2. For each `customer_constraint`, find the next `agent_response_strategy` whose `target_constraint` loosely matches
3. Latency = strategy.time - constraint.time
4. Unresolved = constraints with no subsequent matching strategy

### Control Recovery Before Commitment
1. Find the last `control_recovery` event time
2. Find the first `commitment_quality` event time
3. If last recovery < first commitment → true (good pattern)

### Commitment After Unresolved Constraint
1. Identify unresolved constraints (no matching strategy after them)
2. If any `commitment_quality` occurs after an unresolved constraint → RED FLAG

---

## Backboard Summary Format

For future Backboard integration, behavioral summaries follow this format:

```
Outcome: success
Primary constraint: capability_constraint
Resolution strategy: acknowledge_limitation
Control recovered before commitment
Commitment occurred 62s after resolution
```

---

## Backward Compatibility

- **Old calls** keep v2 `signalType` values and aggregate JSON — untouched
- **`schemaVersion: 3`** on new aggregates allows version detection
- **UI** renders v2 or v3 based on `signalType` values present
- **Comparator** only compares calls within the same schema version
- **Rollback** = one-line import change in `pipeline.ts` back to v2

---

## Files

| File | Action | Purpose |
|------|--------|---------|
| `app/lib/signals-v3.ts` | CREATE | Zod schemas + extraction prompt |
| `app/lib/aggregator-v3.ts` | CREATE | Deterministic metrics computation |
| `app/lib/backboard.ts` | CREATE | Behavioral summary stub |
| `app/lib/pipeline.ts` | MODIFY | Swap v2 → v3 |
| `app/lib/comparator.ts` | MODIFY | Add v3 comparison with Cohen's d |
| `app/calls/[id]/page.tsx` | MODIFY | Dual v2/v3 rendering |
| `app/compare/page.tsx` | MODIFY | V3 profile rendering |
| `app/lib/playbook-generator.ts` | MODIFY | V3 prompt sections |
| `notes/MARKER_TYPES.md` | MODIFY | Update documentation |

---

## Cost

- Same as v2: **~$0.0015 per 5-min call**
- gpt-4o-mini for extraction, temperature 0
- ~250 token prompt
- No increase in API calls
