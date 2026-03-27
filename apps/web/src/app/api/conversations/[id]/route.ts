import { fail, ok } from "@/lib/server/route-utils";
import { getConversation } from "@/lib/server/demo-chat-store";

export const dynamic = "force-dynamic";

type ConversationRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: ConversationRouteProps) {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    return fail("Conversation not found.", 404);
  }

  return ok({ conversation });
}
