# AI Logic Flow in Cellory

## 🎯 Where the AI Actually Runs

### **Only 2 Places Use AI Models:**
1. **Signal Extraction** (`app/lib/signals.ts`) - gpt-4o-mini ✅
2. **Playbook Generation** (`app/lib/playbook-generator.ts`) - gpt-4o (not implemented in UI yet)

Everything else is **pure computation** (zero cost).

---

## 📊 Full Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ USER ACTION: Click "Start Analysis" on /calls/new              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ API: POST /api/calls                                            │
│ File: app/api/calls/route.ts                                    │
│                                                                 │
│ 1. Create Call record in database (status: "pending")          │
│ 2. Call processCallAsync(callId)                               │
│ 3. Return immediately (202 Created)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PIPELINE START: processCall()                                   │
│ File: app/lib/pipeline.ts                                       │
│ Cost: ~$0.0015 per 5-min call                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Chunking (Pure Computation - $0)                       │
│ File: app/lib/chunker.ts                                        │
│                                                                 │
│ Input:  transcript.content (full text)                         │
│         transcript.wordTimestamps (optional)                    │
│         transcript.durationSeconds                              │
│                                                                 │
│ Logic:  • Split into 75-second chunks                          │
│         • Add 10-second overlap                                 │
│         • Use word timestamps if available                      │
│                                                                 │
│ Output: Chunk[] = [                                            │
│           {                                                     │
│             chunkIndex: 0,                                      │
│             text: "Hello, thank you for...",                   │
│             startTime: 0,                                       │
│             endTime: 75,                                        │
│             wordCount: 150                                      │
│           },                                                    │
│           ...                                                   │
│         ]                                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Signal Extraction (AI - gpt-4o-mini)                   │
│ File: app/lib/signals.ts                                        │
│ Cost: ~$0.0015 per 5-min call                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
       ┌──────────────────────┴──────────────────────┐
       ↓ FOR EACH CHUNK (sequential)                 │
┌─────────────────────────────────────────────────────────────────┐
│ extractSignals(chunkText, startTime, endTime)                  │
│                                                                 │
│ AI Call:                                                        │
│   Model: openai("gpt-4o-mini")                                 │
│   Method: generateObject() from Vercel AI SDK                  │
│   Schema: Zod schema (type-safe)                               │
│   Temperature: 0 (deterministic)                               │
│                                                                 │
│ Prompt:                                                         │
│   "Extract behavioral signals from this financial call         │
│    transcript chunk.                                           │
│                                                                 │
│    Timeframe: 0.0s - 75.0s                                     │
│                                                                 │
│    Signal types:                                               │
│    - objection: Customer pushes back or resists                │
│    - escalation: Tension/frustration increases                 │
│    - agreement: Customer shows buy-in or acceptance            │
│    - uncertainty: Customer expresses doubt or confusion        │
│    - resolution_attempt: Agent tries to resolve an issue       │
│                                                                 │
│    Transcript:                                                 │
│    [chunk text here]                                           │
│                                                                 │
│    Return signals with type, confidence (0-1), startTime,      │
│    endTime (within chunk timeframe), and brief description.    │
│    Empty array if no signals detected."                        │
│                                                                 │
│ Response (JSON):                                               │
│   {                                                            │
│     "signals": [                                               │
│       {                                                        │
│         "type": "objection",                                   │
│         "confidence": 0.85,                                    │
│         "startTime": 42.3,                                     │
│         "endTime": 48.7,                                       │
│         "data": {                                              │
│           "description": "Customer expresses frustration..."   │
│         }                                                      │
│       },                                                       │
│       ...                                                      │
│     ]                                                          │
│   }                                                            │
│                                                                 │
│ Error Handling:                                                │
│   • No retries (cost discipline)                               │
│   • Returns [] on error                                        │
│   • Logs error to console                                      │
└─────────────────────────────────────────────────────────────────┘
       │
       │ (Wait 100ms between chunks for rate limit)
       │
       └──────────────────────┬──────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Collect all signals from all chunks                            │
│ Signal[] = [signal1, signal2, signal3, ...]                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Persist Signals to Database                            │
│                                                                 │
│ prisma.callSignal.createMany({                                 │
│   data: signals.map(signal => ({                               │
│     callId,                                                     │
│     chunkIndex,                                                 │
│     signalType: signal.type,                                    │
│     signalData: signal.data,                                    │
│     confidence: signal.confidence,                              │
│     startTime: signal.startTime,                                │
│     endTime: signal.endTime,                                    │
│   }))                                                           │
│ })                                                              │
│                                                                 │
│ Update call status: "aggregating"                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Aggregation (Pure Computation - $0)                    │
│ File: app/lib/aggregator.ts                                     │
│                                                                 │
│ Input:  Signal[] from previous step                            │
│         callDuration (seconds)                                  │
│                                                                 │
│ Logic:  100% pure math, no AI:                                 │
│   • Count signals by type                                      │
│   • Calculate signal density (signals per minute)              │
│   • Compute timing distributions (early/mid/late thirds)       │
│   • Calculate average confidence                               │
│   • Find signal sequences (bigrams)                            │
│   • Identify first/last occurrence of each type                │
│                                                                 │
│ Output: AggregateFeatures = {                                  │
│           signalCounts: { objection: 3, agreement: 5, ... },   │
│           totalSignals: 8,                                      │
│           signalDensity: 2.67, // per minute                   │
│           firstSignalTime: 12.5,                                │
│           lastSignalTime: 178.3,                                │
│           earlyThirdSignals: 2,                                 │
│           midThirdSignals: 4,                                   │
│           lateThirdSignals: 2,                                  │
│           avgConfidence: 0.82,                                  │
│           confidenceByType: { objection: 0.85, ... },          │
│           signalSequences: { "objection→resolution": 2 },      │
│           firstObjectionTime: 42.3,                             │
│           lastAgreementTime: 165.8,                             │
│           ...                                                   │
│         }                                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Persist Aggregates to Database                         │
│                                                                 │
│ prisma.callAggregate.create({                                  │
│   data: {                                                       │
│     callId,                                                     │
│     features: aggregates // JSON                                │
│   }                                                             │
│ })                                                              │
│                                                                 │
│ Update call status: "complete"                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ PIPELINE COMPLETE                                               │
│                                                                 │
│ Database now contains:                                          │
│   • Call record (status: "complete")                           │
│   • N CallSignal records (extracted by AI)                     │
│   • 1 CallAggregate record (computed features)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: Auto-refresh detects "complete" status               │
│ Page: /calls/[id]                                              │
│                                                                 │
│ Displays:                                                       │
│   • All signals with color-coded badges                        │
│   • Aggregates summary in sidebar                              │
│   • Full transcript                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Key AI Components Deep Dive

