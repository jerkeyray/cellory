/**
 * Backboard API integration
 *
 * Persistent cross-call memory layer using Backboard.io:
 * - One assistant for Cellory
 * - One thread per outcome (success/failure/unknown)
 * - Behavioral summaries sent as messages
 * - RAG retrieval for playbook generation
 */

import { DecisionMarker } from "./signals-v3";
import { AggregateFeaturesV3 } from "./aggregator-v3";

// Backboard API configuration
const BACKBOARD_API_KEY = process.env.BACKBOARD_API_KEY;
const BACKBOARD_BASE_URL = 'https://app.backboard.io/api';

// Lazy-initialized IDs (created on first use)
let CELLORY_ASSISTANT_ID: string | null = null;

// Thread IDs cached after first creation (one per outcome)
const OUTCOME_THREADS: Record<'success' | 'failure' | 'unknown', string | null> = {
  success: null,
  failure: null,
  unknown: null,
};

/**
 * Get or create Cellory assistant in Backboard
 * Lazy initialization pattern - creates once, caches ID
 */
async function getOrCreateAssistant(): Promise<string> {
  // Return cached ID if available
  if (CELLORY_ASSISTANT_ID) {
    return CELLORY_ASSISTANT_ID;
  }

  if (!BACKBOARD_API_KEY) {
    throw new Error('BACKBOARD_API_KEY not configured');
  }

  try {
    // Create Cellory assistant
    const response = await fetch(`${BACKBOARD_BASE_URL}/assistants`, {
      method: 'POST',
      headers: {
        'X-API-Key': BACKBOARD_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Cellory Intelligence',
        system_prompt: 'You are Cellory\'s persistent memory layer. You store behavioral summaries from financial collection calls to help generate better playbooks over time.',
        llm_provider: 'openai',
        model_name: 'gpt-4o',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Assistant creation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    CELLORY_ASSISTANT_ID = data.assistant_id;

    console.log(`[Backboard] Created assistant: ${CELLORY_ASSISTANT_ID}`);
    return CELLORY_ASSISTANT_ID!; // Non-null assertion: we just assigned it
  } catch (error) {
    console.error('[Backboard] Assistant creation failed:', error);
    throw error;
  }
}

/**
 * Get or create thread for a specific outcome
 * Thread naming: cellory-outcome-{success|failure|unknown}
 */
async function getOrCreateThread(
  outcome: 'success' | 'failure' | 'unknown'
): Promise<string> {
  // Check cache
  if (OUTCOME_THREADS[outcome]) {
    return OUTCOME_THREADS[outcome]!;
  }

  if (!BACKBOARD_API_KEY) {
    throw new Error('BACKBOARD_API_KEY not configured');
  }

  try {
    // Get assistant ID first
    const assistantId = await getOrCreateAssistant();

    // Create thread under assistant
    const threadName = `cellory-outcome-${outcome}`;
    const response = await fetch(`${BACKBOARD_BASE_URL}/assistants/${assistantId}/threads`, {
      method: 'POST',
      headers: {
        'X-API-Key': BACKBOARD_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadata_: {
          outcome,
          name: threadName,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Thread creation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const threadId = data.thread_id;

    // Cache it
    OUTCOME_THREADS[outcome] = threadId;

    console.log(`[Backboard] Created thread ${threadId} for outcome: ${outcome}`);
    return threadId;
  } catch (error) {
    console.error('[Backboard] Thread creation failed:', error);
    throw error;
  }
}

/**
 * Build behavioral summary from v3 markers and aggregates
 * Enhanced with richer context for Backboard storage
 */
export function buildBehavioralSummary(
  markers: DecisionMarker[],
  aggregates: AggregateFeaturesV3,
  outcome: string,
  callId: string,
  transcriptContent: string
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Call Summary: ${callId}`);
  lines.push(`**Outcome**: ${outcome}`);
  lines.push(`**Analyzed**: ${new Date().toISOString()}`);
  lines.push('');

  // Key metrics from aggregates
  lines.push('## Key Metrics');
  lines.push(`- **Constraints per call**: ${aggregates.constraints_per_call}`);
  lines.push(`- **Resolution latency**: ${aggregates.avg_resolution_latency !== null ? aggregates.avg_resolution_latency.toFixed(1) + 's' : 'N/A'}`);
  lines.push(`- **Control recovery before commitment**: ${aggregates.control_recovery_before_commitment ? 'YES' : 'NO'}`);
  lines.push(`- **Unresolved constraints**: ${aggregates.unresolved_constraint_count}`);
  lines.push(`- **Control recoveries**: ${aggregates.control_recoveries}`);
  lines.push(`- **Agent control ratio**: ${(aggregates.agent_control_ratio * 100).toFixed(0)}%`);
  lines.push('');

  // Constraint types
  if (Object.keys(aggregates.constraint_type_counts || {}).length > 0) {
    lines.push('## Constraint Types');
    Object.entries(aggregates.constraint_type_counts).forEach(([type, count]) => {
      lines.push(`- **${type}**: ${count}`);
    });
    lines.push('');
  }

  // Primary constraint details
  const constraints = markers.filter((m) => m.type === "customer_constraint");
  if (constraints.length > 0 && constraints[0].type === "customer_constraint") {
    lines.push('## Primary Constraint');
    const primaryConstraint = constraints[0];
    lines.push(`- **Type**: ${primaryConstraint.constraint_type}`);
    lines.push(`- **Explicit**: ${primaryConstraint.explicit ? "yes" : "no"}`);
    lines.push(`- **Severity**: ${(primaryConstraint.severity * 100).toFixed(0)}%`);
    lines.push('');
  }

  // Resolution strategy
  const strategies = markers.filter((m) => m.type === "agent_response_strategy");
  if (strategies.length > 0 && strategies[0].type === "agent_response_strategy") {
    lines.push('## Resolution Strategy');
    const firstStrategy = strategies[0];
    lines.push(`- **Strategy**: ${firstStrategy.strategy.replace(/_/g, " ")}`);
    lines.push(`- **Target**: ${firstStrategy.target_constraint}`);
    lines.push('');
  }

  // Commitment details
  const commitments = markers.filter((m) => m.type === "commitment_quality");
  if (commitments.length > 0 && commitments[0].type === "commitment_quality") {
    lines.push('## Commitment');
    const firstCommitment = commitments[0];
    lines.push(`- **Type**: ${firstCommitment.commitment_type}`);
    lines.push(`- **Initiated by**: ${firstCommitment.initiated_by}`);
    lines.push(`- **Reversibility**: ${firstCommitment.reversibility}`);
    if (firstCommitment.time_from_last_constraint >= 0) {
      lines.push(`- **Time from last constraint**: ${firstCommitment.time_from_last_constraint.toFixed(0)}s`);
    }
    lines.push('');
  }

  // Red flags
  if (aggregates.commitment_after_unresolved_constraint) {
    lines.push('## ⚠️ Red Flags');
    lines.push('- Commitment made after unresolved constraint');
    lines.push('');
  }

  // Transcript preview (first 1500 chars for context)
  lines.push('## Transcript Preview');
  const preview = transcriptContent.slice(0, 1500);
  lines.push(preview + (transcriptContent.length > 1500 ? '...' : ''));
  lines.push('');

  lines.push('---');
  lines.push(`*Call ID: ${callId}*`);

  return lines.join('\n');
}

/**
 * Send behavioral summary to Backboard
 * Stores call summary in outcome-specific thread for RAG retrieval
 *
 * @returns Thread ID if successful, null on failure
 */
export async function sendToBackboard(
  callId: string,
  outcome: 'success' | 'failure' | 'unknown',
  markers: DecisionMarker[],
  aggregates: AggregateFeaturesV3,
  transcriptContent: string
): Promise<string | null> {

  if (!BACKBOARD_API_KEY) {
    console.warn('[Backboard] API key not configured, skipping');
    return null;
  }

  try {
    // Get or create thread for this outcome
    const threadId = await getOrCreateThread(outcome);

    // Build summary
    const summary = buildBehavioralSummary(
      markers,
      aggregates,
      outcome,
      callId,
      transcriptContent
    );

    // Send to Backboard using FormData (per API spec)
    const formData = new FormData();
    formData.append('content', summary);
    formData.append('memory', 'Auto');
    formData.append('stream', 'false');
    formData.append('send_to_llm', 'false'); // Just store, don't generate response

    const response = await fetch(
      `${BACKBOARD_BASE_URL}/threads/${threadId}/messages`,
      {
        method: 'POST',
        headers: {
          'X-API-Key': BACKBOARD_API_KEY,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backboard send failed: ${response.status} - ${errorText}`);
    }

    console.log(`[Backboard] ✓ Sent call ${callId} to thread ${threadId} (outcome: ${outcome})`);
    return threadId;
  } catch (error) {
    console.error('[Backboard] Send failed:', error);
    // Fail gracefully - don't throw
    return null;
  }
}

/**
 * Query Backboard for historical behavioral summaries (RAG)
 * Used to inject cross-call context into playbook generation
 *
 * @param outcome - Which outcome thread to query
 * @param limit - Max number of summaries to retrieve
 * @returns Array of historical summaries
 */
export async function queryBackboardForContext(
  outcome: 'success' | 'failure' | 'unknown',
  limit: number = 5
): Promise<string[]> {

  if (!BACKBOARD_API_KEY) {
    console.warn('[Backboard] API key not configured, skipping RAG query');
    return [];
  }

  try {
    const threadId = OUTCOME_THREADS[outcome];

    if (!threadId) {
      // Thread doesn't exist yet (no calls with this outcome processed)
      console.log(`[Backboard] No thread found for outcome: ${outcome}, no historical data yet`);
      return [];
    }

    // Retrieve thread with messages
    const response = await fetch(
      `${BACKBOARD_BASE_URL}/threads/${threadId}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': BACKBOARD_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backboard query failed: ${response.status}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

    // Extract content from user messages (our summaries)
    // Filter for user role to get our stored summaries, not assistant responses
    const summaries = messages
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content)
      .filter((c: string) => c && c.length > 0)
      .slice(0, limit); // Limit to requested count

    console.log(`[Backboard] Retrieved ${summaries.length} historical summaries for outcome: ${outcome}`);
    return summaries;
  } catch (error) {
    console.error('[Backboard] RAG query failed:', error);
    return [];
  }
}
