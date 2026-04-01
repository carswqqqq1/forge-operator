import * as db from "../db";
import * as nvidia from "../nvidia";
import { executeTool } from "../tools";
import { buildForgeSystemMessages } from "./promptContext";
import { getComputerSnapshot } from "../computer";

// ─── Types ───────────────────────────────────────────────────────────

export type TaskType =
  | "local_bash"
  | "local_agent"
  | "remote_agent"
  | "research"
  | "coding"
  | "review";

export type AgentPlan = {
  goal: string;
  steps: AgentStep[];
  reasoning: string;
};

export type AgentStep = {
  index: number;
  title: string;
  description: string;
  tool?: string;
  input?: Record<string, unknown>;
  expectedOutput?: string;
};

// ─── Task Planning ───────────────────────────────────────────────────

export async function planTask(
  userId: number,
  goal: string,
  model: string = "llama3",
  context?: string
): Promise<AgentPlan> {
  const planPrompt = `You are an expert task planner for the Forge Agent OS. 
Break down this goal into clear, executable steps.

Goal: ${goal}
${context ? `Context: ${context}` : ""}

Provide a JSON response with this structure:
{
  "reasoning": "brief explanation of approach",
  "steps": [
    {
      "index": 1,
      "title": "step title",
      "description": "what to do",
      "tool": "optional tool name",
      "expectedOutput": "what we expect"
    }
  ]
}`;

  try {
    const messages = [
      ...(await buildForgeSystemMessages(userId, {
        computerSnapshot: await getComputerSnapshot().catch(() => null),
      })),
      { role: "system" as const, content: "You are a task planning expert. Respond with valid JSON only." },
      { role: "user" as const, content: planPrompt },
    ];

    const nvidiaKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaKey) throw new Error("NVIDIA API key not configured.");

    let response = "";
    const stream = await nvidia.nvidiaStreamChat(nvidiaKey, {
      model,
      messages: messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
      temperature: 0.2,
      top_p: 0.7,
      max_tokens: 2048,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) response += delta;
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse plan JSON");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      goal,
      reasoning: parsed.reasoning || "",
      steps: (parsed.steps || []).map((s: any) => ({
        index: s.index,
        title: s.title,
        description: s.description,
        tool: s.tool,
        input: s.input,
        expectedOutput: s.expectedOutput,
      })),
    };
  } catch (error) {
    console.error("[Agent] Failed to plan task:", error);
    throw error;
  }
}

// ─── Task Execution ──────────────────────────────────────────────────

export async function executeTask(
  userId: number,
  goal: string,
  options: {
    conversationId?: number;
    model?: string;
    type?: TaskType;
    parentTaskId?: number;
    description?: string;
    context?: string;
  } = {}
) {
  const {
    conversationId,
    model = "llama3",
    type = "local_agent",
    parentTaskId,
    description,
    context
  } = options;

  try {
    // Create task record with enhanced fields
    const taskResult = await db.createAgentTask({
      userId,
      conversationId: conversationId || null,
      goal,
      type,
      parentTaskId: parentTaskId || null,
      description: description || goal,
      status: "planning",
      currentStep: 0,
      totalSteps: 0,
      startTime: new Date(),
    });

    const taskId = taskResult.id;

    // Generate plan
    const plan = await planTask(userId, goal, model, context);

    // Update task with plan
    await db.updateAgentTask(taskId, {
      plan: JSON.stringify(plan),
      totalSteps: plan.steps.length,
      status: "running",
    });

    // Execute each step
    let result = "";
    for (const step of plan.steps) {
      const stepResult = await db.createAgentStep({
        userId,
        taskId,
        stepIndex: step.index,
        title: step.title,
        description: step.description,
        toolName: step.tool,
        toolInput: step.input ? JSON.stringify(step.input) : null,
        status: "running",
      });

      try {
        let stepOutput = "";

        if (step.tool) {
          // Execute tool with enhanced dbHelpers
          const toolResult = await executeTool(step.tool, step.input || {}, {
            storeMemory: (category, key, value, source, type) =>
              db.storeMemory(userId, category, key, value, source, type),
            recallMemory: (category, search) => db.recallMemory(userId, search, category),
            spawnSubagent: (subGoal, role, subContext) => 
              executeTask(userId, subGoal, {
                model,
                type: role as TaskType,
                parentTaskId: taskId,
                context: subContext
              })
          });

          stepOutput = toolResult.output;

          await db.updateAgentStep(stepResult.id, {
            toolOutput: stepOutput,
            status: "completed",
            durationMs: toolResult.durationMs,
          });
        } else {
          // Use LLM to execute step
          const stepPrompt = `Execute this task step:
Title: ${step.title}
Description: ${step.description}
Expected Output: ${step.expectedOutput || "N/A"}

Provide a concise result.`;

          const messages = [
            ...(await buildForgeSystemMessages(userId, {
              computerSnapshot: await getComputerSnapshot().catch(() => null),
            })),
            { role: "system" as const, content: "You are a task executor. Be concise and practical." },
            { role: "user" as const, content: stepPrompt },
          ];

          const nvidiaKey = process.env.NVIDIA_API_KEY;
          if (!nvidiaKey) throw new Error("NVIDIA API key not configured.");

          let llmOutput = "";
          const stream = await nvidia.nvidiaStreamChat(nvidiaKey, {
            model,
            messages: messages.map((m) => ({
              role: m.role as "system" | "user" | "assistant",
              content: m.content,
            })),
            temperature: 0.2,
            max_tokens: 1024,
          });

          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) llmOutput += delta;
          }

          stepOutput = llmOutput;

          await db.updateAgentStep(stepResult.id, {
            toolOutput: stepOutput,
            status: "completed",
          });
        }

        result += `\n${step.title}: ${stepOutput}`;

        // Update task progress
        await db.updateAgentTask(taskId, {
          currentStep: step.index,
        });
      } catch (error: any) {
        await db.updateAgentStep(stepResult.id, {
          toolOutput: `ERROR: ${error.message}`,
          status: "failed",
        });

        await db.updateAgentTask(taskId, {
          status: "failed",
          result: `Failed at step ${step.index}: ${error.message}`,
          endTime: new Date(),
        });

        throw error;
      }
    }

    // Mark task as complete
    await db.updateAgentTask(taskId, {
      status: "completed",
      result,
      endTime: new Date(),
    });

    return {
      taskId,
      status: "completed",
      result,
      plan,
    };
  } catch (error) {
    console.error("[Agent] Failed to execute task:", error);
    throw error;
  }
}

export async function getTaskStatus(userId: number, taskId: number) {
  const task = await db.getAgentTask(taskId);
  if (!task || task.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const steps = await db.getAgentSteps(taskId);

  return {
    task,
    steps,
  };
}
