import { describe, expect, it, beforeEach } from "vitest";
import * as claude from "./claude";

describe("Claude Client", () => {
  beforeEach(() => {
    claude.disconnect();
  });

  it("getSessionStatus returns proper structure when not configured", () => {
    const status = claude.getSessionStatus();
    expect(status).toHaveProperty("mode");
    expect(status).toHaveProperty("connected");
    expect(status).toHaveProperty("model");
    expect(status.mode).toBe("none");
    expect(status.connected).toBe(false);
  });

  it("isClaudeReady returns false when not configured", () => {
    expect(claude.isClaudeReady()).toBe(false);
  });

  it("CLAUDE_MODELS contains expected models", () => {
    expect(claude.CLAUDE_MODELS.length).toBeGreaterThan(0);
    const ids = claude.CLAUDE_MODELS.map(m => m.id);
    expect(ids).toContain("claude-sonnet-4-20250514");
    for (const model of claude.CLAUDE_MODELS) {
      expect(model).toHaveProperty("id");
      expect(model).toHaveProperty("name");
      expect(model).toHaveProperty("tier");
    }
  });

  it("configureClaudeCookie sets session state to cookie mode", () => {
    claude.configureClaudeCookie("test-session-key", "test-org-id");
    const status = claude.getSessionStatus();
    expect(status.mode).toBe("cookie");
    expect(status.connected).toBe(true);
    expect(status.orgId).toBe("test-org-id");
  });

  it("setClaudeModel updates the model", () => {
    claude.setClaudeModel("claude-opus-4-20250514");
    const status = claude.getSessionStatus();
    expect(status.model).toBe("claude-opus-4-20250514");
  });

  it("disconnect resets all state", () => {
    claude.configureClaudeCookie("test-key");
    expect(claude.isClaudeReady()).toBe(true);

    claude.disconnect();
    expect(claude.isClaudeReady()).toBe(false);
    const status = claude.getSessionStatus();
    expect(status.mode).toBe("none");
    expect(status.connected).toBe(false);
  });

  it("sendMessage yields error when not configured", async () => {
    const chunks: claude.ClaudeStreamChunk[] = [];
    for await (const chunk of claude.sendMessage([{ role: "user", content: "hello" }])) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].type).toBe("error");
    expect(chunks[0].content).toContain("not configured");
  });

  it("sendMessageCookie yields error without valid session key", async () => {
    const chunks: claude.ClaudeStreamChunk[] = [];
    for await (const chunk of claude.sendMessageCookie([{ role: "user", content: "hello" }])) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].type).toBe("error");
  });

  it("sendMessageBrowser yields error without browser launched", async () => {
    const chunks: claude.ClaudeStreamChunk[] = [];
    for await (const chunk of claude.sendMessageBrowser([{ role: "user", content: "hello" }])) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].type).toBe("error");
    expect(chunks[0].content).toContain("Browser not launched");
  });
});

describe("Claude Router Integration", () => {
  it("claude module exports all required functions", () => {
    expect(typeof claude.configureClaudeCookie).toBe("function");
    expect(typeof claude.launchBrowser).toBe("function");
    expect(typeof claude.closeBrowser).toBe("function");
    expect(typeof claude.sendMessage).toBe("function");
    expect(typeof claude.sendMessageCookie).toBe("function");
    expect(typeof claude.sendMessageBrowser).toBe("function");
    expect(typeof claude.getSessionStatus).toBe("function");
    expect(typeof claude.setClaudeModel).toBe("function");
    expect(typeof claude.isClaudeReady).toBe("function");
    expect(typeof claude.disconnect).toBe("function");
  });
});