### **1. Signal Extraction (`app/lib/signals.ts`)**

**Function:** `extractSignals(chunkText, startTime, endTime)`

**What it does:**
- Takes a chunk of transcript text (75 seconds worth)
- Calls gpt-4o-mini via Vercel AI SDK
- Uses structured JSON output with Zod schema
- Returns array of behavioral signals

**Prompt Strategy:**
- **Minimal:** No examples, no CoT, no verbose instructions
- **Task-focused:** Just signal taxonomy + chunk text
- **Cost-optimized:** Keep it under 200 tokens

**Code:**
```typescript
const result = await generateObject({
  model: openai("gpt-4o-mini"), // CRITICAL: Must be mini, not 4o
  schema: SignalsResponseSchema,  // Zod schema for type safety
  prompt: buildPrompt(chunkText, startTime, endTime),
  temperature: 0, // Deterministic
});
```

**Cost per chunk:** ~$0.0003 (150 input + 200 output tokens)

---

### **2. Batch Processing (`extractSignalsBatch`)**

**Function:** `extractSignalsBatch(chunks)`

**What it does:**
- Loops through all chunks sequentially
- Calls `extractSignals()` for each chunk
- Adds 100ms delay between calls (rate limit protection)
- Collects all signals into single array

**Why sequential, not parallel?**
- Rate limits (OpenAI has per-minute limits)
- Cost tracking (easier to debug)
- Only adds ~5-10 seconds for typical call

---

### **3. Aggregation (`app/lib/aggregator.ts`)**

**Function:** `aggregateSignals(signals, callDuration)`

**What it does:**
- **100% pure computation** (no AI, no API calls)
- Counts, averages, distributions, sequences
- Fully deterministic and auditable
- Instant execution

**Why pure computation?**
- FREE (no API costs)
- FAST (no network latency)
- AUDITABLE (can verify math)
- DETERMINISTIC (same input = same output)

---

## 📂 File Reference

| File | Purpose | AI Used? | Cost |
|------|---------|----------|------|
| `app/lib/chunker.ts` | Split transcript into chunks | ❌ No | $0 |
| `app/lib/signals.ts` | Extract signals with gpt-4o-mini | ✅ Yes | ~$0.0015/call |
| `app/lib/aggregator.ts` | Compute features from signals | ❌ No | $0 |
| `app/lib/comparator.ts` | Compare success vs failure | ❌ No | $0 |
| `app/lib/playbook-generator.ts` | Generate playbook with gpt-4o | ✅ Yes | ~$0.01/batch |
| `app/lib/pipeline.ts` | Orchestrate all steps | ❌ No | $0 |

---

## 🎛️ Tuning Parameters

### **Chunking (app/lib/chunker.ts)**
```typescript
const CHUNK_DURATION = 75; // seconds (60-90 range)
const OVERLAP_DURATION = 10; // seconds
```
- **Lower chunk size** = more API calls = higher cost
- **Higher chunk size** = less context = worse signals
- **75s is optimal** for cost/quality tradeoff

### **Signal Extraction (app/lib/signals.ts)**
```typescript
model: openai("gpt-4o-mini") // DO NOT CHANGE
temperature: 0 // Deterministic
```
- **Temperature 0** = consistent results
- **gpt-4o-mini** = 20x cheaper than gpt-4o

### **Batch Processing**
```typescript
await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
```
- Prevents rate limit errors
- Adds minimal latency (~500ms for 5 chunks)

---

## 🐛 Debugging

**See AI calls in action:**
```bash
# Start dev server
bun dev

# Watch server logs when processing a call
# You'll see:
[callId] Chunking transcript...
[callId] Created 4 chunks
[callId] Extracting signals...
[callId] Extracted 8 signals
[callId] Aggregating signals...
[callId] Pipeline complete!
```

**Check if AI is actually running:**
1. Create a call analysis
2. Watch browser network tab for `/api/calls` POST
3. Check server console for extraction logs
4. Check OpenAI dashboard for API usage

---

## 💡 Pro Tips

1. **Test with short transcripts first** (~1-2 min) to minimize cost
2. **Check signal quality** - if they're bad, tweak the prompt in `signals.ts`
3. **Monitor costs** in OpenAI dashboard
4. **Don't retry on errors** - accept empty signals and move on
5. **Keep chunks at 75s** unless you have good reason to change
