import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Monitor,
  Power,
  PowerOff,
  MousePointer,
  Keyboard,
  Terminal,
  RefreshCw,
  Maximize2,
  ExternalLink,
} from "lucide-react";

type InputMode = "click" | "type" | "command";

export default function Computer() {
  const [inputMode, setInputMode] = useState<InputMode>("click");
  const [typeText, setTypeText] = useState("");
  const [commandText, setCommandText] = useState("");
  const [streamView, setStreamView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { data: snapshot, refetch, isFetching } = trpc.computer.snapshot.useQuery(undefined, {
    refetchInterval: streamView ? false : 2500,
  });

  const launchMutation = trpc.computer.launch.useMutation({
    onSuccess: () => { toast.success("Forge computer launched"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const closeMutation = trpc.computer.close.useMutation({
    onSuccess: () => { toast.success("Forge computer stopped"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const actionMutation = trpc.computer.action.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast.error(err.message),
  });

  const handleScreenshotClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (inputMode !== "click" || !imgRef.current || !snapshot?.connected) return;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    actionMutation.mutate({ kind: "click", x, y });
  }, [inputMode, snapshot?.connected, actionMutation]);

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeText.trim()) return;
    actionMutation.mutate({ kind: "type", text: typeText });
    setTypeText("");
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) return;
    actionMutation.mutate({ kind: "command", command: commandText });
    setCommandText("");
  };

  const handleKeyPress = (keys: string | string[]) => {
    actionMutation.mutate({ kind: "press", keys });
  };

  const isRunning = snapshot?.status === "running";
  const isStarting = snapshot?.status === "starting" || launchMutation.isPending;
  const isOffline = !snapshot?.connected;

  const statusColor = isRunning
    ? "bg-green-500"
    : isStarting
    ? "bg-yellow-500 animate-pulse"
    : "bg-[#7a746c]";

  const statusLabel = isRunning
    ? "Running"
    : isStarting
    ? "Starting…"
    : snapshot?.status === "error"
    ? "Error"
    : "Offline";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ddd8cf] bg-[#f6f5f2] px-6 py-4">
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5 text-[#36322d]" />
          <h1 className="text-lg font-semibold tracking-[-0.03em] text-[#36322d]">Forge Computer</h1>
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", statusColor)} />
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && snapshot?.streamUrl && (
            <button
              onClick={() => setStreamView((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                streamView
                  ? "bg-[#36322d] text-white"
                  : "bg-[#f0ede7] text-[#36322d] hover:bg-[#e8e4de]"
              )}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {streamView ? "Screenshot mode" : "Live stream"}
            </button>
          )}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#f0ede7] hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          </button>

          {isRunning ? (
            <button
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <PowerOff className="h-3.5 w-3.5" />
              Stop
            </button>
          ) : (
            <button
              onClick={() => launchMutation.mutate()}
              disabled={isStarting}
              className="flex items-center gap-1.5 rounded-lg bg-[#36322d] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4a453e] disabled:opacity-50"
            >
              <Power className="h-3.5 w-3.5" />
              {isStarting ? "Launching…" : "Launch"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main display */}
        <div className="flex flex-1 flex-col items-center justify-center overflow-auto bg-[#1a1816] p-4">
          {isOffline && !isStarting ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2a2520]">
                <Monitor className="h-8 w-8 text-[#7a746c]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#efede8]">No active desktop</p>
                <p className="mt-1 text-xs text-[#7a746c]">
                  {snapshot?.error || "Launch the Forge computer to get started"}
                </p>
              </div>
              <button
                onClick={() => launchMutation.mutate()}
                disabled={launchMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-[#efede8] px-5 py-2.5 text-sm font-medium text-[#1a1816] transition-colors hover:bg-white disabled:opacity-50"
              >
                <Power className="h-4 w-4" />
                Launch Forge Computer
              </button>
            </div>
          ) : isStarting && !snapshot?.screenshot ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7a746c] border-t-[#efede8]" />
              <p className="text-sm text-[#7a746c]">Starting desktop environment…</p>
            </div>
          ) : streamView && snapshot?.streamUrl ? (
            <div className="relative h-full w-full overflow-hidden rounded-xl">
              <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1">
                <Maximize2 className="h-3 w-3 text-white/70" />
                <span className="text-[10px] text-white/70">Live</span>
              </div>
              <iframe
                src={snapshot.streamUrl}
                className="h-full w-full rounded-xl border-0"
                allow="fullscreen"
                title="Forge Computer Stream"
              />
            </div>
          ) : snapshot?.screenshot ? (
            <div className="relative max-h-full max-w-full overflow-hidden rounded-xl shadow-2xl">
              <img
                ref={imgRef}
                src={snapshot.screenshot}
                alt="Forge computer desktop"
                className={cn(
                  "max-h-[calc(100vh-220px)] w-auto select-none rounded-xl",
                  inputMode === "click" && isRunning
                    ? "cursor-crosshair"
                    : "cursor-default"
                )}
                draggable={false}
                onClick={handleScreenshotClick}
              />
              {actionMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
              {snapshot.title && (
                <div className="absolute bottom-0 left-0 right-0 rounded-b-xl bg-black/50 px-3 py-1.5">
                  <p className="truncate text-xs text-white/80">{snapshot.title}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Controls sidebar */}
        {isRunning && (
          <div className="flex w-64 flex-col gap-4 overflow-y-auto border-l border-[#ddd8cf] bg-[#f6f5f2] p-4">
            {/* Input mode */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Input mode</p>
              <div className="flex rounded-lg border border-[#ddd8cf] bg-[#f0ede7] p-0.5">
                {(["click", "type", "command"] as InputMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setInputMode(mode)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                      inputMode === mode
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "click" && <MousePointer className="h-3 w-3" />}
                    {mode === "type" && <Keyboard className="h-3 w-3" />}
                    {mode === "command" && <Terminal className="h-3 w-3" />}
                    <span className="capitalize">{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type input */}
            {inputMode === "type" && (
              <form onSubmit={handleTypeSubmit} className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Type text</p>
                <textarea
                  value={typeText}
                  onChange={(e) => setTypeText(e.target.value)}
                  placeholder="Text to type into the desktop…"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#ddd8cf] bg-white px-3 py-2 text-xs outline-none focus:border-[#36322d]"
                />
                <button
                  type="submit"
                  disabled={!typeText.trim() || actionMutation.isPending}
                  className="rounded-lg bg-[#36322d] py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4a453e] disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            )}

            {/* Command input */}
            {inputMode === "command" && (
              <form onSubmit={handleCommandSubmit} className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Run command</p>
                <input
                  value={commandText}
                  onChange={(e) => setCommandText(e.target.value)}
                  placeholder="e.g. ls -la"
                  className="w-full rounded-lg border border-[#ddd8cf] bg-white px-3 py-2 font-mono text-xs outline-none focus:border-[#36322d]"
                />
                <button
                  type="submit"
                  disabled={!commandText.trim() || actionMutation.isPending}
                  className="rounded-lg bg-[#36322d] py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4a453e] disabled:opacity-50"
                >
                  Run
                </button>
              </form>
            )}

            {/* Keyboard shortcuts */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Keyboard</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: "Enter", keys: "Return" },
                  { label: "Escape", keys: "Escape" },
                  { label: "Tab", keys: "Tab" },
                  { label: "Backspace", keys: "BackSpace" },
                  { label: "↑", keys: "Up" },
                  { label: "↓", keys: "Down" },
                  { label: "←", keys: "Left" },
                  { label: "→", keys: "Right" },
                  { label: "Copy", keys: ["ctrl", "c"] },
                  { label: "Paste", keys: ["ctrl", "v"] },
                  { label: "Select all", keys: ["ctrl", "a"] },
                  { label: "Undo", keys: ["ctrl", "z"] },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleKeyPress(item.keys)}
                    disabled={actionMutation.isPending}
                    className="rounded-lg border border-[#ddd8cf] bg-white px-2 py-1.5 text-center text-xs text-muted-foreground transition-colors hover:border-[#36322d] hover:text-foreground disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch apps */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Launch app</p>
              <div className="flex flex-col gap-1">
                {[
                  { label: "Chrome", app: "google-chrome" },
                  { label: "Firefox", app: "firefox" },
                  { label: "Terminal", app: "xterm" },
                  { label: "Files", app: "nautilus" },
                ].map((item) => (
                  <button
                    key={item.app}
                    onClick={() => actionMutation.mutate({ kind: "launch", app: item.app })}
                    disabled={actionMutation.isPending}
                    className="rounded-lg border border-[#ddd8cf] bg-white px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-[#36322d] hover:text-foreground disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scroll */}
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Scroll</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => actionMutation.mutate({ kind: "scroll", amount: -3 })}
                  disabled={actionMutation.isPending}
                  className="rounded-lg border border-[#ddd8cf] bg-white px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[#36322d] hover:text-foreground disabled:opacity-50"
                >
                  Scroll up
                </button>
                <button
                  onClick={() => actionMutation.mutate({ kind: "scroll", amount: 3 })}
                  disabled={actionMutation.isPending}
                  className="rounded-lg border border-[#ddd8cf] bg-white px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[#36322d] hover:text-foreground disabled:opacity-50"
                >
                  Scroll down
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
