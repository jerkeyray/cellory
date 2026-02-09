# Decision-Grade Marker System (v3)

## Overview

Cellory now extracts **decision-grade markers** (v3) instead of generic behavioral signals. These markers represent **constraints, strategies, control dynamics, and commitment quality** — the building blocks of trainable agent behavior.

**Key Question:** *"What should an agent do differently next time to increase the chance of a win?"*

---

## Section A: Decision-Grade Markers

### 1. **customer_constraint**
**Replaces:** `blocker_event`

Tracks specific constraints the customer raises that the agent must navigate.

**Fields:**
- `type`: `"customer_constraint"`
- `constraint_type`: `trust` | `capability` | `time` | `authority` | `risk` | `clarity`
- `explicit`: boolean (whether stated explicitly)
- `severity`: number (0-1, how blocking this is)
- `description`: string (max 80 chars)
- `time`: number (timestamp in seconds)
- `confidence`: number (0-1)

**Example:**
```json
{
  "type": "customer_constraint",
  "constraint_type": "trust",
  "explicit": false,
  "severity": 0.3,
  "description": "Customer seems hesitant about security",
  "time": 45.2,
  "confidence": 0.85
}
```

**Why better:** Captures severity gradient and explicit/implicit distinction. A whispered "I'm not sure I trust this" (implicit, severity 0.3) is very different from "I will NOT sign without legal review" (explicit, severity 0.9).

---

### 2. **agent_response_strategy**
**Replaces:** `resolution_attempt`

Tracks what strategy the agent uses and which constraint it targets.

**Fields:**
- `type`: `"agent_response_strategy"`
- `strategy`: `acknowledge_limitation` | `reframe_scope` | `reduce_risk` | `defer_detail` | `transfer_authority` | `social_proof` | `push_commitment`
- `target_constraint`: string (description of the constraint being addressed)
- `description`: string (max 80 chars)
- `time`: number (timestamp in seconds)
- `confidence`: number (0-1)

**Example:**
```json
{
  "type": "agent_response_strategy",
  "strategy": "social_proof",
  "target_constraint": "trust concern about new feature",
  "description": "Agent mentions 500+ companies using it",
  "time": 52.8,
  "confidence": 0.92
}
```

**Why better:** Links strategy to specific constraint, enabling resolution latency computation. Expanded strategy vocabulary captures real agent behavior.

---

### 3. **control_dynamics**
**Replaces:** `control_event` + `stall_event`

Tracks who has conversational control and shifts between participants.

**Fields:**
- `type`: `"control_dynamics"`
- `event`: `agent_in_control` | `customer_in_control` | `control_shift` | `control_recovery`
- `cause`: string (what caused this control state)
- `description`: string (max 80 chars)
- `time`: number (timestamp in seconds)
- `confidence`: number (0-1)

**Example:**
```json
{
  "type": "control_dynamics",
  "event": "control_recovery",
  "cause": "Agent redirects with clarifying question",
  "description": "Agent regains control after tangent",
  "time": 78.5,
  "confidence": 0.88
}
```

**Why better:** Merges overlapping concepts. `control_recovery` is a new, high-signal event — recovering control before commitment is strongly correlated with wins.

---

### 4. **commitment_quality**
**Replaces:** `commitment_event`

Tracks commitment quality, not just occurrence.

**Fields:**
- `type`: `"commitment_quality"`
- `commitment_type`: `followup` | `payment` | `trial` | `demo`
- `initiated_by`: `agent` | `customer`
- `reversibility`: `low` | `medium` | `high`
- `time_from_last_constraint`: number (seconds since last constraint marker)
- `description`: string (max 80 chars)
- `time`: number (timestamp in seconds)
- `confidence`: number (0-1)

**Example:**
```json
{
  "type": "commitment_quality",
  "commitment_type": "trial",
  "initiated_by": "customer",
  "reversibility": "low",
  "time_from_last_constraint": 62,
  "description": "Customer agrees to start trial today",
  "time": 145.2,
  "confidence": 0.95
}
```

**Why better:** Captures commitment quality dimensions. A customer-initiated, low-reversibility payment commitment is very different from an agent-pushed, high-reversibility followup.

---

## Section B: Auxiliary Metrics (Simplified)

These are **not used for agent training**, only for reporting.

**Metrics:**
- `predicted_outcome`: `success` | `failure` | null
- `outcome_confidence`: number (0-1) | null
- `outcome_reasoning`: string (max 150) | null
- `call_tone`: `neutral` | `tense` | `cooperative` | null

**Example:**
```json
{
  "predicted_outcome": "success",
  "outcome_confidence": 0.85,
  "outcome_reasoning": "Customer showed strong engagement, commitment initiated by them",
  "call_tone": "cooperative"
}
```

---

## Section C: Aggregate Metrics (v3)

Computed by `aggregator-v3.ts` — pure computation, zero LLM calls.

### Constraints
- `constraints_per_call`: Total constraint markers
- `constraint_type_counts`: Record<string, number> by type
- `time_to_first_constraint`: Seconds until first constraint
- `explicit_constraint_ratio`: Proportion explicit
- `avg_constraint_severity`: Mean severity

### Resolution
- `agent_strategy_count_by_type`: Record<string, number> by strategy
- `avg_resolution_latency`: Mean time between constraint and matching strategy
- `unresolved_constraint_count`: Constraints with no subsequent strategy

### Control
- `control_shifts`: Number of control_shift events
- `control_recoveries`: Number of control_recovery events
- `control_recovery_before_commitment`: boolean (last recovery < first commitment)
- `agent_control_ratio`: Proportion of agent_in_control events

