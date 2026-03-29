import { eq, desc, sql, like, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import fs from "node:fs/promises";
import path from "node:path";
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
  connectorStates, InsertConnectorState,
  scheduledTasks, InsertScheduledTask,
  researchSessions, InsertResearchSession,
  appSettings,
  usageEvents, InsertUsageEvent,
  teams, InsertTeam,
  teamMembers, InsertTeamMember,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
const LOCAL_DATA_DIR = path.join(process.cwd(), ".forge-data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "local-db.json");

type LocalStore = {
  users: Array<any>;
  conversations: Array<any>;
  messages: Array<any>;
  toolExecutions: Array<any>;
  memories: Array<any>;
  usageEvents: Array<any>;
  connectors?: Array<any>;
  connectorStates?: Array<any>;
  appState: {
    credits: number;
    selectedTier: "lite" | "core" | "max";
  };
  counters: {
    users: number;
    conversations: number;
    messages: number;
    toolExecutions: number;
    memories: number;
    usageEvents: number;
  };
};

const defaultStore = (): LocalStore => ({
  users: [],
  conversations: [],
  messages: [],
  toolExecutions: [],
  memories: [],
  usageEvents: [],
  appState: {
    credits: 851,
    selectedTier: "max",
  },
  counters: {
    users: 0,
    conversations: 0,
    messages: 0,
    toolExecutions: 0,
    memories: 0,
    usageEvents: 0,
  },
});

async function readLocalStore(): Promise<LocalStore> {
  try {
    const raw = await fs.readFile(LOCAL_DATA_FILE, "utf8");
    return { ...defaultStore(), ...JSON.parse(raw) } as LocalStore;
  } catch {
    return defaultStore();
  }
}

async function writeLocalStore(store: LocalStore) {
  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.writeFile(LOCAL_DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

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
  if (!db) {
    const store = await readLocalStore();
    const existing = store.users.find((entry) => entry.openId === user.openId);
    const now = new Date().toISOString();
    if (existing) {
      Object.assign(existing, {
        ...user,
        updatedAt: now,
        lastSignedIn: user.lastSignedIn ?? existing.lastSignedIn ?? now,
      });
    } else {
      store.users.push({
        id: ++store.counters.users,
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
        createdAt: now,
        updatedAt: now,
        lastSignedIn: user.lastSignedIn ?? now,
      });
    }
    await writeLocalStore(store);
    return;
  }
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
  if (!db) {
    const store = await readLocalStore();
    return store.users.find((entry) => entry.openId === openId);
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Conversations ───────────────────────────────────────────────────
export async function createConversation(userId: number, data: InsertConversation) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const id = ++store.counters.conversations;
    const now = new Date().toISOString();
    store.conversations.push({
      id,
      userId,
      title: data.title ?? "New Conversation",
      model: data.model ?? "llama3",
      systemPrompt: data.systemPrompt ?? null,
      isArchived: data.isArchived ?? false,
      createdAt: now,
      updatedAt: now,
    });
    await writeLocalStore(store);
    return { id };
  }
  const result = await db.insert(conversations).values({ ...data, userId });
  return { id: result[0].insertId };
}

export async function listConversations(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return [...store.conversations]
      .filter((conversation) => conversation.userId === userId && !conversation.isArchived)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, limit);
  }
  return db.select().from(conversations).where(and(eq(conversations.userId, userId), eq(conversations.isArchived, false))).orderBy(desc(conversations.updatedAt)).limit(limit);
}

export async function getConversation(id: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.conversations.find((conversation) => conversation.id === id) || null;
  }
  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0] || null;
}

