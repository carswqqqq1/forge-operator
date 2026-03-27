import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CostPreview, RunStatus } from "@forge/shared";
import { buildCostPreview, planRun } from "@forge/agent";

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  createdAt: string;
};

export type ConversationEvent = {
  label: string;
  body: string;
  type: "status_changed" | "tool_started" | "tool_completed" | "artifact_created" | "approval_requested";
  at: string;
};

export type ConversationArtifact = {
  name: string;
  kind: "screenshot" | "document" | "json" | "text";
  detail: string;
};

export type DemoConversation = {
  id: string;
  title: string;
  prompt: string;
  model: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
  preview: CostPreview;
  summary: string;
  plan: string[];
  finalResponse: string;
  stepLabel: string;
  artifacts: ConversationArtifact[];
  events: ConversationEvent[];
  messages: ConversationMessage[];
};

const DATA_DIR = path.resolve(process.cwd(), "..", "..", ".forge-data");
const DATA_FILE = path.join(DATA_DIR, "conversations.json");

async function ensureStore() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify({ conversations: [] }, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStore();
  const raw = await readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw) as { conversations?: DemoConversation[] };
  return parsed.conversations || [];
}

async function writeStore(conversations: DemoConversation[]) {
  await ensureStore();
  await writeFile(DATA_FILE, JSON.stringify({ conversations }, null, 2), "utf8");
}

function nowIso() {
  return new Date().toISOString();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function trimmedTitle(prompt: string) {
  const text = prompt.trim().replace(/\s+/g, " ");
  return text.length > 56 ? `${text.slice(0, 53)}...` : text;
}

function defaultArtifacts(): ConversationArtifact[] {
  return [
    { name: "task-brief.md", kind: "document", detail: "Objective, execution plan, and result framing." },
    { name: "run-findings.json", kind: "json", detail: "Structured payload with task metadata and results." },
    { name: "workspace-snapshot.txt", kind: "text", detail: "Replayable state snapshot for inspection." },
  ];
}

async function callNvidiaJson(prompt: string, history: ConversationMessage[] = []) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseUrl = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
  const model = process.env.NVIDIA_MODEL_REASONING || "deepseek-ai/deepseek-v3.1";

  if (!apiKey) {
    return null;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are Forge, an execution agent. Return JSON only. Include keys: summary, plan, finalResponse. summary is one sentence. plan is an array of 3 to 5 short steps. finalResponse is the direct helpful answer.",
        },
        ...history.slice(-8).map((message) => ({
          role: message.role === "tool" ? "assistant" : message.role,
          content: message.content,
        })),
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" },
      extra_body: { chat_template_kwargs: { thinking: false } },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content) as { summary?: string; plan?: string[]; finalResponse?: string };
    return {
      model: payload.model || model,
      summary: parsed.summary?.trim(),
      plan: Array.isArray(parsed.plan) ? parsed.plan.filter(Boolean).slice(0, 5) : undefined,
      finalResponse: parsed.finalResponse?.trim(),
    };
  } catch {
    return null;
  }
}

function fallbackResponse(prompt: string) {
  const planned = planRun(prompt);
  return {
    model: process.env.NVIDIA_MODEL_REASONING || "deepseek-ai/deepseek-v3.1",
    summary: "Forge generated a first-pass plan and response using the local fallback path.",
    plan: planned.actions.slice(0, 4).map((action) => action.input),
    finalResponse: `Here is a first-pass response for: ${prompt}\n\n1. Define the objective clearly.\n2. Break it into a short actionable plan.\n3. Review the generated artifacts and adjust the next step.`,
  };
}

export async function createConversation(prompt: string) {
  const conversations = await readStore();
  const id = `run_${Date.now()}`;
  const createdAt = new Date();
  const preview = buildCostPreview(prompt);
  const modelOutput = (await callNvidiaJson(prompt)) || fallbackResponse(prompt);
  const title = trimmedTitle(prompt);

  const conversation: DemoConversation = {
    id,
    title,
    prompt,
    model: modelOutput.model,
    status: preview.riskLevel === "high" ? "waiting_approval" : "completed",
    createdAt: createdAt.toISOString(),
    updatedAt: new Date(createdAt.getTime() + 1_000).toISOString(),
    preview,
    summary:
      modelOutput.summary ||
      (preview.riskLevel === "high"
        ? "Forge drafted the plan and paused before a risky boundary."
        : "Forge generated a first-pass answer and a replayable plan."),
    plan: modelOutput.plan?.length ? modelOutput.plan : fallbackResponse(prompt).plan,
    finalResponse: modelOutput.finalResponse || fallbackResponse(prompt).finalResponse,
    stepLabel: preview.riskLevel === "high" ? "Awaiting approval" : "Execution complete",
    artifacts: defaultArtifacts(),
    events: [
      {
        label: "Run created",
        body: `Forge accepted the task: "${title}".`,
        type: "status_changed",
        at: formatTime(createdAt),
      },
      {
        label: "Planner generated the execution outline",
        body: "The run was split into explicit steps with cost and risk estimation.",
        type: "tool_started",
        at: formatTime(new Date(createdAt.getTime() + 60_000)),
      },
      {
        label: "First response generated",
        body: "Forge returned an initial answer and attached the first artifact set.",
        type: "tool_completed",
        at: formatTime(new Date(createdAt.getTime() + 120_000)),
      },
    ],
    messages: [
      { id: `${id}_msg_user_1`, role: "user", content: prompt, createdAt: createdAt.toISOString() },
      {
        id: `${id}_msg_assistant_1`,
        role: "assistant",
        content: modelOutput.finalResponse || fallbackResponse(prompt).finalResponse,
        createdAt: new Date(createdAt.getTime() + 1_000).toISOString(),
      },
    ],
  };

  conversations.push(conversation);
  await writeStore(conversations);
  return conversation;
}

export async function sendConversationMessage(conversationId: string, content: string) {
  const conversations = await readStore();
  const index = conversations.findIndex((entry) => entry.id === conversationId);
  if (index === -1) {
    return null;
  }

  const conversation = conversations[index]!;
  conversation.messages.push({
    id: `${conversationId}_msg_user_${conversation.messages.length + 1}`,
    role: "user",
    content,
    createdAt: nowIso(),
  });

  const modelOutput = (await callNvidiaJson(content, conversation.messages)) || fallbackResponse(content);
  const assistantContent = modelOutput.finalResponse || fallbackResponse(content).finalResponse;
  conversation.messages.push({
    id: `${conversationId}_msg_assistant_${conversation.messages.length + 1}`,
    role: "assistant",
    content: assistantContent,
    createdAt: nowIso(),
  });

  conversation.updatedAt = nowIso();
  conversation.finalResponse = assistantContent;
  conversation.summary = modelOutput.summary || conversation.summary;
  conversation.plan = modelOutput.plan?.length ? modelOutput.plan : conversation.plan;
  conversation.events.unshift({
    label: "Follow-up completed",
    body: "Forge generated a new response using the current conversation context.",
    type: "tool_completed",
    at: formatTime(new Date()),
  });

  conversations[index] = conversation;
  await writeStore(conversations);
  return conversation;
}

export async function listConversations() {
  const conversations = await readStore();
  return conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getConversation(conversationId: string) {
  const conversations = await readStore();
  return conversations.find((entry) => entry.id === conversationId) ?? null;
}
