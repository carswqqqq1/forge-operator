import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import * as claude from "../claude";
import * as ollama from "../ollama";
import { AVAILABLE_TOOLS, executeTool } from "../tools";
import * as db from "../db";

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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ─── Claude SSE Streaming Endpoint ─────────────────────────────
  app.post("/api/claude/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const { messages, conversationId } = req.body;
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

  // ─── Ollama SSE Streaming Endpoint ─────────────────────────────
  app.post("/api/ollama/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const { messages, model, conversationId, systemPrompt } = req.body;
    const ollamaMessages: ollama.OllamaMessage[] = [];

    if (systemPrompt) {
      ollamaMessages.push({ role: "system", content: systemPrompt });
    }

    // Add memory context
    try {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMsg) {
        const memories = await db.recallMemory(undefined, lastUserMsg.content?.slice(0, 100));
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
      const stream = await ollama.chatCompletionStream({
        model: model || "llama3",
        messages: ollamaMessages,
        stream: true,
        tools: AVAILABLE_TOOLS,
      });

      const reader = stream.getReader();
      let fullContent = "";
      let evalCount = 0;
      let evalDuration = 0;

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

        // Handle tool calls
        if (chunk.message?.tool_calls) {
          for (const tc of chunk.message.tool_calls) {
            res.write(`data: ${JSON.stringify({
              type: "tool_use",
              content: JSON.stringify({ name: tc.function.name, args: tc.function.arguments }),
            })}\n\n`);

            const result = await executeTool(tc.function.name, tc.function.arguments as Record<string, unknown>, {
              storeMemory: db.storeMemory,
              recallMemory: db.recallMemory,
            });

            res.write(`data: ${JSON.stringify({
              type: "tool_result",
              content: result.output,
            })}\n\n`);

            await db.logToolExecution({
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

      // Save to DB
      if (conversationId && fullContent) {
        const tps = evalDuration > 0 ? (evalCount / (evalDuration / 1e9)).toFixed(1) : "0";
        await db.addMessage({
          conversationId,
          role: "assistant",
          content: fullContent,
          model: model || "llama3",
          tokenCount: evalCount,
          tokensPerSecond: tps,
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