### Commitments
- `commitment_count`: Total commitment markers
- `commitment_types`: Record<string, number> by type
- `commitment_after_unresolved_constraint`: boolean (RED FLAG)
- `avg_time_from_last_constraint`: Mean time from last constraint

---

## Implementation

### Files:
- **Extraction:** `app/lib/signals-v3.ts`
- **Aggregation:** `app/lib/aggregator-v3.ts`
- **Pipeline:** `app/lib/pipeline.ts` (uses v3)
- **Comparison:** `app/lib/comparator.ts` (version-aware, supports both v2 and v3)
- **UI:** `app/calls/[id]/page.tsx` (dual v2/v3 rendering)
- **Comparison UI:** `app/compare/page.tsx` (dual v2/v3 rendering)
- **Playbook:** `app/lib/playbook-generator.ts` (version-aware prompts)

### Cost:
- Same as v2: **~$0.0015 per 5-min call**
- gpt-4o-mini only, temperature 0
- ~250 token prompt
- No increase in API calls

### Backward Compatibility:
- **Old calls** keep their v2 `signalType` values and aggregate JSON — untouched
- **`schemaVersion: 3`** on new aggregates allows version detection
- **UI** renders v2 or v3 based on `signalType` values present
- **Comparator** only compares calls within the same schema version
- **Rollback** = one-line import change in `pipeline.ts` back to v2

---

## Why v3 > v2

### Old System (v2 - Generic Behavioral Markers):
❌ `commitment_event` - doesn't capture quality dimensions
❌ `blocker_event` - binary, no severity gradient
❌ `resolution_attempt` - doesn't link to constraints
❌ `control_event` / `stall_event` - overlapping concepts

### New System (v3 - Decision-Grade Markers):
✅ `commitment_quality` → tracks who initiated, reversibility, timing
✅ `customer_constraint` → severity, explicit/implicit distinction
✅ `agent_response_strategy` → links to constraints, enables latency computation
✅ `control_dynamics` → unified control tracking with recovery events

**Result:** Future AI agents can learn:
- Which constraints matter most
- How quickly to respond to constraints
- When to recover control
- When customers are ready to commit
- Which strategies work for which constraints

---

## Key Metrics for Wins

Ranked by correlation with successful outcomes:

1. **Avg Resolution Latency** (lower = better)
   How quickly agent responds to constraints

2. **Control Recovery Before Commitment** (higher = better)
   Recovering control before pushing for commitment

3. **Commitment After Unresolved Constraint** (lower = better)
   RED FLAG — pushing commitment with unresolved concerns

4. **Unresolved Constraint Count** (lower = better)
   Constraints that never got addressed

5. **Time to First Constraint** (varies)
   When the first constraint appears

6. **Constraint Severity** (varies)
   How severe the constraints are

---

## Testing

1. **Create new analysis** at `/calls/new`
2. **Watch extraction** - will use new v3 marker types
3. **View call detail** - see v3 markers with severity, targeting, etc.
4. **Check aggregates** - v3 metrics (resolution latency, control recovery, etc.)
5. **Compare outcomes** - v3 comparison with Cohen's d effect size
6. **Generate playbook** - v3 prompt sections (Constraint Response, Resolution Timing, Control Recovery, Commitment Approach)

Old analyses (with v2 signals) will still display fine, but new ones use the improved v3 system.

---

---

# LEGACY: v2 Agent-Trainable Marker System

*This section documents the v2 system for reference. New calls use v3 above.*

## Overview

The v2 system extracted **actionable, agent-trainable markers** instead of generic sentiment signals. These markers represented **state changes** for training AI agents.

---

## v2 Marker Types

### 1. **commitment_event**
**When customer makes or avoids commitment**

Subtypes:
- `explicit_commitment` - Clear agreement to action
- `conditional_commitment` - Agreement with conditions
- `deferral` - Postponing decision
- `refusal` - Clear rejection

### 2. **blocker_event**
**Obstacles preventing forward progress**

Types:
- `tax_concern`
- `compliance_claim`
- `authority_required`
- `trust_issue`
- `financial_constraint`
- `other`

Fields: `resolved` (boolean)

### 3. **resolution_attempt**
**Agent tries to resolve issue/blocker**

Strategies:
- `reframe`
- `clarification`
- `authority_transfer`
- `reassurance`
- `alternative_offer`
- `other`

### 4. **control_event**
**Conversational control shifts**

Fields:
- `controller`: `agent` | `customer`
- `reason`: `questioning` | `correcting` | `interrupting` | `redirecting` | `asserting`

### 5. **stall_event**
**Conversation lacks progress**

Types:
- `pause`
- `circular_discussion`
- `repeated_deferral`
- `lack_of_progress`

---

## v2 Auxiliary Metrics

- `call_tone`: `neutral` | `tense` | `cooperative`
- `financial_discussion`: boolean
- `mentions_taxes`, `mentions_fees`, `mentions_refunds`, `mentions_withdrawals`: boolean
- `compliance_language`: boolean
- `agent_turns`, `customer_turns`: number
- `clear_outcome`: boolean
- `predicted_outcome`: `success` | `failure`
- `outcome_confidence`: number (0-1)
- `outcome_reasoning`: string (max 150)

---

## v2 Files (preserved for rollback)

- **Extraction:** `app/lib/signals-v2.ts`
- **Aggregation:** `app/lib/aggregator.ts`
- **Comparison:** `app/lib/comparator.ts` (supports v2)

**Cost:** ~$0.0015 per 5-min call (same as v3)
