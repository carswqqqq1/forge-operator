import { describe, it, expect } from "vitest";
import { validateNVIDIAKey, NVIDIA_MODELS } from "./nvidia";

describe("NVIDIA API Client", () => {
  it("should validate NVIDIA API key", async () => {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.warn("NVIDIA_API_KEY not set, skipping validation test");
      expect(true).toBe(true);
      return;
    }

    const isValid = await validateNVIDIAKey(apiKey);
    expect(isValid).toBe(true);
  });

  it("should have NVIDIA models defined", () => {
    expect(NVIDIA_MODELS.length).toBeGreaterThan(0);
    expect(NVIDIA_MODELS[0]).toHaveProperty("id");
    expect(NVIDIA_MODELS[0]).toHaveProperty("name");
    expect(NVIDIA_MODELS[0]).toHaveProperty("context_window");
  });

  it("should include DeepSeek and Llama models", () => {
    const modelIds = NVIDIA_MODELS.map(m => m.id);
    expect(modelIds.some(id => id.includes("deepseek") || id.includes("llama"))).toBe(true);
  });
});
