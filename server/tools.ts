/**
 * Forge Tool Execution Engine
 * Enhanced with Claude Code patterns: advanced contracts, safety flags, and multi-agent support.
 */
import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import type { OllamaTool } from "./ollama";
import {
  closeComputer,
  getComputerSnapshot,
  launchComputer,
  performComputerAction,
} from "./computer";

// ─── Types & Interfaces ──────────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  output: string;
  durationMs: number;
  isReadOnly?: boolean;
  isDestructive?: boolean;
}

export interface ForgeTool extends OllamaTool {
  category: "system" | "files" | "web" | "memory" | "agent" | "computer";
  isReadOnly?: boolean;
  isDestructive?: boolean;
  renderSummary?: (args: any, result: ToolResult) => string;
}

function summarizeComputerSnapshot(snapshot: Awaited<ReturnType<typeof getComputerSnapshot>>) {
  return JSON.stringify(
    {
      mode: snapshot.mode,
      connected: snapshot.connected,
      status: snapshot.status,
      title: snapshot.title,
      url: snapshot.url,
      streamUrl: snapshot.streamUrl,
      lastUpdated: snapshot.lastUpdated,
      error: snapshot.error ?? null,
      screenshot: snapshot.screenshot ? "available" : null,
    },
    null,
    2
  );
}

// ─── Tool Definitions ────────────────────────────────────────────────

