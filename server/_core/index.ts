import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import * as claude from "../claude";
import * as ollama from "../ollama";
import * as nvidia from "../nvidia";
import { AVAILABLE_TOOLS, executeTool } from "../tools";
import * as db from "../db";

const TIER_CONFIG = {
  lite: {
    model: process.env.NVIDIA_MODEL_FAST || "meta/llama-3.1-8b-instruct",
    multiplier: 0.35,
  },
  core: {
    model: process.env.NVIDIA_MODEL_DEFAULT || "meta/llama-3.1-70b-instruct",
    multiplier: 1,
  },
  max: {
    model: process.env.NVIDIA_MODEL_REASONING || "deepseek-ai/deepseek-v3.1",
    multiplier: 1.8,
  },
} as const;

function getTierForModel(model?: string) {
  if (!model) return "core" as const;
  if (model === TIER_CONFIG.lite.model) return "lite" as const;
  if (model === TIER_CONFIG.max.model) return "max" as const;
  return "core" as const;
}

function calculateCreditCost(tokenCount: number, tier: keyof typeof TIER_CONFIG) {
  const baseCost = 0.6;
  const tokenCost = Math.max(1, tokenCount) / 120;
  return Number((baseCost + tokenCost * TIER_CONFIG[tier].multiplier).toFixed(1));
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ─── Auth Middleware ──────────────────────────────────────────────────
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ─── Claude SSE Streaming Endpoint (Protected) ─────────────────────────────
  app.post("/api/claude/stream", requireAuth, async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const user = (req as any).user;
    const { messages, conversationId } = req.body;
    
    // Verify conversation ownership
    if (conversationId) {
      const conv = await db.getConversation(conversationId);
      if (!conv || conv.userId !== user.id) {
        res.write(`data: ${JSON.stringify({ type: "error", content: "Unauthorized access to conversation" })}\n\n`);
        res.end();
        return;
      }
    }

    try {
      let fullContent = "";
      for await (const chunk of claude.sendMessage(messages)) {
        if (chunk.type === "text") {
          fullContent += chunk.content;
        }
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      // Save assistant message to DB
      if (conversationId && fullContent) {
        await db.addMessage({
          userId: user.id,
          conversationId,
          role: "assistant",
          content: fullContent,
          model: claude.getSessionStatus().model,
        });
      }
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: "error", content: error.message })}\n\n`);
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  });

  // ─── Ollama SSE Streaming Endpoint (Protected) ─────────────────────────────
  app.post("/api/ollama/stream", requireAuth, async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const user = (req as any).user;
    const { messages, model, conversationId, systemPrompt } = req.body;
    
    // Verify conversation ownership
    if (conversationId) {
      const conv = await db.getConversation(conversationId);
      if (!conv || conv.userId !== user.id) {
        res.write(`data: ${JSON.stringify({ type: "error", content: "Unauthorized access to conversation" })}\n\n`);
        res.end();
        return;
      }
    }

    const ollamaMessages: ollama.OllamaMessage[] = [];

    if (systemPrompt) {
      ollamaMessages.push({ role: "system", content: systemPrompt });
    }

    // Add memory context
    try {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMsg) {
        const memories = await db.recallMemory(user.id, lastUserMsg.content?.slice(0, 100));
        if (memories.length > 0) {
          const memCtx = memories.map((m: any) => `[${m.category}] ${m.key}: ${m.value}`).join("\n");
          ollamaMessages.push({ role: "system", content: `Relevant memories:\n${memCtx}` });
        }
      }
    } catch {}

    for (const msg of messages) {
      if (["system", "user", "assistant"].includes(msg.role)) {
        ollamaMessages.push({ role: msg.role, content: msg.content });
      }
    }

    try {
      let fullContent = "";
      let evalCount = 0;
      let evalDuration = 0;
      const ollamaHealth = await ollama.checkOllamaHealth();
      const localModels = ollamaHealth.ok ? await ollama.listModels() : [];
      const nvidiaKey = process.env.NVIDIA_API_KEY;
      const explicitNvidiaModel = typeof model === "string" && model.includes("/");
      const missingLocalModel =
        !!model &&
        !explicitNvidiaModel &&
        ollamaHealth.ok &&
        !localModels.some((localModel) => localModel.name === model);
      const useNvidiaFallback =
        (!!nvidiaKey && explicitNvidiaModel) ||
        (!!nvidiaKey && missingLocalModel) ||
        (!ollamaHealth.ok && !!nvidiaKey);

      if (useNvidiaFallback) {
        const nvidiaMessages = [
          {
            role: "system" as const,
            content:
              "You are Forge, a helpful AI operator. Reply in clear natural English by default unless the user explicitly asks for another language.",
          },
          ...ollamaMessages
          .filter((message) => message.role !== "tool")
          .map((message) => ({ role: message.role as "system" | "user" | "assistant", content: message.content })),
        ];
        const nvidiaModel =
          process.env.NVIDIA_MODEL_REASONING ||
          process.env.NVIDIA_MODEL_DEFAULT ||
          "meta/llama-3.1-70b-instruct";

        for await (const chunk of nvidia.nvidiaStreamChat(nvidiaKey!, {
          model: nvidiaModel,
          messages: nvidiaMessages,
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 4096,
        })) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (!delta) continue;
          fullContent += delta;
          evalCount += 1;
          res.write(`data: ${JSON.stringify({
            type: "text",
            content: delta,
            model: chunk.model,
          })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({
          type: "done",
          content: "",
          tokenCount: evalCount,
          tokensPerSecond: null,
          model: nvidiaModel,
        })}\n\n`);
      } else {
        const stream = await ollama.chatCompletionStream({
          model: model || "llama3",
          messages: ollamaMessages,
          stream: true,
          tools: AVAILABLE_TOOLS,
        });

        const reader = stream.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = value as ollama.OllamaStreamChunk;
          if (chunk.message?.content) {
            fullContent += chunk.message.content;
            res.write(`data: ${JSON.stringify({
              type: "text",
              content: chunk.message.content,
              model: chunk.model,
            })}\n\n`);
          }

          if (chunk.message?.tool_calls) {
            for (const tc of chunk.message.tool_calls) {
              res.write(`data: ${JSON.stringify({
                type: "tool_use",
                content: JSON.stringify({ name: tc.function.name, args: tc.function.arguments }),
              })}\n\n`);

              const result = await executeTool(tc.function.name, tc.function.arguments as Record<string, unknown>, {
                storeMemory: (category, key, value, source) => db.storeMemory(user.id, category, key, value, source),
                recallMemory: (query) => db.recallMemory(user.id, query),
              });

              res.write(`data: ${JSON.stringify({
                type: "tool_result",
                content: result.output,
              })}\n\n`);

              await db.logToolExecution({
                userId: user.id,
                conversationId: conversationId || null,
                toolName: tc.function.name,
                toolInput: JSON.stringify(tc.function.arguments),
                toolOutput: result.output,
                status: result.success ? "success" : "error",
                durationMs: result.durationMs,
              });
            }
          }

          if (chunk.eval_count) evalCount = chunk.eval_count;
          if (chunk.eval_duration) evalDuration = chunk.eval_duration;

          if (chunk.done) {
            const tps = evalDuration > 0 ? (evalCount / (evalDuration / 1e9)).toFixed(1) : "0";
            res.write(`data: ${JSON.stringify({
              type: "done",
              content: "",
              tokenCount: evalCount,
              tokensPerSecond: tps,
              model: chunk.model,
            })}\n\n`);
          }
        }
      }

      // Save to DB
      if (conversationId && fullContent) {
        const tps = evalDuration > 0 ? (evalCount / (evalDuration / 1e9)).toFixed(1) : "0";
        const finalModel = useNvidiaFallback
          ? (process.env.NVIDIA_MODEL_REASONING || process.env.NVIDIA_MODEL_DEFAULT || "meta/llama-3.1-70b-instruct")
          : (model || "llama3");
        await db.addMessage({
          userId: user.id,
          conversationId,
          role: "assistant",
          content: fullContent,
          model: finalModel,
          tokenCount: evalCount,
          tokensPerSecond: useNvidiaFallback ? null : tps,
        });

        const tier = getTierForModel(finalModel);
        await db.consumeCredits({
          userId: user.id,
          amount: calculateCreditCost(evalCount, tier),
          tier,
          model: finalModel,
          tokenCount: evalCount,
          conversationId,
          note: "Assistant response",
        });
      }
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: "error", content: error.message })}\n\n`);
    }
    res.write(`data: [DONE]\n\n`);
    res.end();
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
