/**
 * Ollama HTTP API Client
 * Connects to localhost:11434 for local model inference
 */

const OLLAMA_BASE = process.env.OLLAMA_HOST || "http://localhost:11434";

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_ctx?: number;
    num_predict?: number;
  };
  tools?: OllamaTool[];
}

export interface OllamaTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string; enum?: string[] }>;
      required: string[];
    };
  };
}

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
    tool_calls?: Array<{
      function: { name: string; arguments: Record<string, unknown> };
    }>;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/** Check if Ollama is running and reachable */
export async function checkOllamaHealth(): Promise<{ ok: boolean; version?: string; error?: string }> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/version`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json() as { version: string };
    return { ok: true, version: data.version };
  } catch (e: any) {
    return { ok: false, error: e.message || "Connection failed" };
  }
}

/** List all locally available models */
export async function listModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json() as { models: OllamaModel[] };
    return data.models || [];
  } catch {
    return [];
  }
}

/** Get details for a specific model */
export async function showModel(name: string): Promise<any> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/show`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Non-streaming chat completion */
export async function chatCompletion(req: OllamaChatRequest): Promise<OllamaStreamChunk> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...req, stream: false }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }
  return await res.json() as OllamaStreamChunk;
}

/**
 * Streaming chat completion — returns a ReadableStream of chunks.
 * Each chunk is a JSON line from the Ollama API.
 */
export async function chatCompletionStream(req: OllamaChatRequest): Promise<ReadableStream<OllamaStreamChunk>> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...req, stream: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<OllamaStreamChunk>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.trim()) {
          try {
            const chunk = JSON.parse(line) as OllamaStreamChunk;
            controller.enqueue(chunk);
          } catch {
            // skip malformed lines
          }
        }
      }
    },
  });
}

/** Pull (download) a model */
export async function pullModel(name: string): Promise<ReadableStream<any>> {
  const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, stream: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pull failed ${res.status}: ${text}`);
  }
  return res.body as ReadableStream;
}

/** Delete a model */
export async function deleteModel(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Get the Ollama base URL for display */
export function getOllamaUrl(): string {
  return OLLAMA_BASE;
}
