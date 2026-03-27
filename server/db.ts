import { eq, desc, sql, like, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  conversations, InsertConversation,
  messages, InsertMessage,
  toolExecutions, InsertToolExecution,
  systemPrompts, InsertSystemPrompt,
  agentTasks, InsertAgentTask,
  agentSteps, InsertAgentStep,
  memories, InsertMemory,
  skills, InsertSkill,
  connectors, InsertConnector,
  scheduledTasks, InsertScheduledTask,
  researchSessions, InsertResearchSession,
  appSettings,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Conversations ───────────────────────────────────────────────────
export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(conversations).values(data);
  return { id: result[0].insertId };
}

export async function listConversations(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(eq(conversations.isArchived, false)).orderBy(desc(conversations.updatedAt)).limit(limit);
}

export async function getConversation(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0] || null;
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(toolExecutions).where(eq(toolExecutions.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
}

// ─── Messages ────────────────────────────────────────────────────────
export async function addMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(messages).values(data);
  // Update conversation timestamp
  if (data.conversationId) {
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, data.conversationId));
  }
  return { id: result[0].insertId };
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// ─── Tool Executions ─────────────────────────────────────────────────
export async function logToolExecution(data: InsertToolExecution) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(toolExecutions).values(data);
  return { id: result[0].insertId };
}

export async function updateToolExecution(id: number, data: Partial<InsertToolExecution>) {
  const db = await getDb();
  if (!db) return;
  await db.update(toolExecutions).set(data).where(eq(toolExecutions.id, id));
}

export async function getToolExecutions(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(toolExecutions).orderBy(desc(toolExecutions.createdAt)).limit(limit);
}

export async function getToolStats() {
  const db = await getDb();
  if (!db) return { total: 0, success: 0, error: 0, avgDuration: 0, byTool: [] };
  const total = await db.select({ count: sql<number>`count(*)` }).from(toolExecutions);
  const success = await db.select({ count: sql<number>`count(*)` }).from(toolExecutions).where(eq(toolExecutions.status, "success"));
  const errors = await db.select({ count: sql<number>`count(*)` }).from(toolExecutions).where(eq(toolExecutions.status, "error"));
  const avgDur = await db.select({ avg: sql<number>`COALESCE(AVG(durationMs), 0)` }).from(toolExecutions);
  const byTool = await db.select({
    toolName: toolExecutions.toolName,
    count: sql<number>`count(*)`,
    avgDuration: sql<number>`COALESCE(AVG(durationMs), 0)`,
    successRate: sql<number>`ROUND(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1)`,
  }).from(toolExecutions).groupBy(toolExecutions.toolName);

  return {
    total: total[0]?.count || 0,
    success: success[0]?.count || 0,
    error: errors[0]?.count || 0,
    avgDuration: Math.round(avgDur[0]?.avg || 0),
    byTool,
  };
}

// ─── System Prompts ──────────────────────────────────────────────────
export async function listSystemPrompts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemPrompts).orderBy(desc(systemPrompts.isDefault), systemPrompts.name);
}

export async function createSystemPrompt(data: InsertSystemPrompt) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(systemPrompts).values(data);
  return { id: result[0].insertId };
}

export async function updateSystemPrompt(id: number, data: Partial<InsertSystemPrompt>) {
  const db = await getDb();
  if (!db) return;
  await db.update(systemPrompts).set(data).where(eq(systemPrompts.id, id));
}

export async function deleteSystemPrompt(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(systemPrompts).where(eq(systemPrompts.id, id));
}

// ─── Agent Tasks ─────────────────────────────────────────────────────
export async function createAgentTask(data: InsertAgentTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(agentTasks).values(data);
  return { id: result[0].insertId };
}

export async function getAgentTask(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(agentTasks).where(eq(agentTasks.id, id)).limit(1);
  return result[0] || null;
}

export async function updateAgentTask(id: number, data: Partial<InsertAgentTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(agentTasks).set(data).where(eq(agentTasks.id, id));
}

export async function getAgentSteps(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentSteps).where(eq(agentSteps.taskId, taskId)).orderBy(agentSteps.stepIndex);
}

export async function createAgentStep(data: InsertAgentStep) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(agentSteps).values(data);
  return { id: result[0].insertId };
}

export async function updateAgentStep(id: number, data: Partial<InsertAgentStep>) {
  const db = await getDb();
  if (!db) return;
  await db.update(agentSteps).set(data).where(eq(agentSteps.id, id));
}

// ─── Memory ──────────────────────────────────────────────────────────
export async function storeMemory(category: string, key: string, value: string, source: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(memories).values({ category, key, value, source });
}

export async function recallMemory(category?: string, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (category) conditions.push(eq(memories.category, category));
  if (search) conditions.push(sql`(${memories.key} LIKE ${`%${search}%`} OR ${memories.value} LIKE ${`%${search}%`})`);
  if (conditions.length > 0) {
    return db.select().from(memories).where(and(...conditions)).orderBy(desc(memories.updatedAt)).limit(20);
  }
  return db.select().from(memories).orderBy(desc(memories.updatedAt)).limit(20);
}

export async function listAllMemories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(memories).orderBy(desc(memories.updatedAt)).limit(100);
}

export async function deleteMemory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(memories).where(eq(memories.id, id));
}

// ─── Skills ──────────────────────────────────────────────────────────
export async function listSkills() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skills).orderBy(skills.name);
}

export async function createSkill(data: InsertSkill) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(skills).values(data);
  return { id: result[0].insertId };
}

export async function updateSkill(id: number, data: Partial<InsertSkill>) {
  const db = await getDb();
  if (!db) return;
  await db.update(skills).set(data).where(eq(skills.id, id));
}

export async function deleteSkill(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(skills).where(eq(skills.id, id));
}

export async function getSkillBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
  return result[0] || null;
}

// ─── Connectors ──────────────────────────────────────────────────────
export async function listConnectors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(connectors).orderBy(connectors.name);
}

export async function createConnector(data: InsertConnector) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(connectors).values(data);
  return { id: result[0].insertId };
}

export async function updateConnector(id: number, data: Partial<InsertConnector>) {
  const db = await getDb();
  if (!db) return;
  await db.update(connectors).set(data).where(eq(connectors.id, id));
}

export async function deleteConnector(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(connectors).where(eq(connectors.id, id));
}

// ─── Scheduled Tasks ─────────────────────────────────────────────────
export async function listScheduledTasks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledTasks).orderBy(desc(scheduledTasks.createdAt));
}

export async function createScheduledTask(data: InsertScheduledTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(scheduledTasks).values(data);
  return { id: result[0].insertId };
}

export async function updateScheduledTask(id: number, data: Partial<InsertScheduledTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledTasks).set(data).where(eq(scheduledTasks.id, id));
}

export async function deleteScheduledTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(scheduledTasks).where(eq(scheduledTasks.id, id));
}

// ─── Research Sessions ───────────────────────────────────────────────
export async function createResearchSession(data: InsertResearchSession) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(researchSessions).values(data);
  return { id: result[0].insertId };
}

export async function updateResearchSession(id: number, data: Partial<InsertResearchSession>) {
  const db = await getDb();
  if (!db) return;
  await db.update(researchSessions).set(data).where(eq(researchSessions.id, id));
}

export async function listResearchSessions(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchSessions).orderBy(desc(researchSessions.createdAt)).limit(limit);
}

// ─── App Settings ────────────────────────────────────────────────────
export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return result[0]?.value || null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(appSettings).set({ value }).where(eq(appSettings.key, key));
  } else {
    await db.insert(appSettings).values({ key, value });
  }
}