export async function updateConversation(id: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const conversation = store.conversations.find((entry) => entry.id === id);
    if (!conversation) return;
    Object.assign(conversation, data, { updatedAt: new Date().toISOString() });
    await writeLocalStore(store);
    return;
  }
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    store.messages = store.messages.filter((message) => message.conversationId !== id);
    store.toolExecutions = store.toolExecutions.filter((execution) => execution.conversationId !== id);
    store.conversations = store.conversations.filter((conversation) => conversation.id !== id);
    await writeLocalStore(store);
    return;
  }
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(toolExecutions).where(eq(toolExecutions.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
}

// ─── Messages ────────────────────────────────────────────────────────
export async function addMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const id = ++store.counters.messages;
    const now = new Date().toISOString();
    store.messages.push({
      id,
      userId: data.userId,
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      model: data.model ?? null,
      tokenCount: data.tokenCount ?? null,
      durationMs: data.durationMs ?? null,
      tokensPerSecond: data.tokensPerSecond ?? null,
      createdAt: now,
    });
    const conversation = store.conversations.find((entry) => entry.id === data.conversationId);
    if (conversation) {
      conversation.updatedAt = now;
    }
    await writeLocalStore(store);
    return { id };
  }
  const result = await db.insert(messages).values(data);
  if (data.conversationId) {
    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, data.conversationId));
  }
  return { id: result[0].insertId };
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// ─── Tool Executions ─────────────────────────────────────────────────
export async function logToolExecution(data: InsertToolExecution) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const id = ++store.counters.toolExecutions;
    store.toolExecutions.push({
      id,
      userId: data.userId,
      conversationId: data.conversationId ?? null,
      messageId: data.messageId ?? null,
      toolName: data.toolName,
      toolInput: data.toolInput,
      toolOutput: data.toolOutput ?? null,
      status: data.status ?? "running",
      durationMs: data.durationMs ?? null,
      createdAt: new Date().toISOString(),
    });
    await writeLocalStore(store);
    return { id };
  }
  const result = await db.insert(toolExecutions).values(data);
  return { id: result[0].insertId };
}

export async function updateToolExecution(id: number, data: Partial<InsertToolExecution>) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const execution = store.toolExecutions.find((entry) => entry.id === id);
    if (!execution) return;
    Object.assign(execution, data);
    await writeLocalStore(store);
    return;
  }
  await db.update(toolExecutions).set(data).where(eq(toolExecutions.id, id));
}

// ─── Memory ──────────────────────────────────────────────────────────
export async function storeMemory(userId: number, category: string, key: string, value: string, source: string) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const existing = store.memories.find((memory) => memory.userId === userId && memory.category === category && memory.key === key);
    const now = new Date().toISOString();
    if (existing) {
      existing.value = value;
      existing.source = source;
      existing.updatedAt = now;
    } else {
      const id = ++store.counters.memories;
      store.memories.push({
        id,
        userId,
        category,
        key,
        value,
        source,
        createdAt: now,
        updatedAt: now,
      });
    }
    await writeLocalStore(store);
    return;
  }
  await db.insert(memories).values({ userId, category, key, value, source });
}

export async function recallMemory(userId: number, search?: string) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const normalizedSearch = search?.toLowerCase();
    return store.memories
      .filter((memory) => memory.userId === userId)
      .filter((memory) => {
        if (!normalizedSearch) return true;
        return memory.key.toLowerCase().includes(normalizedSearch) || memory.value.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 20);
  }
  const conditions = [eq(memories.userId, userId)];
  if (search) conditions.push(sql`(${memories.key} LIKE ${`%${search}%`} OR ${memories.value} LIKE ${`%${search}%`})`);
  return db.select().from(memories).where(and(...conditions)).orderBy(desc(memories.updatedAt)).limit(20);
}

export async function listAllMemories(userId: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return store.memories.filter((m) => m.userId === userId).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 100);
  }
  return db.select().from(memories).where(eq(memories.userId, userId)).orderBy(desc(memories.updatedAt)).limit(100);
}

// ─── Usage / Credits ─────────────────────────────────────────────────
export async function getUsageState() {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const recentEvents = [...(store.usageEvents || [])]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 20);
    return { ...store.appState, recentEvents };
  }
  return { credits: 851, selectedTier: "max" as const, recentEvents: [] };
}

export async function setSelectedTier(tier: "lite" | "core" | "max") {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    store.appState.selectedTier = tier;
    await writeLocalStore(store);
    return { success: true };
  }
  return { success: true };
}

export async function consumeCredits(input: {
  userId: number;
  amount: number;
  tier: "lite" | "core" | "max";
  model: string;
  tokenCount: number;
  conversationId?: number | null;
  note?: string | null;
}) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    const nextCredits = Math.max(0, Number((store.appState.credits - input.amount).toFixed(1)));
    store.appState.credits = nextCredits;
    const id = ++store.counters.usageEvents;
    store.usageEvents.push({
      id,
      userId: input.userId,
      tier: input.tier,
      model: input.model,
      tokenCount: input.tokenCount,
      creditCost: input.amount,
      conversationId: input.conversationId ?? null,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
    });
    await writeLocalStore(store);
    return { credits: nextCredits };
  }

  try {
    await db.insert(usageEvents).values({
      userId: input.userId,
      tier: input.tier,
      model: input.model,
      tokenCount: input.tokenCount,
      creditCost: Math.round(input.amount * 100),
      conversationId: input.conversationId ?? null,
      note: input.note ?? null,
    });
  } catch (error) {
    console.error("[Database] Failed to log usage event:", error);
  }

  return { credits: 851 };
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

