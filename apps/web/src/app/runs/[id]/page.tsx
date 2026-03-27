import { AppShell } from "@/components/app-shell";
import { RunConversation } from "@/components/run-conversation";

type RunDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;

  return (
    <AppShell title="Conversation" subtitle="Forge keeps the prompt, replies, plan, artifacts, and execution timeline together.">
      <RunConversation conversationId={id} />
    </AppShell>
  );
}
