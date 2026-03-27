import { fail, ok } from "@/lib/server/route-utils";
import { getConversation } from "@/lib/server/demo-chat-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId")?.trim();

  if (!conversationId) {
    return fail("conversationId is required.");
  }

  const conversation = await getConversation(conversationId);

  if (!conversation) {
    return fail("Conversation not found.", 404);
  }

  return ok({ messages: conversation.messages });
}
