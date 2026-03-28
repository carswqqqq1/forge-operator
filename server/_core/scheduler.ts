import * as cron from "node-cron";
import * as db from "../db";
import * as ollama from "../ollama";
import * as nvidia from "../nvidia";
import { executeTool } from "../tools";

type ScheduledTaskExecution = {
  taskId: number;
  userId: number;
  startTime: Date;
  endTime?: Date;
  status: "running" | "completed" | "failed";
  result?: string;
  error?: string;
};

const activeJobs = new Map<number, ReturnType<typeof cron.schedule>>();
const executionHistory: ScheduledTaskExecution[] = [];

export async function initializeScheduler() {
  console.log("[Scheduler] Initializing...");
  const tasks = await db.listScheduledTasks(1); // TODO: Iterate over all users
  
  for (const task of tasks) {
    if (task.isActive && task.cronExpression) {
      scheduleTask(task.id, task.userId, task.cronExpression, task.prompt, task.model || "llama3");
    }
  }
  
  console.log(`[Scheduler] Initialized with ${tasks.length} active tasks`);
}

export function scheduleTask(
  taskId: number,
  userId: number,
  cronExpression: string,
  prompt: string,
  model: string
) {
  try {
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Cancel existing job if any
    if (activeJobs.has(taskId)) {
      const existing = activeJobs.get(taskId);
      if (existing) existing.stop();
    }

    // Schedule new job
    const job = cron.schedule(cronExpression, async () => {
      await executeScheduledTask(taskId, userId, prompt, model);
    });

    activeJobs.set(taskId, job);
    console.log(`[Scheduler] Scheduled task ${taskId} with cron: ${cronExpression}`);
  } catch (error) {
    console.error(`[Scheduler] Failed to schedule task ${taskId}:`, error);
  }
}

export function unscheduleTask(taskId: number) {
  const job = activeJobs.get(taskId);
  if (job) {
    job.stop();
    activeJobs.delete(taskId);
    console.log(`[Scheduler] Unscheduled task ${taskId}`);
  }
}

async function executeScheduledTask(
  taskId: number,
  userId: number,
  prompt: string,
  model: string
) {
  const execution: ScheduledTaskExecution = {
    taskId,
    userId,
    startTime: new Date(),
    status: "running",
  };

  try {
    console.log(`[Scheduler] Executing task ${taskId}...`);

    // Create a temporary conversation for this execution
    const conv = await db.createConversation(userId, {
      userId,
      title: `Scheduled Task #${taskId}`,
      model,
      systemPrompt: "You are an autonomous task executor. Execute the following task concisely.",
    });

    // Add the task prompt as a user message
    await db.addMessage({
      userId,
      conversationId: conv.id,
      role: "user",
      content: prompt,
    });

    // Get all messages for context
    const messages = await db.getMessages(conv.id);
    const ollamaMessages: any[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Execute the prompt
    let response;
    const nvidiaKey = process.env.NVIDIA_API_KEY;
    const useNvidia = !!nvidiaKey && model.includes("/");

    if (useNvidia) {
      const nvidiaMessages = ollamaMessages.filter((m) => m.role !== "tool").map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      }));

      const stream = await nvidia.nvidiaStreamChat(nvidiaKey, {
        model,
        messages: nvidiaMessages,
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
        messages: ollamaMessages,
      });

      response = chatResponse.message.content;
    }

    // Save the result
    await db.addMessage({
      userId,
      conversationId: conv.id,
      role: "assistant",
      content: response,
      model,
    });

    // Update task record
    await db.updateScheduledTask(taskId, {
      lastRunAt: new Date(),
      lastResult: response,
    });

    execution.status = "completed";
    execution.result = response;
    execution.endTime = new Date();

    console.log(`[Scheduler] Task ${taskId} completed successfully`);
  } catch (error: any) {
    execution.status = "failed";
    execution.error = error.message;
    execution.endTime = new Date();

    console.error(`[Scheduler] Task ${taskId} failed:`, error);

    // Update task record with error
    await db.updateScheduledTask(taskId, {
      lastRunAt: new Date(),
      lastResult: `ERROR: ${error.message}`,
    });
  }

  executionHistory.push(execution);
  // Keep last 100 executions in memory
  if (executionHistory.length > 100) {
    executionHistory.shift();
  }
}

export function getExecutionHistory(taskId?: number) {
  if (taskId) {
    return executionHistory.filter((e) => e.taskId === taskId);
  }
  return executionHistory;
}

export function getActiveJobs() {
  return Array.from(activeJobs.keys());
}