// ─── Connectors ──────────────────────────────────────────────────────
export async function listConnectors(userId: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return (store.connectors || []).filter((c: any) => c.userId === userId);
  }
  return db.select().from(connectors).where(eq(connectors.userId, userId)).orderBy(desc(connectors.createdAt));
}

export async function createConnector(userId: number, data: InsertConnector) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(connectors).values({ ...data, userId });
  return { id: result[0].insertId };
}

export async function getConnector(id: number) {
  const db = await getDb();
  if (!db) {
    const store = await readLocalStore();
    return (store.connectors || []).find((c: any) => c.id === id) || null;
  }
  const result = await db.select().from(connectors).where(eq(connectors.id, id)).limit(1);
  return result[0] || null;
}

export async function deleteConnector(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(connectors).where(eq(connectors.id, id));
}

// ─── Scheduled Tasks ─────────────────────────────────────────────────
export async function listScheduledTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledTasks).where(eq(scheduledTasks.userId, userId)).orderBy(desc(scheduledTasks.createdAt));
}

export async function createScheduledTask(userId: number, data: InsertScheduledTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(scheduledTasks).values({ ...data, userId });
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
export async function listResearchSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchSessions).where(eq(researchSessions.userId, userId)).orderBy(desc(researchSessions.createdAt));
}

export async function createResearchSession(userId: number, data: InsertResearchSession) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(researchSessions).values({ ...data, userId });
  return { id: result[0].insertId };
}

export async function getResearchSession(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(researchSessions).where(eq(researchSessions.id, sessionId)).limit(1);
  return result[0] || null;
}

export async function updateResearchSession(id: number, data: Partial<InsertResearchSession>) {
  const db = await getDb();
  if (!db) return;
  await db.update(researchSessions).set(data).where(eq(researchSessions.id, id));
}

// ─── Skills ──────────────────────────────────────────────────────────────────
export async function listSkills(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(skills).where(eq(skills.userId, userId)).orderBy(desc(skills.createdAt));
}
export async function createSkill(userId: number, data: InsertSkill) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(skills).values({ ...data, userId });
  return { id: result[0].insertId };
}
export async function deleteSkill(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(skills).where(eq(skills.id, id));
}

// ─── Prompts (user-scoped) ───────────────────────────────────────────────────
export async function listPrompts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemPrompts).where(eq(systemPrompts.userId, userId)).orderBy(desc(systemPrompts.createdAt));
}
export async function createPrompt(userId: number, data: InsertSystemPrompt) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(systemPrompts).values({ ...data, userId });
  return { id: result[0].insertId };
}
export async function updatePrompt(id: number, data: Partial<InsertSystemPrompt>) {
  const db = await getDb();
  if (!db) return;
  await db.update(systemPrompts).set(data).where(eq(systemPrompts.id, id));
}
export async function deletePrompt(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(systemPrompts).where(eq(systemPrompts.id, id));
}

// ─── Tool Execution list + stats ─────────────────────────────────────────────
export async function listToolExecutions(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(toolExecutions)
    .where(eq(toolExecutions.userId, userId))
    .orderBy(desc(toolExecutions.createdAt))
    .limit(limit);
}
export async function getToolExecutionStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, success: 0, error: 0, running: 0, avgDuration: 0, byTool: [] };
  const rows = await db.select().from(toolExecutions).where(eq(toolExecutions.userId, userId));
  const durations = rows.filter(r => r.durationMs != null).map(r => r.durationMs as number);
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const toolMap = new Map<string, { count: number; totalDuration: number }>();
  for (const row of rows) {
    const entry = toolMap.get(row.toolName) ?? { count: 0, totalDuration: 0 };
    entry.count++;
    if (row.durationMs) entry.totalDuration += row.durationMs;
    toolMap.set(row.toolName, entry);
  }
  const byTool = Array.from(toolMap.entries()).map(([name, { count, totalDuration }]) => ({
    name,
    count,
    avgDuration: count ? Math.round(totalDuration / count) : 0,
  }));
  return {
    total: rows.length,
    success: rows.filter(r => r.status === "success").length,
    error: rows.filter(r => r.status === "error").length,
    running: rows.filter(r => r.status === "running").length,
    avgDuration,
    byTool,
  };
}

