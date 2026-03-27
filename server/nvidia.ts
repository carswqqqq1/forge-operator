/**
 * NVIDIA API Client
 * Connects to NVIDIA's free inference API for models like Llama 3, Mistral, etc.
 * Uses NVIDIA NIM (NVIDIA Inference Microservices)
 */

const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";

export interface NVIDIAModel {
  id: string;
  name: string;
  description: string;
  context_window: number;
}

// List of free NVIDIA models available
export const NVIDIA_MODELS: NVIDIAModel[] = [
  {
    id: "meta/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B Instruct",
    description: "Meta's Llama 3.1 70B instruction-tuned model",
    context_window: 128000,
  },
  {
    id: "meta/llama-3.1-8b-instruct",
    name: "Llama 3.1 8B Instruct",
    description: "Meta's Llama 3.1 8B instruction-tuned model",
    context_window: 128000,
  },
  {
    id: "mistralai/mistral-7b-instruct-v0.3",
    name: "Mistral 7B Instruct v0.3",
    description: "Mistral's 7B instruction-tuned model",
    context_window: 32000,
  },
  {
    id: "mistralai/mixtral-8x7b-instruct-v0.1",
    name: "Mixtral 8x7B Instruct",
    description: "Mistral's Mixtral 8x7B mixture of experts model",
    context_window: 32000,
  },
  {
    id: "nvidia/nemotron-4-340b-instruct",
    name: "Nemotron 4 340B Instruct",
    description: "NVIDIA's Nemotron 4 340B instruction-tuned model",
    context_window: 4096,
  },
];

export interface NVIDIAMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface NVIDIAChatRequest {
  model: string;
  messages: NVIDIAMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface NVIDIAChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface NVIDIAStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * Chat completion with NVIDIA API
 */
export async function nvidiaChat(
  apiKey: string,
  request: NVIDIAChatRequest
): Promise<NVIDIAChatResponse> {
  const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p ?? 0.9,
      max_tokens: request.max_tokens ?? 1024,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Stream chat completion with NVIDIA API
 */
export async function* nvidiaStreamChat(
  apiKey: string,
  request: NVIDIAChatRequest
): AsyncGenerator<NVIDIAStreamChunk> {
  const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p ?? 0.9,
      max_tokens: request.max_tokens ?? 1024,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NVIDIA API error: ${response.status} - ${error}`);
  }

  if (!response.body) {
    throw new Error("No response body from NVIDIA API");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            continue;
          }
          try {
            const chunk = JSON.parse(data) as NVIDIAStreamChunk;
            yield chunk;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Process any remaining data
    if (buffer.startsWith("data: ")) {
      const data = buffer.slice(6);
      if (data !== "[DONE]") {
        try {
          const chunk = JSON.parse(data) as NVIDIAStreamChunk;
          yield chunk;
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Validate NVIDIA API key
 */
export async function validateNVIDIAKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 10,
      }),
    });

    return response.ok || response.status === 429; // 429 = rate limited (but key is valid)
  } catch {
    return false;
  }
}
