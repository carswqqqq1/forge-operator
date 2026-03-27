import { fail, ok, readJson } from "@/lib/server/route-utils";
import { sendConversationMessage } from "@/lib/server/demo-chat-store";

type SendMessageBody = {
  conversationId?: string;
  content?: string;
};

export async function POST(request: Request) {
  const body = await readJson<SendMessageBody>(request);
  const conversationId = body?.conversationId?.trim();
  const content = body?.content?.trim();

  if (!conversationId) {
    return fail("conversationId is required.");
  }

  if (!content) {
    return fail("content is required.");
  }

  const conversation = await sendConversationMessage(conversationId, content);

  if (!conversation) {
    return fail("Conversation not found.", 404);
  }

  return ok({ conversation, message: conversation.messages.at(-1) });
}
