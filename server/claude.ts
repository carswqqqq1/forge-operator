/**
 * Claude Subscription Client
 * Two modes for using your existing Claude subscription (no API key needed):
 *
 * 1. Cookie/Session Relay — Extract session cookies from your browser and
 *    make direct HTTP requests to Claude's internal endpoints.
 *
 * 2. Browser Automation — Launch a headless/visible Chrome instance via
 *    Puppeteer to interact with claude.ai using your logged-in session.
 */

import type { OllamaMessage } from "./ollama";

// ─── Types ──────────────────────────────────────────────────────────

export interface ClaudeConfig {
  /** Mode of operation */
  mode: "cookie" | "browser";
  /** Session cookie value (for cookie mode) */
  sessionKey?: string;
  /** Organization ID from claude.ai (for cookie mode) */
  orgId?: string;
  /** Path to Chrome/Chromium executable (for browser mode) */
  chromePath?: string;
  /** Whether to run headless (for browser mode) */
  headless?: boolean;
  /** User data dir for persistent login (for browser mode) */
  userDataDir?: string;
  /** Claude model to use */
  model?: string;
}

export interface ClaudeStreamChunk {
  type: "text" | "tool_use" | "done" | "error" | "status";
  content: string;
  model?: string;
  tokenCount?: number;
}

interface ClaudeSessionState {
  mode: "cookie" | "browser" | "none";
  connected: boolean;
  model: string;
  orgId?: string;
  error?: string;
  browserPid?: number;
}

// ─── State ──────────────────────────────────────────────────────────

let currentConfig: ClaudeConfig | null = null;
let sessionState: ClaudeSessionState = {
  mode: "none",
  connected: false,
  model: "claude-sonnet-4-20250514",
};

// Browser automation state
let browserInstance: any = null;
let browserPage: any = null;

// ─── Cookie/Session Relay Mode ──────────────────────────────────────

const CLAUDE_BASE = "https://claude.ai";
const CLAUDE_API_BASE = `${CLAUDE_BASE}/api`;

/**
 * Configure the Claude client with session cookies.
 * To get your session key:
 * 1. Log into claude.ai in your browser
 * 2. Open DevTools → Application → Cookies
 * 3. Copy the value of the `sessionKey` cookie
 */
export function configureClaudeCookie(sessionKey: string, orgId?: string): void {
  currentConfig = { mode: "cookie", sessionKey, orgId };
  sessionState = {
    mode: "cookie",
    connected: true,
    model: "claude-sonnet-4-20250514",
    orgId,
  };
}

/** Build headers for cookie-based requests */
function getCookieHeaders(): Record<string, string> {
  if (!currentConfig?.sessionKey) throw new Error("Claude session key not configured");
  return {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/event-stream, application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": `${CLAUDE_BASE}/chat`,
    "Origin": CLAUDE_BASE,
    "Cookie": `sessionKey=${currentConfig.sessionKey}`,
  };
}