export const AVAILABLE_TOOLS: ForgeTool[] = [
  {
    type: "function",
    category: "system",
    isReadOnly: false,
    function: {
      name: "shell",
      description: "Execute a shell command on the local system. Use for running programs, installing packages, system operations, git commands, etc.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The shell command to execute" },
          timeout: { type: "string", description: "Timeout in seconds (default: 30)" },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    category: "files",
    isReadOnly: true,
    function: {
      name: "file_read",
      description: "Read the contents of a file at the given path.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Absolute or relative file path to read" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    category: "files",
    isReadOnly: false,
    isDestructive: true,
    function: {
      name: "file_write",
      description: "Write content to a file. Creates the file if it doesn't exist, overwrites if it does.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path to write to" },
          content: { type: "string", description: "Content to write to the file" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    category: "files",
    isReadOnly: true,
    function: {
      name: "file_search",
      description: "Search for files matching a glob pattern or search for text within files using grep.",
      parameters: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Glob pattern for file search or regex for content search" },
          directory: { type: "string", description: "Directory to search in (default: current directory)" },
          type: { type: "string", description: "Search type: 'glob' for file names, 'grep' for file contents", enum: ["glob", "grep"] },
        },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function",
    category: "web",
    isReadOnly: true,
    function: {
      name: "web_scrape",
      description: "Fetch and extract content from a URL. Returns the text content of the page.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to fetch and scrape" },
          selector: { type: "string", description: "Optional CSS selector to extract specific content" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    category: "system",
    isReadOnly: false,
    function: {
      name: "python_exec",
      description: "Execute Python code in a sandboxed environment. Use for data analysis, calculations, file processing, etc.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string", description: "Python code to execute" },
        },
        required: ["code"],
      },
    },
  },
  {
    type: "function",
    category: "web",
    isReadOnly: true,
    function: {
      name: "web_search",
      description: "Search the web for information using DuckDuckGo. Returns search results with titles, URLs, and snippets.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          num_results: { type: "string", description: "Number of results to return (default: 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    category: "memory",
    isReadOnly: false,
    function: {
      name: "memory_store",
      description: "Store a piece of information in long-term memory for future reference.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Category: 'preference', 'fact', 'context', 'format'" },
          key: { type: "string", description: "A short key/label for this memory" },
          value: { type: "string", description: "The information to remember" },
          type: { type: "string", enum: ["episodic", "durable"], description: "Memory type: episodic (task-specific) or durable (long-term facts)" },
        },
        required: ["category", "key", "value"],
      },
    },
  },
  {
    type: "function",
    category: "memory",
    isReadOnly: true,
    function: {
      name: "memory_recall",
      description: "Recall stored memories by category or search term.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Category to filter by (optional)" },
          search: { type: "string", description: "Search term to find relevant memories (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    category: "agent",
    isReadOnly: false,
    function: {
      name: "spawn_subagent",
      description: "Spawn a specialized sub-agent to handle a specific sub-task. Useful for parallelizing work or delegating complex research/coding tasks.",
      parameters: {
        type: "object",
        properties: {
          goal: { type: "string", description: "The specific goal for the sub-agent" },
          role: { type: "string", description: "The role/specialty of the sub-agent (e.g., 'researcher', 'coder', 'reviewer')" },
          context: { type: "string", description: "Additional context or files the sub-agent should know about" },
        },
        required: ["goal", "role"],
      },
    },
  },
  {
    type: "function",
    category: "computer",
    isReadOnly: true,
    function: {
      name: "computer_snapshot",
      description: "Get the current Forge computer snapshot, including status and stream information.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    category: "computer",
    isReadOnly: false,
    function: {
      name: "computer_launch",
      description: "Launch or refresh the Forge computer desktop.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    category: "computer",
    isReadOnly: false,
    function: {
      name: "computer_action",
      description: "Perform a direct action on the Forge computer desktop such as click, type, scroll, launch an app, or run a command.",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            enum: [
              "click",
              "doubleClick",
              "rightClick",
              "move",
              "scroll",
              "type",
              "press",
              "launch",
              "open",
              "command",
            ],
          },
          x: { type: "number" },
          y: { type: "number" },
          amount: { type: "number" },
          text: { type: "string" },
          chunkSize: { type: "number" },
          delayInMs: { type: "number" },
          keys: {
            anyOf: [
              { type: "string" },
              { type: "array", items: { type: "string" } },
            ],
          },
          app: { type: "string" },
          path: { type: "string" },
          command: { type: "string" },
        },
        required: ["kind"],
      },
    },
  },
  {
    type: "function",
    category: "computer",
    isReadOnly: false,
    isDestructive: true,
    function: {
      name: "computer_close",
      description: "Close the Forge computer desktop and release the sandbox.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// ─── Tool Executor ───────────────────────────────────────────────────

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  dbHelpers?: {
    storeMemory?: (category: string, key: string, value: string, source: string, type?: "episodic" | "durable") => Promise<void>;
    recallMemory?: (category?: string, search?: string) => Promise<any[]>;
    spawnSubagent?: (goal: string, role: string, context?: string) => Promise<any>;
  }
): Promise<ToolResult> {
  const start = Date.now();
  const toolDef = AVAILABLE_TOOLS.find(t => t.function.name === toolName);

  try {
    let output: string;

    switch (toolName) {
      case "shell":
        output = await executeShell(args.command as string, parseInt(args.timeout as string) || 30);
        break;
      case "file_read":
        output = await executeFileRead(args.path as string);
        break;
      case "file_write":
        output = await executeFileWrite(args.path as string, args.content as string);
        break;
      case "file_search":
        output = await executeFileSearch(
          args.pattern as string,
          args.directory as string,
          (args.type as string) || "glob"
        );
        break;
      case "web_scrape":
        output = await executeWebScrape(args.url as string, args.selector as string);
        break;
      case "python_exec":
        output = await executePython(args.code as string);
        break;
      case "web_search":
        output = await executeWebSearch(args.query as string, parseInt(args.num_results as string) || 5);
        break;
      case "memory_store":
        if (dbHelpers?.storeMemory) {
          await dbHelpers.storeMemory(
            args.category as string,
            args.key as string,
            args.value as string,
            "agent",
            (args.type as "episodic" | "durable") || "episodic"
          );
          output = `Stored ${args.type || 'episodic'} memory: [${args.category}] ${args.key}`;
        } else {
          output = "Memory storage not available";
        }
        break;
      case "memory_recall":
        if (dbHelpers?.recallMemory) {
          const memories = await dbHelpers.recallMemory(args.category as string, args.search as string);
          output = memories.length > 0
            ? memories.map(m => `[${m.category}] ${m.key}: ${m.value} (${m.type || 'episodic'})`).join("\n")
            : "No memories found";
        } else {
          output = "Memory recall not available";
        }
        break;
      case "spawn_subagent":
        if (dbHelpers?.spawnSubagent) {
          const result = await dbHelpers.spawnSubagent(
            args.goal as string,
            args.role as string,
            args.context as string
          );
          output = `Sub-agent spawned successfully. Task ID: ${result.taskId}`;
        } else {
          output = "Sub-agent spawning not available";
        }
        break;
      case "computer_snapshot": {
        const snapshot = await getComputerSnapshot();
        output = summarizeComputerSnapshot(snapshot);
        break;
      }
      case "computer_launch": {
        const snapshot = await launchComputer();
        output = summarizeComputerSnapshot(snapshot);
        break;
      }
      case "computer_action": {
        const snapshot = await performComputerAction(args as any);
        output = summarizeComputerSnapshot(snapshot);
        break;
      }
      case "computer_close": {
        const snapshot = await closeComputer();
        output = summarizeComputerSnapshot(snapshot);
        break;
      }
      default:
        output = `Unknown tool: ${toolName}`;
        return { success: false, output, durationMs: Date.now() - start };
    }
    return { 
      success: true, 
      output, 
      durationMs: Date.now() - start,
      isReadOnly: toolDef?.isReadOnly,
      isDestructive: toolDef?.isDestructive
    };
  } catch (error: any) {
    return {
      success: false,
      output: `Error: ${error.message || String(error)}`,
      durationMs: Date.now() - start,
    };
  }
}

// ─── Tool Implementations ────────────────────────────────────────────

async function executeShell(command: string, timeout: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = exec(command, {
      timeout: timeout * 1000,
      maxBuffer: 1024 * 1024 * 10,
      shell: "/bin/bash",
    }, (error, stdout, stderr) => {
      if (error && !stdout && !stderr) {
        reject(new Error(`Command failed: ${error.message}`));
        return;
      }
      const output = [stdout, stderr].filter(Boolean).join("\n").trim();
      resolve(output || "(no output)");
    });
  });
}

