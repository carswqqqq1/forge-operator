import * as db from "../db";
import * as ollama from "../ollama";
import * as nvidia from "../nvidia";
import { executeTool } from "../tools";

type AgentPlan = {
  goal: string;
  steps: AgentStep[];
  reasoning: string;
};

type AgentStep = {
  index: number;
  title: string;
  description: string;
  tool?: string;
  input?: Record<string, unknown>;
  expectedOutput?: string;
};

export async function planTask(
  userId: number,
  goal: string,
  model: string = "llama3"
): Promise<AgentPlan> {
  const planPrompt = `You are an expert task planner. Break down this goal into clear, executable steps:

Goal: ${goal}

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
      { role: "system" as const, content: "You are a task planning expert. Respond with valid JSON only." },
      { role: "user" as const, content: planPrompt },
    ];

    let response;
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const useNvidia = !!nvidiaKey && model.includes("/");

    if (useNvidia) {
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

      let fullContent = "";
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) fullContent += delta;
      }
      response = fullContent;
    } else {
      const chatResponse = await ollama.chatCompletion({
        model,
        messages,
      });
      response = chatResponse.message.content;
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

export async function executeTask(
  userId: number,
  goal: string,
  conversationId?: number,
  model: string = "llama3"
) {
  try {
    // Create task record
    const taskResult = await db.createAgentTask({
      userId,
      conversationId: conversationId || null,
      goal,
      status: "planning",
      currentStep: 0,
      totalSteps: 0,
    });

    const taskId = taskResult.id;

    // Generate plan
    const plan = await planTask(userId, goal, model);

    // Update task with plan
    await db.updateAgentTask(taskId, {
      plan: JSON.stringify(plan),
      totalSteps: plan.steps.length,
      status: "running",
    });

    // Execute each step
    let result = "";
    for (const step of plan.steps) {
      // Create step record
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

        if (step.tool && step.input) {
          // Execute tool
          const toolResult = await executeTool(step.tool, step.input, {
            storeMemory: (category, key, value, source) =>
              db.storeMemory(userId, category, key, value, source),
            recallMemory: (search) => db.recallMemory(userId, search),
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
            { role: "system" as const, content: "You are a task executor. Be concise and practical." },
            { role: "user" as const, content: stepPrompt },
          ];

          const nvidiaKey = process.env.NVIDIA_API_KEY;
          const useNvidia = !!nvidiaKey && model.includes("/");

          if (useNvidia) {
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
              if (delta) stepOutput += delta;
            }
          } else {
            const chatResponse = await ollama.chatCompletion({
              model,
              messages,
            });
            stepOutput = chatResponse.message.content;
          }

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
        });

        throw error;
      }
    }

    // Mark task as complete
    await db.updateAgentTask(taskId, {
      status: "completed",
      result,
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
