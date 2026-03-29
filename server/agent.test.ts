import { describe, expect, it, vi, beforeEach } from "vitest";
import path from "path";
import { executeTool, getToolSummary, AVAILABLE_TOOLS } from "./tools";
import * as ollama from "./ollama";

// ─── Tool Definitions ────────────────────────────────────────────────

describe("Tool Definitions", () => {
  it("has all expected tools defined", () => {
    const names = AVAILABLE_TOOLS.map(t => t.function.name);
    expect(names).toContain("shell");
    expect(names).toContain("file_read");
    expect(names).toContain("file_write");
    expect(names).toContain("file_search");
    expect(names).toContain("web_scrape");
    expect(names).toContain("python_exec");
    expect(names).toContain("web_search");
    expect(names).toContain("memory_store");
    expect(names).toContain("memory_recall");
    expect(names).toContain("computer_snapshot");
    expect(names).toContain("computer_launch");
    expect(names).toContain("computer_action");
    expect(names).toContain("computer_close");
  });

  it("all tools have required structure", () => {
    for (const tool of AVAILABLE_TOOLS) {
      expect(tool.type).toBe("function");
      expect(tool.function.name).toBeTruthy();
      expect(tool.function.description).toBeTruthy();
      expect(tool.function.parameters.type).toBe("object");
      expect(tool.function.parameters.required).toBeInstanceOf(Array);
    }
  });

  it("getToolSummary returns correct format", () => {
    const summary = getToolSummary();
    expect(summary.length).toBe(AVAILABLE_TOOLS.length);
    for (const item of summary) {
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("description");
      expect(typeof item.name).toBe("string");
      expect(typeof item.description).toBe("string");
    }
  });
});

// ─── Tool Execution ──────────────────────────────────────────────────

describe("Tool Execution - shell", () => {
  it("executes a simple echo command", async () => {
    const result = await executeTool("shell", { command: "echo hello" });
    expect(result.success).toBe(true);
    expect(result.output).toBe("hello");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("handles command failure gracefully", async () => {
    const result = await executeTool("shell", { command: "false" });
    // 'false' returns exit code 1 but no output
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("captures stderr output", async () => {
    const result = await executeTool("shell", { command: "echo error >&2" });
    expect(result.success).toBe(true);
    expect(result.output).toContain("error");
  });
});

describe("Tool Execution - file operations", () => {
  const testPath = "/tmp/manus_test_file_" + Date.now() + ".txt";
  const testContent = "Hello from Manus Agent test!";

  it("writes a file successfully", async () => {
    const result = await executeTool("file_write", { path: testPath, content: testContent });
    expect(result.success).toBe(true);
    expect(result.output).toContain("File written");
    expect(result.output).toContain(testPath);
  });

  it("reads a file successfully", async () => {
    // First write
    await executeTool("file_write", { path: testPath, content: testContent });
    const result = await executeTool("file_read", { path: testPath });
    expect(result.success).toBe(true);
    expect(result.output).toBe(testContent);
  });

  it("handles reading non-existent file", async () => {
    const result = await executeTool("file_read", { path: "/tmp/nonexistent_file_xyz.txt" });
    expect(result.success).toBe(false);
    expect(result.output).toContain("Error");
  });

  it("creates directories when writing", async () => {
    const deepPath = `/tmp/manus_test_${Date.now()}/deep/nested/file.txt`;
    const result = await executeTool("file_write", { path: deepPath, content: "nested" });
    expect(result.success).toBe(true);
  });
});

describe("Tool Execution - file_search", () => {
  const serverDir = path.join(process.cwd(), "server");

  it("searches for files by glob pattern", async () => {
    const result = await executeTool("file_search", {
      pattern: "*.ts",
      directory: serverDir,
      type: "glob",
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain(".ts");
  });

  it("searches for content with grep", async () => {
    const result = await executeTool("file_search", {
      pattern: "executeTool",
      directory: serverDir,
      type: "grep",
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("executeTool");
  });
});

describe("Tool Execution - python_exec", () => {
  it("executes simple Python code", async () => {
    const result = await executeTool("python_exec", { code: "print(2 + 2)" });
    expect(result.success).toBe(true);
    expect(result.output.trim()).toBe("4");
  });

  it("handles Python errors", async () => {
    const result = await executeTool("python_exec", { code: "raise ValueError('test error')" });
    expect(result.success).toBe(true); // shell returns output even on error
    expect(result.output).toContain("ValueError");
  });
});

describe("Tool Execution - memory", () => {
  it("handles memory store without db helpers", async () => {
    const result = await executeTool("memory_store", {
      category: "test",
      key: "test_key",
      value: "test_value",
    });
    expect(result.success).toBe(true);
    expect(result.output).toBe("Memory storage not available");
  });

  it("handles memory recall without db helpers", async () => {
    const result = await executeTool("memory_recall", {});
    expect(result.success).toBe(true);
    expect(result.output).toBe("Memory recall not available");
  });

  it("stores memory with db helpers", async () => {
    let stored = false;
    const result = await executeTool("memory_store", {
      category: "preference",
      key: "theme",
      value: "dark",
    }, {
      storeMemory: async () => { stored = true; },
      recallMemory: async () => [],
    });
    expect(result.success).toBe(true);
    expect(stored).toBe(true);
    expect(result.output).toContain("Stored memory");
  });

  it("recalls memory with db helpers", async () => {
    const result = await executeTool("memory_recall", {
      category: "preference",
    }, {
      storeMemory: async () => {},
      recallMemory: async () => [{ category: "preference", key: "theme", value: "dark" }],
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("theme");
    expect(result.output).toContain("dark");
  });
});

describe("Tool Execution - unknown tool", () => {
  it("returns error for unknown tool", async () => {
    const result = await executeTool("nonexistent_tool", {});
    expect(result.success).toBe(false);
    expect(result.output).toContain("Unknown tool");
  });
});

// ─── Ollama Client ───────────────────────────────────────────────────

describe("Ollama Client", () => {
  it("getOllamaUrl returns a URL string", () => {
    const url = ollama.getOllamaUrl();
    expect(typeof url).toBe("string");
    expect(url).toContain("http");
  });

  it("checkOllamaHealth returns proper structure", async () => {
    const health = await ollama.checkOllamaHealth();
    expect(health).toHaveProperty("ok");
    expect(typeof health.ok).toBe("boolean");
    // Ollama may not be running in test env, so either ok or error
    if (health.ok) {
      expect(health.version).toBeTruthy();
    } else {
      expect(health.error).toBeTruthy();
    }
  });

  it("listModels returns an array", async () => {
    const models = await ollama.listModels();
    expect(Array.isArray(models)).toBe(true);
  });
});