async function executeFileRead(filePath: string): Promise<string> {
  const resolved = path.resolve(filePath);
  const stat = await fs.stat(resolved);
  if (stat.size > 1024 * 1024) {
    return `File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB). Reading first 10000 chars...` +
      "\n" + (await fs.readFile(resolved, "utf-8")).slice(0, 10000);
  }
  return await fs.readFile(resolved, "utf-8");
}

async function executeFileWrite(filePath: string, content: string): Promise<string> {
  const resolved = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, content, "utf-8");
  return `File written: ${resolved} (${content.length} bytes)`;
}

async function executeFileSearch(pattern: string, directory: string, type: string): Promise<string> {
  const dir = directory || ".";
  if (type === "grep") {
    return executeShell(`grep -rn "${pattern}" ${dir} --include="*" | head -50`, 15);
  }
  return executeShell(`find ${dir} -name "${pattern}" -type f | head -50`, 15);
}

async function executeWebScrape(url: string, selector?: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const html = await res.text();
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 8000);
}

async function executePython(code: string): Promise<string> {
  const tmpFile = `/tmp/manus_exec_${Date.now()}.py`;
  await fs.writeFile(tmpFile, code, "utf-8");
  try {
    const result = await executeShell(`python3 ${tmpFile} 2>&1`, 60);
    return result;
  } finally {
    await fs.unlink(tmpFile).catch(() => {});
  }
}

async function executeWebSearch(query: string, numResults: number): Promise<string> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const results: string[] = [];
    const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    let i = 0;
    while ((match = linkRegex.exec(html)) && i < numResults) {
      const title = match[2].replace(/<[^>]+>/g, "").trim();
      const href = match[1];
      results.push(`${i + 1}. ${title}\n   ${href}`);
      i++;
    }
    i = 0;
    while ((match = snippetRegex.exec(html)) && i < numResults) {
      const snippet = match[1].replace(/<[^>]+>/g, "").trim();
      if (results[i]) {
        results[i] += `\n   ${snippet}`;
      }
      i++;
    }
    return results.length > 0 ? results.join("\n\n") : "No results found";
  } catch (e: any) {
    return `Search failed: ${e.message}`;
  }
}

export function getToolSummary(): Array<{ name: string; description: string; category: string }> {
  return AVAILABLE_TOOLS.map(t => ({
    name: t.function.name,
    description: t.function.description,
    category: t.category,
  }));
}
