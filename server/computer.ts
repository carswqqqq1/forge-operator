import { Sandbox } from "@e2b/desktop";

export type ForgeComputerMode = "e2b" | "none";
export type ForgeComputerStatus = "offline" | "starting" | "running" | "error";

export interface ForgeComputerSnapshot {
  mode: ForgeComputerMode;
  connected: boolean;
  status: ForgeComputerStatus;
  title: string;
  url: string;
  streamUrl: string | null;
  screenshot: string | null;
  lastUpdated: string;
  error?: string | null;
}

export type ForgeComputerAction =
  | { kind: "click"; x: number; y: number }
  | { kind: "doubleClick"; x: number; y: number }
  | { kind: "rightClick"; x: number; y: number }
  | { kind: "move"; x: number; y: number }
  | { kind: "scroll"; amount: number }
  | { kind: "type"; text: string; chunkSize?: number; delayInMs?: number }
  | { kind: "press"; keys: string | string[] }
  | { kind: "launch"; app: string }
  | { kind: "open"; path: string }
  | { kind: "command"; command: string };

let desktop: any | null = null;
let launchPromise: Promise<any> | null = null;
let streamStarted = false;
let authKey: string | null = null;
let snapshotCache: ForgeComputerSnapshot = {
  mode: "none",
  connected: false,
  status: "offline",
  title: "Forge computer is offline",
  url: "",
  streamUrl: null,
  screenshot: null,
  lastUpdated: new Date().toISOString(),
  error: null,
};

function hasE2BEnv() {
  return !!process.env.E2B_API_KEY;
}

function toDataUrl(image: ArrayBuffer | Uint8Array | Buffer | string | null) {
  if (!image) return null;
  if (typeof image === "string") {
    return image.startsWith("data:") ? image : `data:image/png;base64,${Buffer.from(image).toString("base64")}`;
  }
  if (image instanceof ArrayBuffer) {
    return `data:image/png;base64,${Buffer.from(new Uint8Array(image)).toString("base64")}`;
  }
  return `data:image/png;base64,${Buffer.from(image as Uint8Array).toString("base64")}`;
}

async function startDesktop() {
  if (desktop) return desktop;
  if (launchPromise) return launchPromise;

  launchPromise = (async () => {
    const sandbox = await Sandbox.create();
    desktop = sandbox;

    try {
      await sandbox.launch("google-chrome");
    } catch (error) {
      try {
        await sandbox.launch("firefox");
      } catch {}
    }

    try {
      if (!streamStarted) {
        await sandbox.stream.start({ requireAuth: true });
        authKey = await sandbox.stream.getAuthKey();
        streamStarted = true;
      }
    } catch (error) {
      console.warn("[Forge] Failed to start desktop stream:", error);
    }

    return sandbox;
  })().finally(() => {
    launchPromise = null;
  });

  return launchPromise;
}

async function readWindowTitle(): Promise<string> {
  if (!desktop) return "Forge computer";
  try {
    const windowId = await desktop.getCurrentWindowId?.();
    if (!windowId) return "Forge computer";
    const title = await desktop.getWindowTitle?.(windowId);
    return title || "Forge computer";
  } catch {
    return "Forge computer";
  }
}

async function readStreamUrl(): Promise<string | null> {
  if (!desktop) return null;
  try {
    if (!streamStarted) {
      await desktop.stream.start({ requireAuth: true });
      authKey = await desktop.stream.getAuthKey();
      streamStarted = true;
    }
    return desktop.stream.getUrl({ authKey: authKey || undefined });
  } catch (error) {
    console.warn("[Forge] Failed to resolve desktop stream URL:", error);
    return null;
  }
}

function makeOfflineSnapshot(error: string | null = null): ForgeComputerSnapshot {
  return {
    mode: "none",
    connected: false,
    status: "offline",
    title: "Forge computer",
    url: "",
    streamUrl: null,
    screenshot: null,
    lastUpdated: new Date().toISOString(),
    error,
  };
}

async function captureSnapshot(options: { launchIfMissing?: boolean } = {}) {
  if (!hasE2BEnv()) {
    snapshotCache = makeOfflineSnapshot("E2B_API_KEY is not configured.");
    return snapshotCache;
  }

  try {
    if (!desktop) {
      if (!options.launchIfMissing) {
        snapshotCache = makeOfflineSnapshot("Launch the Forge computer to open the desktop.");
        return snapshotCache;
      }
      await startDesktop();
    }

    const sandbox = desktop;
    if (!sandbox) {
      snapshotCache = makeOfflineSnapshot("Forge computer could not be started.");
      return snapshotCache;
    }
    const [screenshot, title, streamUrl] = await Promise.all([
      sandbox.screenshot().catch(() => null),
      readWindowTitle(),
      readStreamUrl(),
    ]);

    snapshotCache = {
      mode: "e2b",
      connected: true,
      status: "running",
      title,
      url: "",
      streamUrl,
      screenshot: toDataUrl(screenshot),
      lastUpdated: new Date().toISOString(),
      error: null,
    };
    return snapshotCache;
  } catch (error: any) {
    snapshotCache = {
      mode: "e2b",
      connected: false,
      status: "error",
      title: "Forge computer failed to launch",
      url: "",
      streamUrl: null,
      screenshot: null,
      lastUpdated: new Date().toISOString(),
      error: error?.message || "Failed to capture computer snapshot",
    };
    return snapshotCache;
  }
}

export async function getComputerSnapshot() {
  return captureSnapshot({ launchIfMissing: false });
}

export function getComputerSnapshotSync() {
  return snapshotCache;
}

export async function launchComputer() {
  const snapshot = await captureSnapshot({ launchIfMissing: true });
  return snapshot;
}

export async function closeComputer() {
  try {
    if (desktop) {
      await desktop.kill();
    }
  } catch {}
  desktop = null;
  launchPromise = null;
  streamStarted = false;
  authKey = null;
  snapshotCache = makeOfflineSnapshot();
  return snapshotCache;
}

export async function performComputerAction(action: ForgeComputerAction) {
  if (!hasE2BEnv()) {
    throw new Error("E2B_API_KEY is not configured.");
  }

  const sandbox = desktop || (await startDesktop());

  switch (action.kind) {
    case "click":
      await sandbox.leftClick(action.x, action.y);
      break;
    case "doubleClick":
      await sandbox.doubleClick(action.x, action.y);
      break;
    case "rightClick":
      await sandbox.rightClick(action.x, action.y);
      break;
    case "move":
      await sandbox.moveMouse(action.x, action.y);
      break;
    case "scroll":
      await sandbox.scroll(action.amount);
      break;
    case "type":
      await sandbox.write(action.text, { chunkSize: action.chunkSize ?? 25, delayInMs: action.delayInMs ?? 20 });
      break;
    case "press":
      await sandbox.press(action.keys as any);
      break;
    case "launch":
      await sandbox.launch(action.app);
      break;
    case "open":
      await sandbox.open(action.path);
      break;
    case "command":
      await sandbox.commands.run(action.command);
      break;
  }

  return captureSnapshot({ launchIfMissing: true });
}
