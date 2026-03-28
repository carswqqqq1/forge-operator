import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as ollama from "./ollama";
import * as claude from "./claude";
import * as nvidia from "./nvidia";
import { executeTool, AVAILABLE_TOOLS } from "./tools";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    emailLogin: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1), cfToken: z.string().optional() }))
      .mutation(async ({ input }) => {
        const res = await fetch(`http://localhost:${process.env.PORT || 3000}/api/auth/email/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        return data;
      }),
    emailRegister: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(8), cfToken: z.string().optional() }))
      .mutation(async ({ input }) => {
        const res = await fetch(`http://localhost:${process.env.PORT || 3000}/api/auth/email/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        return data;
      }),
  }),

  ollama: router({
    health: publicProcedure.query(async () => ollama.checkOllamaHealth()),
    models: publicProcedure.query(async () => ollama.listModels()),
    modelDetails: publicProcedure.input(z.object({ name: z.string() })).query(async ({ input }) => ollama.showModel(input.name)),
    url: publicProcedure.query(() => ollama.getOllamaUrl()),
  }),

  nvidia: router({
    models: publicProcedure.query(async () => nvidia.NVIDIA_MODELS),
    status: publicProcedure.query(async () => {
      const apiKey = process.env.NVIDIA_API_KEY;
      return { connected: !!apiKey, apiKey: apiKey ? "***" : null };
    }),
    configure: publicProcedure
      .input(z.object({ apiKey: z.string() }))
      .mutation(async ({ input }) => {
        const valid = await nvidia.validateNVIDIAKey(input.apiKey);
        if (!valid) throw new Error("Invalid NVIDIA API key");
        process.env.NVIDIA_API_KEY = input.apiKey;
        return { success: true };
      }),
    disconnect: publicProcedure.mutation(async () => {
      delete process.env.NVIDIA_API_KEY;
      return { success: true };
    }),
  }),

  usage: router({
    state: protectedProcedure.query(async () => db.getUsageState()),
    setTier: protectedProcedure
      .input(z.object({ tier: z.enum(["lite", "core", "max"]) }))
      .mutation(async ({ input }) => db.setSelectedTier(input.tier)),
  }),

  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listConversations(ctx.user!.id)),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.id);
        if (conv && conv.userId !== ctx.user!.id) throw new Error("Unauthorized");
        return conv;
      }),
    create: protectedProcedure
      .input(z.object({ title: z.string().optional(), model: z.string().optional(), systemPrompt: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        return db.createConversation(ctx.user!.id, {
          userId: ctx.user!.id,
          title: input.title || "New Conversation",
          model: input.model || "llama3",
          systemPrompt: input.systemPrompt || null,
        });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), title: z.string().optional(), model: z.string().optional(), systemPrompt: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.id);
        if (!conv || conv.userId !== ctx.user!.id) throw new Error("Unauthorized");
        const { id, ...data } = input;
        await db.updateConversation(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.id);
        if (!conv || conv.userId !== ctx.user!.id) throw new Error("Unauthorized");
        await db.deleteConversation(input.id);
        return { success: true };
      }),
  }),

  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.conversationId);
        if (!conv || conv.userId !== ctx.user!.id) throw new Error("Unauthorized");
        return db.getMessages(input.conversationId);
      }),
    create: protectedProcedure
      .input(z.object({ conversationId: z.number(), content: z.string(), model: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.conversationId);
        if (!conv || conv.userId !== ctx.user!.id) throw new Error("Unauthorized");
        const message = await db.addMessage({
          userId: ctx.user!.id,
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
          model: input.model || null,
        });
        return { success: true, id: message.id };
      }),
  }),

  connectors: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listConnectors(ctx.user!.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string(), type: z.string(), config: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        return db.createConnector(ctx.user!.id, {
          userId: ctx.user!.id,
          name: input.name,
          type: input.type,
          config: input.config || null,
          status: "inactive",
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = (await db.listConnectors(ctx.user!.id)).some((connector) => connector.id === input.id);
        if (!owned) throw new Error("Unauthorized");
        await db.deleteConnector(input.id);
        return { success: true };
      }),
  }),

  scheduled: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listScheduledTasks(ctx.user!.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), cronExpression: z.string().optional(), prompt: z.string(), model: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        return db.createScheduledTask(ctx.user!.id, {
          userId: ctx.user!.id,
          name: input.name,
          description: input.description || null,
          cronExpression: input.cronExpression || null,
          prompt: input.prompt,
          model: input.model || "llama3",
          isActive: true,
        });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        const owned = (await db.listScheduledTasks(ctx.user!.id)).some((task) => task.id === input.id);
        if (!owned) throw new Error("Unauthorized");
        await db.updateScheduledTask(input.id, { isActive: input.isActive });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = (await db.listScheduledTasks(ctx.user!.id)).some((task) => task.id === input.id);
        if (!owned) throw new Error("Unauthorized");
        await db.deleteScheduledTask(input.id);
        return { success: true };
      }),
  }),

  claude: router({
    status: publicProcedure.query(() => claude.getSessionStatus()),
    models: publicProcedure.query(() => claude.CLAUDE_MODELS),
    configureCookie: protectedProcedure
      .input(z.object({ sessionKey: z.string(), orgId: z.string().optional() }))
      .mutation(async ({ input }) => {
        claude.configureClaudeCookie(input.sessionKey, input.orgId);
        return { success: true };
      }),
    launchBrowser: protectedProcedure
      .input(z.object({ chromePath: z.string().optional(), userDataDir: z.string().optional(), headless: z.boolean().optional() }).optional())
      .mutation(async ({ input }) => claude.launchBrowser(input ?? {})),
    closeBrowser: protectedProcedure.mutation(async () => {
      await claude.closeBrowser();
      return { success: true };
    }),
    setModel: protectedProcedure
      .input(z.object({ model: z.string() }))
      .mutation(async ({ input }) => {
        claude.setClaudeModel(input.model);
        return { success: true };
      }),
    disconnect: protectedProcedure.mutation(async () => {
      claude.disconnect();
      return { success: true };
    }),
  }),

  tools: router({
    list: publicProcedure.query(() => AVAILABLE_TOOLS),
    stats: protectedProcedure.query(async ({ ctx }) => db.getToolExecutionStats(ctx.user!.id)),
    executions: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => db.listToolExecutions(ctx.user!.id, input.limit ?? 100)),
    execute: protectedProcedure
      .input(z.object({ toolName: z.string(), toolInput: z.string(), conversationId: z.number().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (input.conversationId != null) {
          const conv = await db.getConversation(input.conversationId);
          if (!conv || conv.userId !== ctx.user!.id) throw new Error("Unauthorized");
        }
        const execRecord = await db.logToolExecution({
          userId: ctx.user!.id,
          conversationId: input.conversationId ?? null,
          messageId: null,
          toolName: input.toolName,
          toolInput: input.toolInput,
          status: "running",
        });
        try {
          const result = await executeTool(input.toolName, JSON.parse(input.toolInput));
          await db.updateToolExecution(execRecord.id, { status: "success", toolOutput: JSON.stringify(result) });
          return { success: true, result };
        } catch (err: any) {
          await db.updateToolExecution(execRecord.id, { status: "error", toolOutput: err.message });
          throw err;
        }
      }),
  }),

  memory: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listAllMemories(ctx.user!.id)),
    store: protectedProcedure
      .input(z.object({ category: z.string(), key: z.string(), value: z.string(), source: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await db.storeMemory(ctx.user!.id, input.category, input.key, input.value, input.source ?? "manual");
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = (await db.listAllMemories(ctx.user!.id)).some((memory) => memory.id === input.id);
        if (!owned) throw new Error("Unauthorized");
        await db.deleteMemory(input.id);
        return { success: true };
      }),
  }),

  prompts: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listPrompts(ctx.user!.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string(), description: z.string().optional(), content: z.string(), isDefault: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        return db.createPrompt(ctx.user!.id, {
          userId: ctx.user!.id,
          name: input.name,
          description: input.description ?? null,
          content: input.content,
          isDefault: input.isDefault ?? false,
        });
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), content: z.string().optional(), isDefault: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        const owned = (await db.listPrompts(ctx.user!.id)).some((prompt) => prompt.id === input.id);
        if (!owned) throw new Error("Unauthorized");
        const { id, ...data } = input;
        await db.updatePrompt(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = (await db.listPrompts(ctx.user!.id)).some((prompt) => prompt.id === input.id);
        if (!owned) throw new Error("Unauthorized");
        await db.deletePrompt(input.id);
        return { success: true };
      }),
  }),

  skills: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listSkills(ctx.user!.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string(), slug: z.string(), description: z.string().optional(), category: z.string().optional(), instructions: z.string(), triggerCommand: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        return db.createSkill(ctx.user!.id, {
          userId: ctx.user!.id,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          category: input.category ?? null,
          instructions: input.instructions,
          triggerCommand: input.triggerCommand ?? null,
          isActive: true,
        });
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const owned = (await db.listSkills(ctx.user!.id)).some((skill) => skill.id === input.id);
        if (!owned) throw new Error("Unauthorized");
        await db.deleteSkill(input.id);
        return { success: true };
      }),
  }),

  research: router({
    list: protectedProcedure.query(async ({ ctx }) => db.listResearchSessions(ctx.user!.id)),
    create: protectedProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ input, ctx }) => {
        return db.createResearchSession(ctx.user!.id, {
          userId: ctx.user!.id,
          query: input.query,
          status: "running",
          sourcesCount: 0,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
