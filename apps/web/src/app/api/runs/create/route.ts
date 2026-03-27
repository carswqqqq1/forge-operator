import { buildCostPreview } from "@forge/agent";
import { fail, ok, readJson } from "@/lib/server/route-utils";
import { createConversation } from "@/lib/server/demo-chat-store";

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

  const conversation = await createConversation(prompt);
  const preview = buildCostPreview(prompt);

  return ok({
    run: {
      id: conversation.id,
      prompt,
      projectId: body?.projectId || "default-project",
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      preview,
    },
  });
}
