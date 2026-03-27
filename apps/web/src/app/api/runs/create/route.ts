import { buildCostPreview } from "@forge/agent";
import { fail, ok, readJson } from "@/lib/server/route-utils";

type CreateRunBody = {
  prompt?: string;
  projectId?: string;
};

export async function POST(request: Request) {
  const body = await readJson<CreateRunBody>(request);
  const prompt = body?.prompt?.trim();

  if (!prompt) {
    return fail("Prompt is required.");
  }

  const now = new Date().toISOString();
  const runId = `run_${Date.now()}`;
  const preview = buildCostPreview(prompt);

  return ok({
    run: {
      id: runId,
      prompt,
      projectId: body?.projectId || "default-project",
      status: "queued",
      createdAt: now,
      updatedAt: now,
      preview,
    },
  });
}
