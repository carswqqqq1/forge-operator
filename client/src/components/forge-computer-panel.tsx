import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Monitor, RotateCw, Square, Sparkles } from "lucide-react";

export interface ForgeComputerSnapshot {
  mode: "e2b" | "none";
  connected: boolean;
  status: "offline" | "starting" | "running" | "error";
  title: string;
  url: string;
  streamUrl: string | null;
  screenshot: string | null;
  lastUpdated: string;
  error?: string | null;
}

interface ForgeComputerPanelProps {
  snapshot?: ForgeComputerSnapshot | null;
  onLaunch?: () => void;
  onRefresh?: () => void;
  onClose?: () => void;
  launching?: boolean;
  closing?: boolean;
}

const statusLabels: Record<ForgeComputerSnapshot["status"], string> = {
  offline: "Offline",
  starting: "Launching",
  running: "Live",
  error: "Error",
};

export function ForgeComputerPanel({
  snapshot,
  onLaunch,
  onRefresh,
  onClose,
  launching,
  closing,
}: ForgeComputerPanelProps) {
  const hasSnapshot = !!snapshot?.connected && !!snapshot?.screenshot;
  const streamUrl = snapshot?.streamUrl || "";

  return (
    <div className="overflow-hidden rounded-[30px] border border-[#e0ddd6] bg-[#efeeea] p-4 shadow-[0_8px_24px_rgba(42,37,30,0.03)] md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em] text-[#8a847c]">
            <Monitor className="h-3.5 w-3.5" />
            Forge&apos;s computer
          </div>
          <h3 className="mt-2 text-[22px] font-semibold leading-[1.1] tracking-[-0.04em] text-[#2f2b27] md:text-[24px]">
            {snapshot?.title || "Live virtual desktop"}
          </h3>
          <p className="mt-2 max-w-[520px] text-[14px] leading-6 text-[#6f6962]">
            A visible computer panel for browser work, file work, and step-by-step execution. The model can use this as the source of truth while it works.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "rounded-full px-3 py-1 text-[12px] font-medium",
            snapshot?.status === "running" ? "bg-[#dff4e7] text-[#24774a]" :
            snapshot?.status === "starting" ? "bg-[#f5edd6] text-[#8a6420]" :
            snapshot?.status === "error" ? "bg-[#f9dfdf] text-[#a43a3a]" :
            "bg-[#ece8e0] text-[#756f69]"
          )}>
            {statusLabels[snapshot?.status || "offline"]}
          </span>
          {streamUrl ? (
            <a
              href={streamUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-[#d7d2ca] bg-white px-3 py-1 text-[12px] font-medium text-[#3b3632] transition-colors hover:bg-[#f7f5f1]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open stream
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-[22px] border border-[#e3ddd4] bg-white shadow-[0_8px_24px_rgba(42,37,30,0.05)]">
          {hasSnapshot ? (
            <img
              src={snapshot?.screenshot || undefined}
              alt="Forge computer screenshot"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-[#fcfbf9] to-[#f1eee7] px-6 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#e3ddd4] bg-white text-[#6f6962] shadow-sm">
                  <Sparkles className="h-6 w-6" />
                </div>
                <p className="mt-4 text-[15px] font-medium text-[#2f2b27]">
                  {snapshot?.connected ? "Computer connected" : "No computer launched yet"}
                </p>
                <p className="mt-1 text-[13px] leading-6 text-[#7b756d]">
                  {snapshot?.error || "Launch a live desktop to show the model what it can see."}
                </p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <Button type="button" onClick={onLaunch} disabled={launching} className="h-10 rounded-full bg-[#121212] px-4 text-white hover:bg-[#1d1d1d]">
                    {launching ? "Launching..." : "Launch computer"}
                  </Button>
                  <Button type="button" variant="outline" onClick={onRefresh} className="h-10 rounded-full border-[#d7d2ca] bg-white px-4 text-[#3b3632] hover:bg-[#f7f5f1]">
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-[22px] border border-[#e3ddd4] bg-[#fbfaf8] p-4">
          <div>
            <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#8a847c]">Execution</div>
            <div className="mt-2 space-y-2 text-[14px] leading-6 text-[#2f2b27]">
              <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.04)]">
                <span>Visible state</span>
                <span className="text-[#7b756d]">{snapshot?.status || "offline"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.04)]">
                <span>Stream</span>
                <span className="truncate text-[#7b756d]">{streamUrl ? "Ready" : "Not ready"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.04)]">
                <span>Last update</span>
                <span className="text-[#7b756d]">{snapshot?.lastUpdated ? new Date(snapshot.lastUpdated).toLocaleTimeString() : "—"}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto grid gap-2 sm:grid-cols-2">
            <Button type="button" onClick={onRefresh} variant="outline" className="h-10 rounded-full border-[#d7d2ca] bg-white px-4 text-[#3b3632] hover:bg-[#f7f5f1]">
              <RotateCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-10 rounded-full border-[#d7d2ca] bg-white px-4 text-[#3b3632] hover:bg-[#f7f5f1]">
              <Square className="h-4 w-4" />
              {closing ? "Closing..." : "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

