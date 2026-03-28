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
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Ollama ──────────────────────────────────────────────────────
  ollama: router({
    health: publicProcedure.query(async () => {
      return ollama.checkOllamaHealth();
    }),
    models: publicProcedure.query(async () => {
      return ollama.listModels();
    }),
    modelDetails: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return ollama.showModel(input.name);
      }),
    url: publicProcedure.query(() => {
      return ollama.getOllamaUrl();
    }),
  }),

  // ─── NVIDIA ───────────────────────────────────────────────────────
  nvidia: router({
    models: publicProcedure.query(async () => {
      return nvidia.NVIDIA_MODELS;
    }),
    status: publicProcedure.query(async () => {
      const apiKey = process.env.NVIDIA_API_KEY;
      return {
        connected: !!apiKey,
        apiKey: apiKey ? "***" : null,
      };
    }),
    configure: publicProcedure
      .input(z.object({ apiKey: z.string() }))
      .mutation(async ({ input }) => {
        const valid = await nvidia.validateNVIDIAKey(input.apiKey);
        if (!valid) {
          throw new Error("Invalid NVIDIA API key");
        }
        process.env.NVIDIA_API_KEY = input.apiKey;
        return { success: true };
      }),
    disconnect: publicProcedure.mutation(async () => {
      delete process.env.NVIDIA_API_KEY;
      return { success: true };
    }),
  }),

  usage: router({
    state: protectedProcedure.query(async () => {
      return db.getUsageState();
    }),
    setTier: protectedProcedure
      .input(z.object({ tier: z.enum(["lite", "core", "max"]) }))
      .mutation(async ({ input }) => {
        return db.setSelectedTier(input.tier);
      }),
  }),

  // ─── Conversations ───────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listConversations(ctx.user!.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.id);
        if (conv && conv.userId !== ctx.user!.id) {
          throw new Error("Unauthorized");
        }
        return conv;
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createConversation(ctx.user!.id, {
          userId: ctx.user!.id,
          title: input.title || "New Conversation",
          model: input.model || "llama3",
          systemPrompt: input.systemPrompt || null,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.id);
        if (!conv || conv.userId !== ctx.user!.id) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        await db.updateConversation(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.id);
        if (!conv || conv.userId !== ctx.user!.id) {
          throw new Error("Unauthorized");
        }
        await db.deleteConversation(input.id);
        return { success: true };
      }),
  }),

  // ─── Messages ────────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.conversationId);
        if (!conv || conv.userId !== ctx.user!.id) {
          throw new Error("Unauthorized");
        }
        return db.getMessages(input.conversationId);
      }),
    create: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string(),
        model: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const conv = await db.getConversation(input.conversationId);
        if (!conv || conv.userId !== ctx.user!.id) {
          throw new Error("Unauthorized");
        }
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

  // ─── Connectors ──────────────────────────────────────────────────
  connectors: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listConnectors(ctx.user!.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.string(),
        config: z.string().optional(),
      }))
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
        await db.deleteConnector(input.id);
        return { success: true };
      }),
  }),

  // ─── Scheduled Tasks ─────────────────────────────────────────────
  scheduled: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listScheduledTasks(ctx.user!.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        cronExpression: z.string().optional(),
        prompt: z.string(),
        model: z.string().optional(),
      }))
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
      .input(z.object({
        id: z.number(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateScheduledTask(input.id, {
          isActive: input.isActive,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteScheduledTask(input.id);
        return { success: true };
      }),
  }),

  // ─── Research ────────────────────────────────────────────────────
  research: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listResearchSessions(ctx.user!.id);
    }),
    create: protectedProcedure
      .input(z.object({
        query: z.string(),
      }))
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