// ─── Memory delete ───────────────────────────────────────────────────────────
export async function deleteMemory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(memories).where(eq(memories.id, id));
}

// ─── Teams ───────────────────────────────────────────────────────────
export async function listTeams(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: teams.id,
    name: teams.name,
    ownerId: teams.ownerId,
    role: teamMembers.role,
    joinedAt: teamMembers.joinedAt,
  })
  .from(teams)
  .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
  .where(eq(teamMembers.userId, userId));
}

export async function createTeam(userId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(teams).values({ name, ownerId: userId });
  const teamId = result[0].insertId;
  await db.insert(teamMembers).values({ teamId, userId, role: "owner" });
  return { id: teamId };
}

export async function getTeam(teamId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return result[0] || null;
}

export async function addTeamMember(teamId: number, userId: number, role: "admin" | "member" | "viewer" = "member") {
  const db = await getDb();
  if (!db) return;
  await db.insert(teamMembers).values({ teamId, userId, role });
}

export async function removeTeamMember(teamId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
}

export async function getTeamMembers(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: teamMembers.role,
    joinedAt: teamMembers.joinedAt,
  })
  .from(teamMembers)
  .innerJoin(users, eq(teamMembers.userId, users.id))
  .where(eq(teamMembers.teamId, teamId));
}

// ─── Connector States ────────────────────────────────────────────────
export async function saveConnectorState(
  userId: number,
  connectorType: string,
  state: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    userId?: string;
    state?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) {
    // Fallback to local store
    const store = await readLocalStore();
    if (!store.connectors) store.connectors = [];
    const existing = store.connectors.findIndex(
      (c) => c.userId === userId && c.connectorType === connectorType
    );
    if (existing >= 0) {
      store.connectors[existing] = { userId, connectorType, ...state, updatedAt: new Date() };
    } else {
      store.connectors.push({ userId, connectorType, ...state, createdAt: new Date(), updatedAt: new Date() });
    }
    await writeLocalStore(store);
    return;
  }

  const { connectorStates } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const existing = await db
    .select()
    .from(connectorStates)
    .where(
      and(
        eq(connectorStates.userId, userId),
        eq(connectorStates.connectorType, connectorType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(connectorStates)
      .set({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken || null,
        expiresAt: state.expiresAt,
        state: state.state || null,
      })
      .where(eq(connectorStates.id, existing[0].id));
  } else {
    await db.insert(connectorStates).values({
      userId,
      connectorType,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken || undefined,
      expiresAt: state.expiresAt,
      state: state.state || undefined,
    });
  }
}

export async function getConnectorState(
  userId: number,
  connectorType: string
): Promise<any | null> {
  const db = await getDb();
  if (!db) {
    // Fallback to local store
    const store = await readLocalStore();
    if (!store.connectors) return null;
    return (
      store.connectors.find(
        (c) => c.userId === userId && c.connectorType === connectorType
      ) || null
    );
  }

  const { connectorStates } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  const result = await db
    .select()
    .from(connectorStates)
    .where(
      and(
        eq(connectorStates.userId, userId),
        eq(connectorStates.connectorType, connectorType)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function deleteConnectorState(
  userId: number,
  connectorType: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    // Fallback to local store
    const store = await readLocalStore();
    if (!store.connectors) return;
    store.connectors = store.connectors.filter(
      (c) => !(c.userId === userId && c.connectorType === connectorType)
    );
    await writeLocalStore(store);
    return;
  }

  const { connectorStates } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  await db
    .delete(connectorStates)
    .where(
      and(
        eq(connectorStates.userId, userId),
        eq(connectorStates.connectorType, connectorType)
      )
    );
}

export async function listConnectorStates(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) {
    // Fallback to local store
    const store = await readLocalStore();
    if (!store.connectors) return [];
    return store.connectors
      .filter((c) => c.userId === userId)
      .map((c) => c.connectorType);
  }

  const { connectorStates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const result = await db
    .select({ connectorType: connectorStates.connectorType })
    .from(connectorStates)
    .where(eq(connectorStates.userId, userId));

  return result.map((r) => r.connectorType);
}