/** Get the organization ID (required for API calls) */
async function getOrganizationId(): Promise<string> {
  if (currentConfig?.orgId) return currentConfig.orgId;

  const res = await fetch(`${CLAUDE_API_BASE}/organizations`, {
    headers: getCookieHeaders(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Failed to get org: HTTP ${res.status}`);
  const orgs = await res.json() as Array<{ uuid: string; name: string }>;
  if (!orgs.length) throw new Error("No organizations found");

  const orgId = orgs[0].uuid;
  if (currentConfig) currentConfig.orgId = orgId;
  sessionState.orgId = orgId;
  return orgId;
}

/** Create a new conversation on claude.ai */
async function createClaudeConversation(orgId: string): Promise<string> {
  const res = await fetch(`${CLAUDE_API_BASE}/organizations/${orgId}/chat_conversations`, {
    method: "POST",
    headers: getCookieHeaders(),
    body: JSON.stringify({
      uuid: crypto.randomUUID(),
      name: "",
      model: sessionState.model,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Failed to create conversation: HTTP ${res.status}`);
  const data = await res.json() as { uuid: string };
  return data.uuid;
}

/**
 * Send a message via cookie relay and stream the response.
 * Returns an async generator that yields text chunks.
 */
export async function* sendMessageCookie(
  messages: OllamaMessage[],
  conversationUuid?: string
): AsyncGenerator<ClaudeStreamChunk> {
  if (!currentConfig?.sessionKey) {
    yield { type: "error", content: "Claude session key not configured. Go to Settings → Claude to set it up." };
    return;
  }

  try {
    const orgId = await getOrganizationId();
    const convId = conversationUuid || await createClaudeConversation(orgId);

    // Build the user message (last user message)
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) {
      yield { type: "error", content: "No user message found" };
      return;
    }

    // Build system prompt from system messages
    const systemMsgs = messages.filter(m => m.role === "system");
    const systemPrompt = systemMsgs.map(m => m.content).join("\n\n");

    const body: any = {
      completion: {
        prompt: lastUserMsg.content,
        timezone: "America/Denver",
        model: sessionState.model,
      },
      organization_uuid: orgId,
      conversation_uuid: convId,
      text: lastUserMsg.content,
      attachments: [],
      files: [],
    };

    if (systemPrompt) {
      body.completion.prompt = `${systemPrompt}\n\nUser: ${lastUserMsg.content}`;
    }

    const res = await fetch(
      `${CLAUDE_API_BASE}/organizations/${orgId}/chat_conversations/${convId}/completion`,
      {
        method: "POST",
        headers: getCookieHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      yield { type: "error", content: `Claude API error ${res.status}: ${errText.slice(0, 200)}` };
      return;
    }

    // Parse SSE stream
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data) continue;

        try {
          const event = JSON.parse(data);

          if (event.type === "completion") {
            totalTokens++;
            yield {
              type: "text",
              content: event.completion || "",
              model: sessionState.model,
              tokenCount: totalTokens,
            };
          } else if (event.type === "error") {
            yield { type: "error", content: event.error?.message || "Unknown error" };
          }
        } catch {
          // Non-JSON line, skip
        }
      }
    }

    yield { type: "done", content: "", tokenCount: totalTokens, model: sessionState.model };
  } catch (error: any) {
    yield { type: "error", content: `Claude error: ${error.message}` };
  }
}

// ─── Browser Automation Mode ────────────────────────────────────────

/**
 * Launch a Chrome browser pointed at claude.ai.
 * Uses your existing Chrome profile so you stay logged in.
 */
export async function launchBrowser(config?: Partial<ClaudeConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamic import to avoid bundling issues
    const puppeteer = await import("puppeteer-core");

    const chromePath = config?.chromePath || findChromePath();
    const userDataDir = config?.userDataDir || getDefaultUserDataDir();
    const headless = config?.headless ?? false;

    browserInstance = await puppeteer.default.launch({
      executablePath: chromePath,
      headless,
      userDataDir,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1280,900",
      ],
      defaultViewport: { width: 1280, height: 900 },
    });

    browserPage = await browserInstance.newPage();

    // Set realistic user agent
    await browserPage.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to claude.ai
    await browserPage.goto(`${CLAUDE_BASE}/chat`, { waitUntil: "networkidle2", timeout: 30000 });

    // Check if logged in
    const isLoggedIn = await browserPage.evaluate(() => {
      return !document.querySelector('[data-testid="login-button"]') &&
             !window.location.pathname.includes("/login");
    });

    currentConfig = { mode: "browser", chromePath, headless, userDataDir };
    sessionState = {
      mode: "browser",
      connected: isLoggedIn,
      model: config?.model || "claude-sonnet-4-20250514",
      browserPid: browserInstance.process()?.pid,
    };

    if (!isLoggedIn) {
      return {
        success: true,
        error: "Browser launched but not logged in. Please log in to claude.ai in the browser window.",
      };
    }

    return { success: true };
  } catch (error: any) {
    sessionState = { mode: "browser", connected: false, model: "claude-sonnet-4-20250514", error: error.message };
    return { success: false, error: error.message };
  }
}

/**
 * Send a message via browser automation.
 * Types into the claude.ai chat input and reads the streamed response.
 */
