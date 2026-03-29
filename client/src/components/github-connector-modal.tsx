import { GithubBrandIcon } from "@/components/connectors-data";
import { Check, ChevronDown, ExternalLink, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
};

type GithubConnectorModalProps = {
  open: boolean;
  connected: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onConnected?: () => Promise<void>;
};

export function GithubConnectorModal({
  open,
  connected,
  onOpenChange,
  onConnect,
  onDisconnect,
  onConnected,
}: GithubConnectorModalProps) {
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [showTokenFallback, setShowTokenFallback] = useState(false);

  const selectedCount = useMemo(() => selectedRepos.length, [selectedRepos]);

  useEffect(() => {
    if (!open || !connected) return;

    let alive = true;
    const load = async () => {
      try {
        setLoadingRepos(true);
        const response = await fetch("/api/connectors/github/repos", { credentials: "include" });
        if (!response.ok) throw new Error("Failed to load GitHub repositories");
        const data = await response.json();
        if (!alive) return;
        setRepos(Array.isArray(data.repositories) ? data.repositories : []);
        setSelectedRepos(Array.isArray(data.selectedRepos) ? data.selectedRepos : []);
        setEnabled(data.enabled !== false);
      } catch {
        if (!alive) return;
        setRepos([]);
        setSelectedRepos([]);
      } finally {
        if (alive) setLoadingRepos(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, [connected, open]);

  useEffect(() => {
    if (!open) setDetailsOpen(false);
    if (!open) setShowTokenFallback(false);
  }, [open]);

  const connectWithToken = async () => {
    const token = tokenValue.trim();
    if (!token) return;
    try {
      setTokenLoading(true);
      const response = await fetch("/api/connectors/github/token", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to save GitHub token");
      }
      setTokenValue("");
      setShowTokenFallback(false);
      if (onConnected) {
        await onConnected();
      }
    } catch (error) {
      console.error("[GithubConnectorModal] token connect failed:", error);
      setShowTokenFallback(true);
      throw error;
    } finally {
      setTokenLoading(false);
    }
  };

  const persistState = async (nextSelectedRepos: string[], nextEnabled: boolean) => {
    setSelectedRepos(nextSelectedRepos);
    setEnabled(nextEnabled);
    await fetch("/api/connectors/github/state", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedRepos: nextSelectedRepos, enabled: nextEnabled }),
    });
  };

  const toggleRepo = async (repoFullName: string) => {
    const nextSelected = selectedRepos.includes(repoFullName)
      ? selectedRepos.filter((name) => name !== repoFullName)
      : [...selectedRepos, repoFullName];
    await persistState(nextSelected, enabled);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-[2px]">
      <div className="relative w-full max-w-[760px] overflow-hidden rounded-[28px] border border-[#e6e1d8] bg-[#fbfaf8] shadow-[0_30px_100px_rgba(0,0,0,0.24)]">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#8a847b] transition-colors hover:bg-[#f1ece4] hover:text-[#2f2b27]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-8 pb-6 pt-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#e6e1d8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <span className="text-[32px] text-[#222]">✌︎</span>
              </div>
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2ea043] text-white">
                <Check className="h-3 w-3" />
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#e6e1d8] bg-[#111111] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <GithubBrandIcon className="h-12 w-12" />
              </div>
            </div>

            <div className="mt-8 text-[24px] font-semibold tracking-[-0.03em] text-[#2f2b27]">GitHub</div>
            <p className="mt-3 max-w-[560px] text-[14px] leading-6 text-[#6d675f]">
              Access, search, and organize repos, track issues, review pull requests, and automate workflows directly in Forge.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (connected) {
                    setDetailsOpen(true);
                    return;
                  }
                  void onConnect().catch((error) => {
                    console.error("[GithubConnectorModal] OAuth connect failed:", error);
                    setShowTokenFallback(true);
                    toast.error(error instanceof Error ? error.message : "GitHub OAuth is not configured yet. Use a token to connect now.");
                  });
                }}
                className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-medium transition-colors ${
                  connected ? "border border-[#dcd6cc] bg-white text-[#3b3632] hover:bg-[#f5f2ed]" : "bg-[#111111] text-white hover:bg-[#1f1f1f]"
                }`}
              >
                {connected ? "Manage" : "Authorize GitHub"}
              </button>
              <button
                type="button"
                onClick={() => setDetailsOpen((open) => !open)}
                className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-[13px] font-medium transition-colors ${
                  connected ? "bg-[#111111] text-white hover:bg-[#1f1f1f]" : "border border-[#dcd6cc] bg-white text-[#3b3632] hover:bg-[#f5f2ed]"
                }`}
              >
                {connected ? "Add Repositories" : detailsOpen ? "Hide Details" : "Show Details"}
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {!connected ? (
              <button
                type="button"
                onClick={() => setShowTokenFallback((value) => !value)}
                className="mt-3 text-[12px] font-medium text-[#8a847b] transition-colors hover:text-[#3b3632]"
              >
                {showTokenFallback ? "Hide token option" : "Use a GitHub token instead"}
              </button>
            ) : null}

            {connected ? (
              <button
                type="button"
                onClick={() => void onDisconnect()}
                className="mt-3 text-[12px] font-medium text-[#8a847b] transition-colors hover:text-[#3b3632]"
              >
                Disconnect GitHub
              </button>
            ) : null}

            {showTokenFallback && !connected ? (
              <div className="mt-5 rounded-[22px] border border-[#e6e1d8] bg-white p-4 text-left">
                <div className="text-[13px] font-semibold text-[#2f2b27]">Connect with a GitHub token</div>
                <p className="mt-1 text-[12px] leading-6 text-[#7a746c]">
                  If OAuth is not configured yet, paste a personal access token and Forge will validate it before saving.
                </p>
                <div className="mt-3 flex flex-col gap-3 md:flex-row">
                  <input
                    value={tokenValue}
                    onChange={(event) => setTokenValue(event.target.value)}
                    placeholder="ghp_..."
                    type="password"
                    className="h-11 flex-1 rounded-full border border-[#e4dfd6] bg-[#fbfaf8] px-4 text-[14px] text-[#2f2b27] outline-none transition-colors placeholder:text-[#a09a91] focus:border-[#c9c2b8]"
                  />
                  <button
                    type="button"
                    onClick={() => void connectWithToken()}
                    disabled={tokenLoading}
                    className="inline-flex h-11 items-center justify-center rounded-full bg-[#f3f0ea] px-5 text-[13px] font-medium text-[#3b3632] transition-colors hover:bg-[#ebe7df] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {tokenLoading ? "Saving..." : "Connect token"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-3 text-[12px] text-[#8a847b]">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${enabled ? "bg-[#e9f6ec] text-[#2d7a44]" : "bg-[#f2efe9] text-[#7c756b]"}`}>
                {enabled ? <Check className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                {enabled ? "Authorize Account" : "Account paused"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${connected ? "bg-[#e9f6ec] text-[#2d7a44]" : "bg-[#f2efe9] text-[#7c756b]"}`}>
                {connected ? <Check className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                {connected ? "Authorize Repository" : "Repository access"}
              </span>
            </div>
          </div>

          {detailsOpen ? (
            <div className="mt-6 rounded-[22px] border border-[#e6e1d8] bg-white p-4">
              <div className="grid gap-3 text-[13px] text-[#5f5952] md:grid-cols-2">
                <DetailRow label="Connector Type" value="App" />
                <DetailRow label="Author" value="Forge" />
                <DetailRow label="Website" value="forge.local" action />
                <DetailRow label="Privacy Policy" value="View policy" action />
              </div>
            </div>
          ) : null}

          {connected ? (
            <div className="mt-6 rounded-[22px] border border-[#e6e1d8] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-[#2f2b27]">Authorize Repository</div>
                  <div className="text-[12px] text-[#7a746c]">
                    {loadingRepos ? "Loading repositories..." : `${selectedCount} selected`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void persistState(selectedRepos, !enabled)}
                  className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-medium transition-colors ${
                    enabled ? "bg-[#111111] text-white hover:bg-[#1f1f1f]" : "bg-[#f3f0ea] text-[#3b3632] hover:bg-[#ebe7df]"
                  }`}
                >
                  {enabled ? "Disable" : "Enable"}
                </button>
              </div>

              <div className="mt-4 max-h-[260px] overflow-y-auto rounded-[18px] border border-[#ece7de]">
                {loadingRepos ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-8 text-[13px] text-[#847e76]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading repositories...
                  </div>
                ) : repos.length > 0 ? (
                  repos.map((repo) => {
                    const checked = selectedRepos.includes(repo.full_name);
                    return (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => void toggleRepo(repo.full_name)}
                        className="flex w-full items-center justify-between gap-4 border-b border-[#f0ebe3] px-4 py-3 text-left last:border-b-0 hover:bg-[#fbfaf8]"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-[#2f2b27]">{repo.full_name}</div>
                          <div className="truncate text-[12px] text-[#7d766e]">{repo.description || "Repository access"}</div>
                        </div>
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border ${checked ? "border-[#2ea043] bg-[#e9f6ec] text-[#2ea043]" : "border-[#dcd6cc] bg-white text-[#b1aba2]"}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-8 text-center text-[13px] text-[#847e76]">No repositories found for this account.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, action = false }: { label: string; value: string; action?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0ebe3] pb-3 last:border-b-0 last:pb-0">
      <div className="text-[#817a72]">{label}</div>
      <div className={`inline-flex items-center gap-1 ${action ? "text-[#2f6feb]" : "text-[#2f2b27]"}`}>
        <span>{value}</span>
        {action ? <ExternalLink className="h-3.5 w-3.5" /> : null}
      </div>
    </div>
  );
}
