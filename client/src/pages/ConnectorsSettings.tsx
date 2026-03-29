import { trpc } from "@/lib/trpc";
import { startConnectorAuth } from "@/lib/connector-auth";
import { appDefinitions, type AppDefinition } from "@/components/connectors-data";
import { Check, ChevronRight, Github, Plug, RefreshCw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const connectorCopy: Record<string, { title: string; subtitle: string; bullets: string[] }> = {
  github: {
    title: "GitHub",
    subtitle: "Read repositories, cite code, and surface project context into Forge tasks.",
    bullets: ["List repositories", "Search repo files", "Read code and docs"],
  },
  gmail: {
    title: "Gmail",
    subtitle: "Search inbox threads, draft replies, and use email context inside tasks.",
    bullets: ["Read threads", "Draft replies", "Summarize messages"],
  },
  google_drive: {
    title: "Google Drive",
    subtitle: "Search, read, and attach docs, PDFs, and files to Forge tasks.",
    bullets: ["Browse files", "Read docs", "Attach file context"],
  },
};

function ConnectorBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        connected ? "bg-[#e8f6eb] text-[#2d7a44]" : "bg-[#f2efe9] text-[#7c756b]"
      }`}
    >
      {connected ? <Check className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
      {connected ? "Connected" : "Needs approval"}
    </span>
  );
}

function ConnectorCard({
  app,
  connected,
  onToggle,
}: {
  app: AppDefinition;
  connected: boolean;
  onToggle: () => void;
}) {
  const copy = connectorCopy[app.type] ?? connectorCopy.github;
  return (
    <div className="rounded-[24px] border border-[#e7e1d7] bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.03)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-[#e7e1d7] bg-[#faf9f6]">
            <app.icon className="h-7 w-7" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-[#322f2a]">{copy.title}</h3>
              <ConnectorBadge connected={connected} />
            </div>
            <p className="max-w-[46rem] text-[13px] leading-6 text-[#746e66]">{copy.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors ${
            connected
              ? "bg-[#f3f0ea] text-[#3b3632] hover:bg-[#ebe7df]"
              : "bg-[#111111] text-white hover:bg-[#1f1f1f]"
          }`}
        >
          {connected ? <RefreshCw className="h-4 w-4" /> : null}
          {connected ? "Disconnect" : `Authorize ${copy.title}`}
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
        <div className="grid gap-2 md:grid-cols-3">
          {copy.bullets.map((bullet) => (
            <div key={bullet} className="rounded-[16px] border border-[#ece7de] bg-[#fbfaf8] px-3 py-2 text-[12px] text-[#665f58]">
              {bullet}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-[16px] border border-[#ece7de] bg-[#fbfaf8] px-3 py-2 text-[12px] text-[#665f58]">
          <Plug className="h-4 w-4" />
          <span>Forge only sees data after you approve access.</span>
        </div>
      </div>
    </div>
  );
}

export default function ConnectorsSettings() {
  const { data: connectors, refetch } = trpc.connectors.list.useQuery();
  const [githubToken, setGithubToken] = useState("");
  const [githubTokenLoading, setGithubTokenLoading] = useState(false);

  const connectorsByType = useMemo(() => {
    const map = new Map<string, any>();
    (connectors || []).forEach((connector: any) => {
      if (!map.has(connector.type)) map.set(connector.type, connector);
    });
    return map;
  }, [connectors]);

  const connectGithubToken = async () => {
    const token = githubToken.trim();
    if (!token) {
      toast.error("Paste a GitHub token first");
      return;
    }

    try {
      setGithubTokenLoading(true);
      const response = await fetch("/api/connectors/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to save GitHub token");
      }

      await refetch();
      setGithubToken("");
      toast.success("GitHub token connected");
    } catch (error) {
      console.error("[ConnectorsSettings] GitHub token failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to connect GitHub token");
    } finally {
      setGithubTokenLoading(false);
    }
  };

  const handleToggle = async (app: AppDefinition) => {
    const connected = connectorsByType.has(app.type);

    if (connected) {
      const response = await fetch("/api/connectors/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ service: app.type }),
      });
      if (!response.ok) {
        toast.error(`Failed to disconnect ${app.title}`);
        return;
      }
      await refetch();
      toast.success(`${app.title} disconnected`);
      return;
    }

    try {
      const authEndpoint =
        app.type === "github"
          ? "/api/connectors/github/auth"
          : `/api/connectors/google/auth?service=${app.type === "google_drive" ? "drive" : "gmail"}`;

      const response = await fetch(authEndpoint, { credentials: "include" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || `Failed to start ${app.title} auth`);
      }

      const data = await response.json();
      await startConnectorAuth(data.authUrl, app.key);
      await refetch();
      toast.success(`${app.title} connected`);
    } catch (error) {
      console.error("[ConnectorsSettings] Connection failed:", error);
      toast.error(`Failed to connect ${app.title}`);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-[28px] border border-[#e7e1d7] bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ece7de] bg-[#fbfaf8] px-3 py-1.5 text-[12px] font-medium text-[#6a645d]">
              <Github className="h-3.5 w-3.5" />
              GitHub access for Forge
            </div>
            <div className="space-y-2">
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[#2f2b27]">Connect your accounts</h2>
              <p className="max-w-2xl text-[14px] leading-6 text-[#756f67]">
                Sign in once, approve access, or paste a token, and Forge can read your GitHub repos, Gmail threads, and Drive files inside tasks.
              </p>
            </div>
          </div>
          <div className="grid gap-2 text-[12px] text-[#6f685f] md:max-w-[290px]">
            <div className="rounded-[16px] border border-[#ece7de] bg-[#fbfaf8] px-4 py-3">1. Open GitHub connector</div>
            <div className="rounded-[16px] border border-[#ece7de] bg-[#fbfaf8] px-4 py-3">2. Sign in and approve repo access, or paste a token</div>
            <div className="rounded-[16px] border border-[#ece7de] bg-[#fbfaf8] px-4 py-3">3. Start asking Forge about your code</div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#e7e1d7] bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#8a837a]">GitHub token</div>
            <div className="space-y-1">
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#2f2b27]">Add your own GitHub access</h3>
              <p className="max-w-2xl text-[13px] leading-6 text-[#756f67]">
                Paste a GitHub personal access token if you want Forge to access your repos immediately without the OAuth popup.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleToggle(appDefinitions[0])}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#111111] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1f1f1f]"
          >
            <Github className="h-4 w-4" />
            {connectorsByType.has("github") ? "Disconnect GitHub" : "Authorize GitHub"}
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <input
            type="password"
            value={githubToken}
            onChange={(event) => setGithubToken(event.target.value)}
            placeholder="ghp_..."
            className="h-11 flex-1 rounded-full border border-[#e4dfd6] bg-[#fbfaf8] px-4 text-[14px] text-[#2f2b27] outline-none transition-colors placeholder:text-[#a09a91] focus:border-[#c9c2b8]"
          />
          <button
            type="button"
            onClick={() => void connectGithubToken()}
            disabled={githubTokenLoading}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#f3f0ea] px-5 text-[13px] font-medium text-[#3b3632] transition-colors hover:bg-[#ebe7df] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {githubTokenLoading ? "Saving..." : "Connect token"}
          </button>
        </div>

        <div className="mt-3 text-[12px] leading-6 text-[#7a746c]">
          Recommended scopes: <span className="font-medium text-[#4a443e]">repo, read:user, read:org</span>
        </div>
      </div>

      <div className="grid gap-4">
        {appDefinitions.map((app) => (
          <ConnectorCard key={app.key} app={app} connected={connectorsByType.has(app.type)} onToggle={() => void handleToggle(app)} />
        ))}
      </div>

      <div className="rounded-[24px] border border-[#e7e1d7] bg-[#fbfaf8] p-5 text-[13px] leading-6 text-[#6f685f]">
        <div className="font-semibold text-[#322f2a]">What Forge can do once connected</div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <div className="rounded-[16px] border border-[#ece7de] bg-white px-4 py-3">Read the files and threads you approved.</div>
          <div className="rounded-[16px] border border-[#ece7de] bg-white px-4 py-3">Use connector context inside chats and tasks.</div>
          <div className="rounded-[16px] border border-[#ece7de] bg-white px-4 py-3">Disconnect anytime and revoke access instantly.</div>
        </div>
      </div>
    </div>
  );
}
