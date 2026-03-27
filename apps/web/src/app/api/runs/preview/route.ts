import { buildCostPreview } from "@forge/agent";
import type { ModelProvider } from "@forge/shared";
import { fail, ok, readJson } from "@/lib/server/route-utils";

type PreviewBody = {
  prompt?: string;
  provider?: ModelProvider;
};

export async function POST(request: Request) {
  const body = await readJson<PreviewBody>(request);
  const prompt = body?.prompt?.trim();

  if (!prompt) {
    return fail("Prompt is required.");
  }

  return ok({
    preview: buildCostPreview(prompt, body?.provider || "nvidia_free"),
  });
}
