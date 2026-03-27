import type { CostPreview, ModelProvider } from "@forge/shared";

export function buildCostPreview(prompt: string, provider: ModelProvider = "nvidia_free"): CostPreview {
  const estimatedCredits = Math.min(24, Math.max(4, Math.ceil(prompt.length / 80)));

  return {
    estimatedCredits,
    riskLevel: prompt.toLowerCase().includes("delete") ? "high" : "medium",
    provider,
    note:
      provider === "nvidia_free"
        ? "Forge will attempt NVIDIA free endpoints first and fall back to local execution when needed."
        : "Forge will route this through your local runner and Ollama fallback path.",
  };
}
