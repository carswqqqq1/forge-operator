import * as db from "../db";

export const TIER_CONFIG = {
  lite: {
    name: "Lite",
    monthlyCredits: 100,
    costPerCredit: 0.01,
    models: ["meta/llama-3.1-8b-instruct"],
    rateLimit: 10, // requests per minute
  },
  core: {
    name: "Core",
    monthlyCredits: 1000,
    costPerCredit: 0.005,
    models: ["meta/llama-3.1-70b-instruct", "llama3"],
    rateLimit: 60,
  },
  max: {
    name: "Max",
    monthlyCredits: 10000,
    costPerCredit: 0.002,
    models: ["deepseek-ai/deepseek-v3.1", "meta/llama-3.1-70b-instruct", "llama3"],
    rateLimit: 300,
  },
} as const;

export type Tier = keyof typeof TIER_CONFIG;

export const MODEL_COST_MULTIPLIER: Record<string, number> = {
  "meta/llama-3.1-8b-instruct": 0.35,
  "meta/llama-3.1-70b-instruct": 1.0,
  "deepseek-ai/deepseek-v3.1": 1.8,
  llama3: 1.0,
};

export function getTierForModel(model?: string): Tier {
  if (!model) return "core";
  if (model === "meta/llama-3.1-8b-instruct") return "lite";
  if (model === "deepseek-ai/deepseek-v3.1") return "max";
  return "core";
}

export function calculateCreditCost(tokenCount: number, tier: Tier): number {
  const baseCost = 0.6;
  const tokenCost = Math.max(1, tokenCount) / 120;
  const multiplier = MODEL_COST_MULTIPLIER[tier] || 1;
  return Number((baseCost + tokenCost * multiplier).toFixed(1));
}

export async function getUserCredits(userId: number): Promise<number> {
  // Placeholder: In production, fetch from user profile or billing system
  return 851;
}

export async function deductCredits(
  userId: number,
  amount: number,
  tier: Tier,
  model: string,
  tokenCount: number,
  conversationId?: number
): Promise<{ success: boolean; remainingCredits: number }> {
  try {
    const currentCredits = await getUserCredits(userId);

    if (currentCredits < amount) {
      return {
        success: false,
        remainingCredits: currentCredits,
      };
    }

    // Log usage event
    await db.consumeCredits({
      userId,
      amount,
      tier,
      model,
      tokenCount,
      conversationId,
      note: `Used for ${model}`,
    });

    return {
      success: true,
      remainingCredits: currentCredits - amount,
    };
  } catch (error) {
    console.error("[Billing] Failed to deduct credits:", error);
    throw error;
  }
}

export async function getUsageStats(userId: number, days: number = 30) {
  // Placeholder: Aggregate usage events
  return {
    totalCreditsUsed: 0,
    totalRequests: 0,
    averageCreditsPerRequest: 0,
    modelBreakdown: {},
  };
}

export function formatCredits(credits: number): string {
  return `$${(credits * 0.01).toFixed(2)}`;
}

export function estimateCost(tokenCount: number, tier: Tier): string {
  const credits = calculateCreditCost(tokenCount, tier);
  return formatCredits(credits);
}