export async function* sendMessageBrowser(
  messages: OllamaMessage[]
): AsyncGenerator<ClaudeStreamChunk> {
  if (!browserPage || !browserInstance) {
    yield { type: "error", content: "Browser not launched. Go to Settings → Claude → Launch Browser." };
    return;
  }

  try {
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) {
      yield { type: "error", content: "No user message found" };
      return;
    }

    yield { type: "status", content: "Typing message into Claude..." };

    // Find and click the chat input
    const inputSelector = '[contenteditable="true"], textarea[placeholder], div.ProseMirror';
    await browserPage.waitForSelector(inputSelector, { timeout: 10000 });

    // Clear and type the message
    await browserPage.click(inputSelector);
    await browserPage.evaluate((sel: string) => {
      const el = document.querySelector(sel) as HTMLElement;
      if (el) {
        el.textContent = "";
        el.focus();
      }
    }, inputSelector);

    // Type the message
    await browserPage.type(inputSelector, lastUserMsg.content, { delay: 5 });

    // Press Enter or click send button
    const sendBtn = await browserPage.$('button[aria-label="Send Message"], button[data-testid="send-button"]');
    if (sendBtn) {
      await sendBtn.click();
    } else {
      await browserPage.keyboard.press("Enter");
    }

    yield { type: "status", content: "Waiting for Claude's response..." };

    // Wait for response to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Poll for response content
    let lastContent = "";
    let stableCount = 0;
    let totalTokens = 0;
    const maxWait = 120000; // 2 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      // Get the latest assistant message content
      const content = await browserPage.evaluate(() => {
        const messages = document.querySelectorAll('[data-testid="assistant-message"], .font-claude-message, [class*="assistant"]');
        const lastMsg = messages[messages.length - 1];
        return lastMsg?.textContent || "";
      });

      if (content && content !== lastContent) {
        const newContent = content.slice(lastContent.length);
        if (newContent) {
          totalTokens += newContent.split(/\s+/).length;
          yield { type: "text", content: newContent, model: sessionState.model, tokenCount: totalTokens };
        }
        lastContent = content;
        stableCount = 0;
      } else {
        stableCount++;
        // If content hasn't changed for 3 seconds, assume done
        if (stableCount > 6 && lastContent) break;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    yield { type: "done", content: "", tokenCount: totalTokens, model: sessionState.model };
  } catch (error: any) {
    yield { type: "error", content: `Browser automation error: ${error.message}` };
  }
}

/** Close the browser instance */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try { await browserInstance.close(); } catch {}
    browserInstance = null;
    browserPage = null;
    sessionState = { mode: "none", connected: false, model: sessionState.model };
  }
}

// ─── Unified Interface ──────────────────────────────────────────────

/**
 * Send a message using the currently configured mode.
 * Returns an async generator of streaming chunks.
 */
export async function* sendMessage(
  messages: OllamaMessage[],
  conversationUuid?: string
): AsyncGenerator<ClaudeStreamChunk> {
  if (sessionState.mode === "cookie") {
    yield* sendMessageCookie(messages, conversationUuid);
  } else if (sessionState.mode === "browser") {
    yield* sendMessageBrowser(messages);
  } else {
    yield { type: "error", content: "Claude not configured. Go to Settings → Claude to set up cookie or browser mode." };
  }
}

/** Get current session status */
export function getSessionStatus(): ClaudeSessionState {
  return { ...sessionState };
}

/** Update the Claude model */
export function setClaudeModel(model: string): void {
  sessionState.model = model;
}

/** Check if Claude is configured and ready */
export function isClaudeReady(): boolean {
  return sessionState.connected && sessionState.mode !== "none";
}

/** Disconnect and reset */
export function disconnect(): void {
  closeBrowser();
  currentConfig = null;
  sessionState = { mode: "none", connected: false, model: "claude-sonnet-4-20250514" };
}

/** Available Claude models based on subscription tier */
export const CLAUDE_MODELS = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", tier: "free" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", tier: "free" },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", tier: "pro" },
  { id: "claude-sonnet-4-20250514-extended", name: "Claude Sonnet 4 (Extended)", tier: "pro" },
];

// ─── Helpers ────────────────────────────────────────────────────────

function findChromePath(): string {
  const paths = [
    // macOS
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // Linux
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    // Windows
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];

  // In sandbox/server environment, return a reasonable default
  return paths[0];
}

function getDefaultUserDataDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || "/tmp";
  const platform = process.platform;
  if (platform === "darwin") return `${home}/Library/Application Support/Google/Chrome`;
  if (platform === "win32") return `${home}\\AppData\\Local\\Google\\Chrome\\User Data`;
  return `${home}/.config/google-chrome`;
}
