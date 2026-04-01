import * as db from "../../db";
import * as nvidia from "../../nvidia";
import { buildForgeSystemMessages } from "../promptContext";

/**
 * AutoDream Service
 * Periodically consolidates episodic memories into durable ones.
 * Inspired by Claude Code's "dream" system.
 */

export const DREAM_PROMPT = `
# Dream: Memory Consolidation
You are performing a "dream" — a reflective pass over the agent's memory. 
Your goal is to synthesize recent episodic memories (task logs, specific facts) into durable, well-organized memories.

## Phase 1: Review
- Look at the recent episodic memories provided.
- Identify patterns, user preferences, or project-specific facts that should be permanent.

## Phase 2: Consolidate
- If an episodic memory is actually a long-term fact (e.g., "User prefers tabs over spaces"), propose it as a DURABLE memory.
- If multiple episodic memories relate to the same topic, merge them into a single clear DURABLE memory.
- Identify stale or contradictory memories that should be removed.

## Phase 3: Output
Provide a JSON response with the following structure:
{
  "to_store": [
    { "category": "preference|fact|context", "key": "short-key", "value": "consolidated information", "type": "durable" }
  ],
  "to_delete": [
    { "id": 123 }
  ],
  "reasoning": "Brief explanation of why these changes were made."
}
`;

export async function runDream(userId: number) {
  console.log(`[AutoDream] Starting dream for user ${userId}...`);

  try {
    // 1. Fetch recent episodic memories
    const episodicMemories = await db.recallMemory(userId);
    const recentEpisodic = episodicMemories.filter(m => m.type === "episodic");

    if (recentEpisodic.length < 3) {
      console.log("[AutoDream] Not enough episodic memory to dream. Skipping.");
      return;
    }

    // 2. Prepare prompt with memories
    const memoryCtx = recentEpisodic.map(m => `ID: ${m.id} | [${m.category}] ${m.key}: ${m.value}`).join("\n");
    
    const messages = [
      ...(await buildForgeSystemMessages(userId)),
      { role: "system" as const, content: DREAM_PROMPT },
      { role: "user" as const, content: `Here are the recent episodic memories to consolidate:\n\n${memoryCtx}` }
    ];

    // 3. Call LLM to consolidate
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey) return;

    let response = "";
    const stream = await nvidia.nvidiaStreamChat(nvidiaKey, {
      model: "meta/llama-3.1-70b-instruct",
      messages: messages.map(m => ({ role: m.role as any, content: m.content })),
      temperature: 0.3,
      max_tokens: 2048
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) response += delta;
    }

    // 4. Parse and apply changes
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const result = JSON.parse(jsonMatch[0]);

    // Apply deletions
    if (result.to_delete) {
      for (const item of result.to_delete) {
        await db.deleteMemory(item.id);
      }
    }

    // Apply new durable memories
    if (result.to_store) {
      for (const item of result.to_store) {
        await db.storeMemory(userId, item.category, item.key, item.value, "auto-dream", "durable");
      }
    }

    console.log(`[AutoDream] Dream completed for user ${userId}. ${result.reasoning}`);
  } catch (error) {
    console.error("[AutoDream] Dream failed:", error);
  }
}
