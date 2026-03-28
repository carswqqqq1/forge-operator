import * as db from "../db";

export type ExecutionLog = {
  id: string;
  userId: number;
  type: "task" | "tool" | "message" | "error";
  title: string;
  description?: string;
  status: "pending" | "running" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

const executionLogs: Map<string, ExecutionLog> = new Map();

export function createExecutionLog(
  userId: number,
  type: ExecutionLog["type"],
  title: string,
  description?: string
): string {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const log: ExecutionLog = {
    id,
    userId,
    type,
    title,
    description,
    status: "pending",
    startTime: new Date(),
  };
  executionLogs.set(id, log);
  return id;
}

export function updateExecutionLog(
  logId: string,
  updates: Partial<ExecutionLog>
): void {
  const log = executionLogs.get(logId);
  if (!log) return;

  Object.assign(log, updates);

  if (updates.status === "completed" || updates.status === "failed") {
    log.endTime = new Date();
    log.durationMs = log.endTime.getTime() - log.startTime.getTime();
  }
}

export function getExecutionLog(logId: string): ExecutionLog | undefined {
  return executionLogs.get(logId);
}

export function getUserExecutionLogs(userId: number, limit: number = 100): ExecutionLog[] {
  return Array.from(executionLogs.values())
    .filter((log) => log.userId === userId)
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
    .slice(0, limit);
}

export function getExecutionStats(userId: number, days: number = 7) {
  const logs = Array.from(executionLogs.values())
    .filter((log) => log.userId === userId)
    .filter((log) => {
      const logDate = log.startTime.getTime();
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      return logDate > cutoff;
    });

  const stats = {
    totalExecutions: logs.length,
    successfulExecutions: logs.filter((l) => l.status === "completed").length,
    failedExecutions: logs.filter((l) => l.status === "failed").length,
    averageDurationMs: logs.reduce((sum, l) => sum + (l.durationMs || 0), 0) / Math.max(1, logs.length),
    byType: {
      task: logs.filter((l) => l.type === "task").length,
      tool: logs.filter((l) => l.type === "tool").length,
      message: logs.filter((l) => l.type === "message").length,
      error: logs.filter((l) => l.type === "error").length,
    },
  };

  return stats;
}

export function clearOldLogs(maxAge: number = 7 * 24 * 60 * 60 * 1000) {
  const cutoff = Date.now() - maxAge;
  const keysToDelete: string[] = [];

  executionLogs.forEach((log, id) => {
    if (log.startTime.getTime() < cutoff) {
      keysToDelete.push(id);
    }
  });

  keysToDelete.forEach((id) => executionLogs.delete(id));
  console.log(`[Observability] Cleared ${keysToDelete.length} old logs`);
}
