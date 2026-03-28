import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as ollama from "./ollama";
import * as claude from "./claude";
import * as nvidia from "./nvidia";
import { executeTool, AVAILABLE_TOOLS, getToolSummary } from "./tools";

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
    state: publicProcedure.query(async () => {
      return db.getUsageState();
    }),
    setTier: publicProcedure
      .input(z.object({ tier: z.enum(["lite", "core", "max"]) }))
      .mutation(async ({ input }) => {
        return db.setSelectedTier(input.tier);
      }),
  }),

  // ─── Conversations ───────────────────────────────────────────────
  conversations: router({
    list: publicProcedure.query(async () => {
      return db.listConversations();
    }),
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getConversation(input.id);
      }),
    create: publicProcedure
      .input(z.object({
        title: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createConversation({
          title: input.title || "New Conversation",
          model: input.model || "llama3",
          systemPrompt: input.systemPrompt || null,
        });
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateConversation(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteConversation(input.id);
        return { success: true };
      }),
  }),

  // ─── Messages ────────────────────────────────────────────────────
  messages: router({
    list: publicProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return db.getMessages(input.conversationId);
      }),
    create: publicProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string(),
        model: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const message = await db.addMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
          model: input.model || null,
        });

        return { success: true, id: message.id };
      }),
    send: publicProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string(),
        model: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Save user message
        await db.addMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.content,
        });

        // Get conversation for model and system prompt
        const conv = await db.getConversation(input.conversationId);
        const model = input.model || conv?.model || "llama3";

        // Get all messages for context
        const allMessages = await db.getMessages(input.conversationId);
        const ollamaMessages: ollama.OllamaMessage[] = [];

        // Add system prompt if exists
        if (conv?.systemPrompt) {
          ollamaMessages.push({ role: "system", content: conv.systemPrompt });
        }

        // Add conversation history
        for (const msg of allMessages) {
          if (msg.role === "system" || msg.role === "user" || msg.role === "assistant") {
            ollamaMessages.push({ role: msg.role, content: msg.content });
          }
        }

        // Get memory context
        const relevantMemories = await db.recallMemory(undefined, input.content.slice(0, 100));
        if (relevantMemories.length > 0) {
          const memoryContext = relevantMemories.map(m => `[${m.category}] ${m.key}: ${m.value}`).join("\n");
          ollamaMessages.splice(1, 0, {
            role: "system",
            content: `Relevant memories:\n${memoryContext}`,
          });
        }

        const startTime = Date.now();

        try {
          // Call Ollama with tool support
          const response = await ollama.chatCompletion({
            model,
            messages: ollamaMessages,
            tools: AVAILABLE_TOOLS,
          });

          const duration = Date.now() - startTime;
          let assistantContent = response.message.content;

          // Handle tool calls
          if (response.message.tool_calls && response.message.tool_calls.length > 0) {
            const toolResults: string[] = [];

            for (const toolCall of response.message.tool_calls) {
              const toolName = toolCall.function.name;
              const toolArgs = toolCall.function.arguments as Record<string, unknown>;

              // Log tool execution start
              const execLog = await db.logToolExecution({
                conversationId: input.conversationId,
                toolName,
                toolInput: JSON.stringify(toolArgs),
                status: "running",
              });

              // Execute the tool
              const result = await executeTool(toolName, toolArgs, {
                storeMemory: db.storeMemory,
                recallMemory: db.recallMemory,
              });

              // Update tool execution log
              await db.updateToolExecution(execLog.id, {
                toolOutput: result.output,
                status: result.success ? "success" : "error",
                durationMs: result.durationMs,
              });

              toolResults.push(`**Tool: ${toolName}**\n\`\`\`\n${result.output}\n\`\`\``);
            }

            // Add tool results to messages and get final response
            const toolResultContent = toolResults.join("\n\n");
            ollamaMessages.push({ role: "assistant", content: assistantContent || "Let me use some tools to help with that." });
            ollamaMessages.push({ role: "tool", content: toolResultContent });

            const finalResponse = await ollama.chatCompletion({
              model,
              messages: ollamaMessages,
            });

            assistantContent = finalResponse.message.content;

            // Save tool message
            await db.addMessage({
              conversationId: input.conversationId,
              role: "tool",
              content: toolResultContent,
            });
          }

          // Calculate metrics
          const evalCount = response.eval_count || 0;
          const evalDuration = response.eval_duration || 0;
          const tps = evalDuration > 0 ? (evalCount / (evalDuration / 1e9)).toFixed(1) : "0";

          // Save assistant message
          const msgResult = await db.addMessage({
            conversationId: input.conversationId,
            role: "assistant",
            content: assistantContent,
            model,
            tokenCount: evalCount,
            durationMs: duration,
            tokensPerSecond: tps,
          });

          // Auto-generate title for new conversations
          if (allMessages.length <= 1 && conv?.title === "New Conversation") {
            try {
              const titleResponse = await ollama.chatCompletion({
                model,
                messages: [
                  { role: "system", content: "Generate a very short title (3-6 words) for this conversation. Reply with ONLY the title, no quotes or punctuation." },
                  { role: "user", content: input.content },
                ],
              });
              const title = titleResponse.message.content.trim().slice(0, 100);
              if (title) await db.updateConversation(input.conversationId, { title });
            } catch { /* ignore title generation errors */ }
          }

          return {
            content: assistantContent,
            model,
            tokenCount: evalCount,
            durationMs: duration,
            tokensPerSecond: tps,
            toolCalls: response.message.tool_calls || [],
          };
        } catch (error: any) {
          // Save error as assistant message
          const errorMsg = `Error: ${error.message || "Failed to get response from Ollama"}`;
          await db.addMessage({
            conversationId: input.conversationId,
            role: "assistant",
            content: errorMsg,
            model,
            durationMs: Date.now() - startTime,
          });
          throw error;
        }
      }),
  }),

  // ─── Tools ───────────────────────────────────────────────────────
  tools: router({
    list: publicProcedure.query(() => {
      return getToolSummary();
    }),
    execute: publicProcedure
      .input(z.object({
        toolName: z.string(),
        args: z.record(z.string(), z.unknown()),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const execLog = await db.logToolExecution({
          conversationId: input.conversationId || null,
          toolName: input.toolName,
          toolInput: JSON.stringify(input.args),
          status: "running",
        });

        const result = await executeTool(input.toolName, input.args, {
          storeMemory: db.storeMemory,
          recallMemory: db.recallMemory,
        });

        await db.updateToolExecution(execLog.id, {
          toolOutput: result.output,
          status: result.success ? "success" : "error",
          durationMs: result.durationMs,
        });

        return { ...result, id: execLog.id };
      }),
    executions: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return db.getToolExecutions(input.limit || 100);
      }),
    stats: publicProcedure.query(async () => {
      return db.getToolStats();
    }),
  }),

  // ─── System Prompts ──────────────────────────────────────────────
  prompts: router({
    list: publicProcedure.query(async () => {
      return db.listSystemPrompts();
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        content: z.string(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createSystemPrompt(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        content: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSystemPrompt(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSystemPrompt(input.id);
        return { success: true };
      }),
  }),

  // ─── Agent Tasks ─────────────────────────────────────────────────
  agent: router({
    createTask: publicProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        goal: z.string(),
        model: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const model = input.model || "llama3";

        // Create the task
        const task = await db.createAgentTask({
          conversationId: input.conversationId || null,
          goal: input.goal,
          status: "planning",
        });

        // Use Ollama to generate a plan
        try {
          const planResponse = await ollama.chatCompletion({
            model,
            messages: [
              {
                role: "system",
                content: `You are a task planner. Given a goal, create a step-by-step plan. Return a JSON array of steps, each with "title" and "description" fields. Keep it concise (3-8 steps). Return ONLY valid JSON, no markdown.`,
              },
              { role: "user", content: input.goal },
            ],
          });

          let steps: Array<{ title: string; description: string }> = [];
          try {
            const cleaned = planResponse.message.content.replace(/```json\n?|\n?```/g, "").trim();
            steps = JSON.parse(cleaned);
          } catch {
            steps = [{ title: "Execute goal", description: input.goal }];
          }

          // Save plan and steps
          await db.updateAgentTask(task.id, {
            plan: JSON.stringify(steps),
            totalSteps: steps.length,
            status: "running",
          });

          for (let i = 0; i < steps.length; i++) {
            await db.createAgentStep({
              taskId: task.id,
              stepIndex: i,
              title: steps[i].title,
              description: steps[i].description,
              status: "pending",
            });
          }

          return { taskId: task.id, steps };
        } catch (error: any) {
          await db.updateAgentTask(task.id, { status: "failed", result: error.message });
          throw error;
        }
      }),
    getTask: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const task = await db.getAgentTask(input.id);
        const steps = task ? await db.getAgentSteps(input.id) : [];
        return { task, steps };
      }),
    executeStep: publicProcedure
      .input(z.object({
        taskId: z.number(),
        stepId: z.number(),
        model: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const model = input.model || "llama3";
        const task = await db.getAgentTask(input.taskId);
        const steps = await db.getAgentSteps(input.taskId);
        const step = steps.find(s => s.id === input.stepId);
        if (!task || !step) throw new Error("Task or step not found");

        await db.updateAgentStep(input.stepId, { status: "running" });
        await db.updateAgentTask(input.taskId, { currentStep: step.stepIndex });

        try {
          // Ask Ollama to execute this step using tools
          const response = await ollama.chatCompletion({
            model,
            messages: [
              {
                role: "system",
                content: `You are executing step ${step.stepIndex + 1} of a plan. The overall goal is: "${task.goal}". Use the available tools to complete this step. Be thorough and report results.`,
              },
              {
                role: "user",
                content: `Execute this step: ${step.title}\nDescription: ${step.description || ""}`,
              },
            ],
            tools: AVAILABLE_TOOLS,
          });

          let output = response.message.content;

          // Handle tool calls
          if (response.message.tool_calls) {
            for (const tc of response.message.tool_calls) {
              const result = await executeTool(tc.function.name, tc.function.arguments as Record<string, unknown>, {
                storeMemory: db.storeMemory,
                recallMemory: db.recallMemory,
              });
              output += `\n\n**Tool: ${tc.function.name}**\n${result.output}`;

              await db.logToolExecution({
                conversationId: task.conversationId,
                toolName: tc.function.name,
                toolInput: JSON.stringify(tc.function.arguments),
                toolOutput: result.output,
                status: result.success ? "success" : "error",
                durationMs: result.durationMs,
              });
            }
          }

          await db.updateAgentStep(input.stepId, {
            status: "completed",
            toolOutput: output,
            durationMs: response.total_duration ? Math.round(response.total_duration / 1e6) : 0,
          });

          // Check if all steps are done
          const updatedSteps = await db.getAgentSteps(input.taskId);
          const allDone = updatedSteps.every(s => s.status === "completed" || s.status === "skipped");
          if (allDone) {
            await db.updateAgentTask(input.taskId, { status: "completed", result: "All steps completed" });
          }

          return { output, status: "completed" };
        } catch (error: any) {
          await db.updateAgentStep(input.stepId, { status: "failed", toolOutput: error.message });
          return { output: error.message, status: "failed" };
        }
      }),
  }),

  // ─── Memory ──────────────────────────────────────────────────────
  memory: router({
    list: publicProcedure.query(async () => {
      return db.listAllMemories();
    }),
    store: publicProcedure
      .input(z.object({
        category: z.string(),
        key: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.storeMemory(input.category, input.key, input.value, "manual");
        return { success: true };
      }),
    recall: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return db.recallMemory(input.category, input.search);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteMemory(input.id);
        return { success: true };
      }),
  }),

  // ─── Skills ──────────────────────────────────────────────────────
  skills: router({
    list: publicProcedure.query(async () => {
      return db.listSkills();
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
        instructions: z.string(),
        triggerCommand: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createSkill(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        instructions: z.string().optional(),
        triggerCommand: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateSkill(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSkill(input.id);
        return { success: true };
      }),
  }),

  // ─── Connectors ──────────────────────────────────────────────────
  connectors: router({
    list: publicProcedure.query(async () => {
      return db.listConnectors();
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        type: z.string(),
        config: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createConnector(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        config: z.string().optional(),
        status: z.enum(["active", "inactive", "error"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateConnector(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteConnector(input.id);
        return { success: true };
      }),
  }),

  // ─── Scheduled Tasks ─────────────────────────────────────────────
  scheduled: router({
    list: publicProcedure.query(async () => {
      return db.listScheduledTasks();
    }),
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        cronExpression: z.string().optional(),
        prompt: z.string(),
        model: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createScheduledTask(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        cronExpression: z.string().optional(),
        prompt: z.string().optional(),
        model: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateScheduledTask(id, data);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteScheduledTask(input.id);
        return { success: true };
      }),
  }),

  // ─── Research ─────────────────────────────────────────────────────
  research: router({
    list: publicProcedure.query(async () => {
      return db.listResearchSessions();
    }),
    create: publicProcedure
      .input(z.object({
        query: z.string(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createResearchSession({
          query: input.query,
          conversationId: input.conversationId || null,
          status: "running",
        });
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["running", "completed", "failed"]).optional(),
        sourcesCount: z.number().optional(),
        findings: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateResearchSession(id, data);
        return { success: true };
      }),
  }),

  // ─── Claude Subscription ──────────────────────────────────────────
  claude: router({
    status: publicProcedure.query(() => {
      return claude.getSessionStatus();
    }),
    models: publicProcedure.query(() => {
      return claude.CLAUDE_MODELS;
    }),
    configureCookie: publicProcedure
      .input(z.object({
        sessionKey: z.string(),
        orgId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        claude.configureClaudeCookie(input.sessionKey, input.orgId);
        return { success: true, status: claude.getSessionStatus() };
      }),
    launchBrowser: publicProcedure
      .input(z.object({
        chromePath: z.string().optional(),
        headless: z.boolean().optional(),
        userDataDir: z.string().optional(),
      }).optional())
      .mutation(async ({ input }) => {
        return claude.launchBrowser(input || undefined);
      }),
    closeBrowser: publicProcedure.mutation(async () => {
      await claude.closeBrowser();
      return { success: true };
    }),
    setModel: publicProcedure
      .input(z.object({ model: z.string() }))
      .mutation(({ input }) => {
        claude.setClaudeModel(input.model);
        return { success: true };
      }),
    disconnect: publicProcedure.mutation(() => {
      claude.disconnect();
      return { success: true };
    }),
  }),

  // ─── Settings ─────────────────────────────────────────────────────
  settings: router({
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getSetting(input.key);
      }),
    set: publicProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        await db.setSetting(input.key, input.value);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
