import { fail, ok, readJson } from "@/lib/server/route-utils";
import { createConversation, listConversations } from "@/lib/server/demo-chat-store";

export const dynamic = "force-dynamic";

type CreateConversationBody = {
  prompt?: string;
};

export async function GET() {
  return ok({ conversations: await listConversations() });
}

export async function POST(request: Request) {
  const body = await readJson<CreateConversationBody>(request);
  const prompt = body?.prompt?.trim();

  if (!prompt) {
    return fail("Prompt is required.");
  }

  const conversation = await createConversation(prompt);
  return ok({ conversation });
}
