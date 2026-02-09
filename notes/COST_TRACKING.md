# Cellory Cost Tracking

**Total Budget: $5.00**

---

## Cost Breakdown by Operation

### 1. Whisper Transcription
- **Model:** `whisper-1`
- **Pricing:** $0.006 per minute of audio
- **Usage Strategy:** Pre-transcribe offline, use text imports for testing
- **Demo Budget:** $0.50 (max ~83 minutes of audio)

**Recommendation:** Use 2-3 short demo files (2-5 min each) = ~$0.06

---

### 2. Signal Extraction (gpt-4o-mini)
- **Model:** `gpt-4o-mini` (REQUIRED - DO NOT CHANGE)
- **Pricing:**
  - Input: $0.150 per 1M tokens
  - Output: $0.600 per 1M tokens
- **Usage:** 1 call per chunk (conservative chunking: 75s chunks)
- **Estimated per call:**
  - 5-min call → 4 chunks → 4 API calls
  - ~1,000 input tokens per call (system + chunk)
  - ~200 output tokens per call (signals JSON)
  - Total: ~5,000 tokens = $0.0015 per 5-min call

**Demo Budget:** $1.50 (process ~1,000 calls or ~80 hours of audio)

**Actual Demo Use:** Process 10-20 calls = ~$0.03

---

### 3. Aggregation (Pure Computation)
- **Cost:** $0.00 (no API calls)
- **Operations:** Signal counting, statistics, timing analysis
- **Speed:** Instant

---

### 4. Comparison (Pure Computation)
- **Cost:** $0.00 (no API calls)
- **Operations:** Mean calculations, difference ranking
- **Speed:** Instant

---

### 5. Playbook Generation (gpt-4o)
- **Model:** `gpt-4o` (ONLY for playbooks)
- **Pricing:**
  - Input: $2.50 per 1M tokens
  - Output: $10.00 per 1M tokens
- **Usage:** 1 call per batch of analyzed calls (NOT per call)
- **Estimated per playbook:**
  - ~1,000 input tokens (comparison summary)
  - ~1,000 output tokens (playbook markdown, capped at 1500)
  - Total: ~$0.01 per playbook

**Demo Budget:** $3.00 (300 playbook generations)

**Actual Demo Use:** Generate 3-5 playbooks = ~$0.05

---

## Demo Scenario Cost Estimate

### Minimal Demo (10 calls)
- Transcription: 2 demo files × 5 min × $0.006/min = **$0.06**
- Signal extraction: 10 calls × $0.0015 = **$0.015**
- Aggregation: **$0.00**
- Comparison: **$0.00**
- Playbook: 2 playbooks × $0.01 = **$0.02**

**Total: ~$0.10** (2% of budget)

---

### Full Demo (50 calls)
- Transcription: 5 demo files × 5 min × $0.006/min = **$0.15**
- Signal extraction: 50 calls × $0.0015 = **$0.075**
- Aggregation: **$0.00**
- Comparison: **$0.00**
- Playbook: 5 playbooks × $0.01 = **$0.05**

**Total: ~$0.28** (5.6% of budget)

---

## Cost Discipline Rules (STRICTLY ENFORCED)

### ✅ ALLOWED
- Whisper for 2-3 demo transcripts
- gpt-4o-mini for signal extraction (1 call per chunk)
- gpt-4o for playbook generation (1 call per batch)
- Unlimited computation (aggregation, comparison)

### ❌ FORBIDDEN
- ❌ gpt-4o for signal extraction (20x more expensive)
- ❌ GPT-5 models
- ❌ o1/o3 models
- ❌ Realtime/audio models
- ❌ Vision models
- ❌ Embeddings (unless explicitly requested)
- ❌ Chain-of-thought prompts
- ❌ Multi-pass refinement
- ❌ Auto-regeneration loops
- ❌ Retry logic on LLM calls (accept failures)
- ❌ Background polling that triggers LLM calls

### Pipeline Constraints
- Each transcript processed ONCE
- No reprocessing unless explicitly triggered
- Chunking: 75s per chunk (conservative)
- Empty LLM responses accepted (no retries)
- Playbook generation: 1 call per entire batch

---

## Monitoring

Track actual usage in production:
```bash
# OpenAI dashboard: https://platform.openai.com/usage
# Monitor daily spend
# Set hard limit at $5 in OpenAI account settings
```

---

## Risk Mitigation

1. **Set OpenAI account hard limit:** $5.00
2. **Use gpt-4o-mini exclusively for signals** (not gpt-4o)
3. **Conservative chunking** (75s, not 30s)
4. **Single playbook generation** per batch
5. **No retries** on API failures
6. **Pre-transcribe demo audio** (don't upload in prod)

---

## Actual Cost Log

| Date | Operation | Calls | Cost | Notes |
|------|-----------|-------|------|-------|
| TBD  | Initial demo setup | 0 | $0.00 | Setup phase |

**Running Total: $0.00 / $5.00**
