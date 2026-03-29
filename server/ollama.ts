export type OllamaMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type OllamaTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

type OllamaChatParams = {
  model: string;
  messages: OllamaMessage[];
};

type OllamaChatResponse = {
  message: {
    role: "assistant";
    content: string;
  };
};

export function getOllamaUrl() {
  const host = process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  return host.startsWith("http") ? host : `http://${host}`;
}

export async function checkOllamaHealth(): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const response = await fetch(`${getOllamaUrl()}/api/version`);
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const data: any = await response.json();
    return { ok: true, version: data.version || "unknown" };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Unable to reach Ollama" };
  }
}

export async function listModels(): Promise<Array<{ name: string }>> {
  try {
    const response = await fetch(`${getOllamaUrl()}/api/tags`);
    if (!response.ok) return [];
    const data: any = await response.json();
    return Array.isArray(data.models)
      ? data.models.map((model: any) => ({ name: model.name }))
      : [];
  } catch {
    return [];
  }
}

export async function chatCompletion(params: OllamaChatParams): Promise<OllamaChatResponse> {
  const response = await fetch(`${getOllamaUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama chat failed with HTTP ${response.status}`);
  }

  const data: any = await response.json();
  return {
    message: {
      role: "assistant",
      content: data?.message?.content || "",
    },
  };
}
