import { UUID } from "crypto";
import { AppRouter } from "../routers";

/**
 * Forge Bridge Layer
 * Decouples UI from Runtime and handles session/capability negotiation.
 * Inspired by Claude Code's bridge architecture.
 */

export interface SessionCapabilities {
  streaming: boolean;
  backgroundTasks: boolean;
  mcp: boolean;
  computer: boolean;
  multiAgent: boolean;
}

export interface SessionState {
  sessionId: string;
  userId: number;
  capabilities: SessionCapabilities;
  status: "active" | "detached" | "hibernating";
  lastHeartbeat: number;
}

const activeSessions = new Map<string, SessionState>();

export function createSession(userId: number, sessionId: string): SessionState {
  const session: SessionState = {
    sessionId,
    userId,
    capabilities: {
      streaming: true,
      backgroundTasks: true,
      mcp: true,
      computer: true,
      multiAgent: true,
    },
    status: "active",
    lastHeartbeat: Date.now(),
  };
  activeSessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): SessionState | undefined {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.lastHeartbeat = Date.now();
  }
  return session;
}

export function updateSessionStatus(sessionId: string, status: SessionState["status"]) {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.status = status;
    session.lastHeartbeat = Date.now();
  }
}

export function listActiveSessions(userId: number): SessionState[] {
  return Array.from(activeSessions.values()).filter(s => s.userId === userId);
}

// Cleanup stale sessions (e.g., no heartbeat for 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.lastHeartbeat > 1000 * 60 * 60) {
      activeSessions.delete(id);
      console.log(`[Bridge] Cleaned up stale session: ${id}`);
    }
  }
}, 1000 * 60 * 15);
