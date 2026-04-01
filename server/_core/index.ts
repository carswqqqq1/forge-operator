import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerConnectorRoutes } from "../routers/connectors";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import * as claude from "../claude";
import { ConnectorManager } from "../connectors/manager";
import { runDream } from "./memory/autoDream";
import { createSession, getSession } from "./bridge";

import * as nvidia from "../nvidia";
import { AVAILABLE_TOOLS, executeTool } from "../tools";
import * as db from "../db";
import { buildForgeSystemMessages } from "./promptContext";
import { getComputerSnapshot } from "../computer";

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

let connectorManager: ConnectorManager | null = null;

function getConnectorManager(): ConnectorManager {
  if (!connectorManager) {
    connectorManager = new ConnectorManager({
      googleClientId: process.env.GOOGLE_CLIENT_ID || "",
      googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      githubClientId: process.env.GITHUB_CLIENT_ID || "",
      githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
    });
  }
  return connectorManager;
}

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

async function buildGithubContext(userId: number, enabledConnectors?: string[]) {
  const connectorEnabled = Array.isArray(enabledConnectors) ? enabledConnectors.includes("github") : false;
  if (!connectorEnabled) return "";

  try {
    const state = await db.getConnectorState(userId, "github");
    if (!state?.accessToken) return "";
    const repoState = state.state ? JSON.parse(state.state) : {};
    if (repoState?.enabled === false) return "";

    const manager = getConnectorManager();
    const connector = await manager.getGitHubConnector(userId);
    const repositories = await connector.listRepositories(1, 12);
    const selectedRepos = Array.isArray(repoState?.selectedRepos) ? repoState.selectedRepos : [];
    const visibleRepos = selectedRepos.length
      ? repositories.filter((repo) => selectedRepos.includes(repo.full_name))
      : repositories.slice(0, 8);
    const repoLines = visibleRepos.length
      ? visibleRepos.map((repo) => `- ${repo.full_name}${repo.description ? `: ${repo.description}` : ""}`).join("\n")
      : "- No repositories available";

    return [
      "GitHub connector is enabled for this conversation.",
      "Use repository context when it helps answer the user.",
      "Accessible repositories:",
      repoLines,
    ].join("\n");
  } catch (error) {
    console.warn("[Forge] Failed to build GitHub context:", error);
    return "";
  }
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
  
  // Connector routes for Google Drive and Gmail
  registerConnectorRoutes(app);

  // ─── Claude SSE Streaming Endpoint (Protected) ─────────────────────────────
  app.post("/api/claude/stream", requireAuth, async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const user = (req as any).user;
    const { messages, conversationId } = req.body;
    
    let conv: any = null;

    // Verify conversation ownership
    if (conversationId) {
      conv = await db.getConversation(conversationId);
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

  // ─── NVIDIA SSE Streaming Endpoint (Protected) ─────────────────────────────
  app.post("/api/nvidia/stream", requireAuth, async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const user = (req as any).user;
    const { messages, model, conversationId, systemPrompt, enabledConnectors } = req.body;

    let conversation: any = null;

    // Verify conversation ownership
    if (conversationId) {
      conversation = await db.getConversation(conversationId);
      if (!conversation || conversation.userId !== user.id) {
        res.write(`data: ${JSON.stringify({ type: "error", content: "Unauthorized access to conversation" })}\n\n`);
        res.end();
        return;
      }
    }

    const nvidiaMessages: nvidia.NVIDIAMessage[] = [];

    const forgeSystemMessages = await buildForgeSystemMessages(user.id, {
      conversationSystemPrompt: systemPrompt || conversation?.systemPrompt || null,
      computerSnapshot: await getComputerSnapshot().catch(() => null),
    });
    nvidiaMessages.push(...forgeSystemMessages);

    const githubContext = await buildGithubContext(user.id, enabledConnectors || conversation?.enabledConnectors);
    if (githubContext) {
      nvidiaMessages.push({ role: "system", content: githubContext });
    }

    // Add memory context
    try {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMsg) {
        const memories = await db.recallMemory(user.id, lastUserMsg.content?.slice(0, 100));
        if (memories.length > 0) {
          const memCtx = memories.map((m: any) => `[${m.category}] ${m.key}: ${m.value}`).join("\n");
          nvidiaMessages.push({ role: "system", content: `Relevant memories:\n${memCtx}` });
        }
      }
    } catch {}

    for (const msg of messages) {
      if (["system", "user", "assistant"].includes(msg.role)) {
        nvidiaMessages.push({ role: msg.role, content: msg.content });
      }
    }

    try {
      let fullContent = "";
      let evalCount = 0;
      const nvidiaKey = process.env.NVIDIA_API_KEY;
      if (!nvidiaKey) throw new Error("NVIDIA API key not configured.");

      const nvidiaModel =
        model ||
        process.env.NVIDIA_MODEL_REASONING ||
        process.env.NVIDIA_MODEL_DEFAULT ||
        "meta/llama-3.1-70b-instruct";
      const tier = getTierForModel(nvidiaModel);
      const lastUserMessage = [...messages].reverse().find((message: any) => message.role === "user");
      const estimatedPromptTokens = Math.max(12, Math.ceil(String(lastUserMessage?.content || "").length / 4));
      const promptCost = calculateCreditCost(estimatedPromptTokens, tier);

      if (conversationId) {
        await db.consumeCredits({
          userId: user.id,
          amount: promptCost,
          tier,
          model: nvidiaModel,
          tokenCount: estimatedPromptTokens,
          conversationId,
          note: "Prompt submitted",
        });
      }

      for await (const chunk of nvidia.nvidiaStreamChat(nvidiaKey!, {
        model: nvidiaModel,
        messages: nvidiaMessages.map((message) => ({ role: message.role as "system" | "user" | "assistant", content: message.content })),
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

      // Save to DB
      if (conversationId && fullContent) {
        const finalModel = nvidiaModel;
        await db.addMessage({
          userId: user.id,
          conversationId,
          role: "assistant",
          content: fullContent,
          model: finalModel,
          tokenCount: evalCount,
          tokensPerSecond: null,
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
    
    // Initialize background services
    console.log("[Forge] Initializing background services...");
    
    // Run AutoDream every 4 hours
    setInterval(async () => {
      const users = await db.listAllUsers();
      for (const user of users) {
        await runDream(user.id);
      }
    }, 1000 * 60 * 60 * 4);
  });
}

startServer().catch(console.error);
