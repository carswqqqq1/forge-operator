import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Chrome,
  CreditCard,
  Database,
  Github,
  Globe,
  HardDrive,
  Infinity,
  Instagram,
  KeyRound,
  Mail,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Triangle,
  X,
  AudioLines,
  Bot,
  PlugZap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Screen = "main" | "add" | "manage";
type Tab = "apps" | "api" | "mcp";

type AppDefinition = {
  key: string;
  title: string;
  type: string;
  description: string;
  mode: "toggle" | "connect";
  beta?: boolean;
  iconBg: string;
  icon: any;
  config?: Record<string, unknown>;
};

type ApiDefinition = {
  key: string;
  title: string;
  description: string;
  icon: any;
};

const appDefinitions: AppDefinition[] = [
  {
    key: "browser",
    title: "My Browser",
    type: "browser",
    description: "Access the web on your own browser",
    mode: "toggle",
    iconBg: "bg-white",
    icon: Chrome,
    config: { mode: "browser-control" },
  },
  {
    key: "gmail",
    title: "Gmail",
    type: "gmail",
    description: "Draft replies, search your inbox, and summarize email threads instantly",
    mode: "toggle",
    iconBg: "bg-white",
    icon: Mail,
    config: { scopes: ["gmail.readonly", "gmail.send"] },
  },
  {
    key: "google-calendar",
    title: "Google Calendar",
    type: "google-calendar",
    description: "Understand your schedule, manage events, and optimize your time effectively",
    mode: "toggle",
    iconBg: "bg-white",
    icon: CalendarDays,
    config: { scopes: ["calendar.readonly"] },
  },
  {
    key: "google-drive",
    title: "Google Drive",
    type: "google-drive",
    description: "Access your files, search instantly, and let Manus help you manage documents",
    mode: "toggle",
    iconBg: "bg-white",
    icon: HardDrive,
    config: { scopes: ["drive.readonly"] },
  },
  {
    key: "github",
    title: "GitHub",
    type: "github",
    description: "Manage repositories, track code changes, and collaborate on team projects",
    mode: "toggle",
    iconBg: "bg-white",
    icon: Github,
    config: { scopes: ["repo", "issues:read", "pull_requests:read"] },
  },
  {
    key: "instagram",
    title: "Instagram",
    type: "instagram",
    description: "Generate and publish Posts, Stories, or Reels to Instagram.",
    mode: "toggle",
    beta: true,
    iconBg: "bg-white",
    icon: Instagram,
    config: { beta: true, channel: "instagram" },
  },
  {
    key: "vercel",
    title: "Vercel",
    type: "vercel",
    description: "Manage Vercel projects, deployments, and domains",
    mode: "toggle",
    iconBg: "bg-white",
    icon: Triangle,
    config: { surface: "deployments" },
  },
  {
    key: "stripe",
    title: "Stripe",
    type: "stripe",
    description: "Streamline business billing, payments, and account management",
    mode: "toggle",
    iconBg: "bg-white",
    icon: CreditCard,
    config: { mode: "billing" },
  },
  {
    key: "outlook-mail",
    title: "Outlook Mail",
    type: "outlook-mail",
    description: "Write, search, and manage your Outlook emails seamlessly within Manus",
    mode: "connect",
    iconBg: "bg-white",
    icon: Mail,
    config: { provider: "outlook-mail" },
  },
  {
    key: "outlook-calendar",
    title: "Outlook Calendar",
    type: "outlook-calendar",
    description: "Schedule, view, and manage your Outlook events just with a prompt",
    mode: "connect",
    iconBg: "bg-white",
    icon: CalendarDays,
    config: { provider: "outlook-calendar" },
  },
  {
    key: "instagram-creator-marketplace",
    title: "Instagram Creator Marketplace",
    type: "instagram-creator-marketplace",
    description: "Discover creators that fit your brand’s reach, topics, and style.",
    mode: "connect",
    beta: true,
    iconBg: "bg-white",
    icon: Instagram,
    config: { provider: "instagram-creator-marketplace" },
  },
  {
    key: "meta-ads-manager",
    title: "Meta Ads Manager",
    type: "meta-ads-manager",
    description: "Manage campaigns, ads, and account performance with Meta tools.",
    mode: "connect",
    beta: true,
    iconBg: "bg-white",
    icon: Infinity,
    config: { provider: "meta-ads-manager" },
  },
];

const customApis: ApiDefinition[] = [
  { key: "openai", title: "OpenAI", description: "Leverage GPT model series for intelligent text generation and processing", icon: Sparkles },
  { key: "anthropic", title: "Anthropic", description: "Access reliable AI assistant services with safe and intelligent conversations", icon: Bot },
  { key: "gemini", title: "Google Gemini", description: "Process multimodal content including text, images, and code seamlessly", icon: Sparkles },
  { key: "perplexity", title: "Perplexity", description: "Search real-time information and get accurate answers with reliable citations", icon: Search },
  { key: "cohere", title: "Cohere", description: "Build enterprise AI applications and optimize text processing workflows", icon: Database },
  { key: "elevenlabs", title: "ElevenLabs", description: "Generate realistic voices, clone speech, and create custom audio content", icon: AudioLines },
  { key: "grok", title: "Grok", description: "Access real-time information and engage in intelligent conversations", icon: Bot },
  { key: "openrouter", title: "OpenRouter", description: "Access multiple AI models and manage API routing from one place", icon: Globe },
];

function PillToggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-8 w-[68px] rounded-full transition-colors ${checked ? "bg-[#0a84ff]" : "bg-[#e5e5ea]"}`}
    >
      <span
        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-all ${checked ? "left-[38px]" : "left-1"}`}
      />
    </button>
  );
}

function BetaBadge() {
  return (
    <span className="rounded-full border border-[#d6d3ce] px-2 py-0.5 text-[12px] font-medium text-[#8b857d]">
      Beta
    </span>
  );
}

function AppIconTile({ icon: Icon, iconBg }: { icon: any; iconBg: string }) {
  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e4e0d9] ${iconBg}`}>
      <Icon className="h-6 w-6 text-[#2f2b27]" />
    </div>
  );
}

export default function Connectors() {
  const [, setLocation] = useLocation();
  const { data: connectors, refetch } = trpc.connectors.list.useQuery();
  const createConnector = trpc.connectors.create.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  const deleteConnector = trpc.connectors.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [screen, setScreen] = useState<Screen>("main");
  const [tab, setTab] = useState<Tab>("apps");
  const [isMobileView, setIsMobileView] = useState<boolean>(typeof window !== "undefined" ? window.innerWidth < 768 : true);

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const connectorsByType = useMemo(() => {
    const map = new Map<string, (typeof connectors extends Array<infer T> ? T : any)>();
    (connectors || []).forEach((connector: any) => {
      if (!map.has(connector.type)) map.set(connector.type, connector);
    });
    return map;
  }, [connectors]);

  const isConnected = (type: string) => connectorsByType.has(type);

  const ensureConnected = (app: AppDefinition) => {
    if (isConnected(app.type)) {
      toast.message(`${app.title} is already connected`);
      return;
    }
    createConnector.mutate({
      name: app.title,
      type: app.type,
      config: JSON.stringify(app.config || {}, null, 2),
    });
    toast.success(`${app.title} connected`);
  };

  const toggleApp = (app: AppDefinition) => {
    const existing = connectorsByType.get(app.type) as any;
    if (existing) {
      deleteConnector.mutate({ id: existing.id });
      toast.success(`${app.title} disconnected`);
      return;
    }
    createConnector.mutate({
      name: app.title,
      type: app.type,
      config: JSON.stringify(app.config || {}, null, 2),
    });
    toast.success(`${app.title} connected`);
  };

  const closeOverlay = () => setLocation("/");

  const MainSheet = (
    <div className="rounded-t-[28px] bg-[#f7f6f3] px-4 pb-6 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:rounded-[28px] md:px-6 md:pt-5">
      <div className="mx-auto mb-4 h-1.5 w-[68px] rounded-full bg-[#d4d2cd] md:hidden" />
      <div className="mb-4 text-[18px] font-semibold text-[#403b36]">Connectors</div>

      <div className="rounded-[24px] bg-[#f3f2ef] p-0">
        <ScrollArea className="max-h-[460px] rounded-[24px]">
          <div className="space-y-0 px-4 py-3">
            {appDefinitions.filter((app) => ["browser","gmail","google-calendar","google-drive","github","instagram","vercel","stripe","outlook-mail","outlook-calendar","instagram-creator-marketplace","meta-ads-manager"].includes(app.key)).map((app) => {
              const connected = isConnected(app.type);
              return (
                <div key={app.key} className="border-b border-[#e3dfd8] last:border-b-0">
                  <div className="flex items-center justify-between gap-4 py-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <AppIconTile icon={app.icon} iconBg={app.iconBg} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[18px] font-medium text-[#3b3632]">
                          <span className="truncate">{app.title}</span>
                          {app.beta ? <BetaBadge /> : null}
                        </div>
                      </div>
                    </div>
                    {app.mode === "toggle" ? (
                      <PillToggle checked={connected} onClick={() => toggleApp(app)} />
                    ) : connected ? (
                      <button type="button" className="text-[18px] font-medium text-[#8d867e]" onClick={() => setScreen("manage")}>Manage</button>
                    ) : (
                      <button type="button" className="text-[18px] font-medium text-[#8d867e]" onClick={() => ensureConnected(app)}>Connect</button>
                    )}
                  </div>
                  {app.key === "github" && connected ? (
                    <button
                      type="button"
                      onClick={() => setScreen("manage")}
                      className="mb-4 ml-16 flex w-[calc(100%-4rem)] items-center justify-between rounded-[16px] px-4 py-3 text-left text-[18px] text-[#66615a] hover:bg-[#ece9e3]"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-5 w-5 rotate-180 text-[#8a847c]" />
                        <span>Repositories</span>
                      </div>
                      <ChevronRight className="h-6 w-6 text-[#8a847c]" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] bg-[#f3f2ef]">
        <button
          type="button"
          onClick={() => {
            setScreen("add");
            setTab("apps");
          }}
          className="flex w-full items-center justify-between px-5 py-5 text-left text-[18px] font-medium text-[#3b3632]"
        >
          <div className="flex items-center gap-4">
            <Plus className="h-6 w-6 text-[#3b3632]" />
            <span>Add connectors</span>
          </div>
          <ChevronRight className="h-6 w-6 text-[#8a847c]" />
        </button>
        <div className="h-px bg-[#e3dfd8]" />
        <button
          type="button"
          onClick={() => setScreen("manage")}
          className="flex w-full items-center justify-between px-5 py-5 text-left text-[18px] font-medium text-[#3b3632]"
        >
          <div className="flex items-center gap-4">
            <SlidersHorizontal className="h-6 w-6 text-[#3b3632]" />
            <span>Manage connectors</span>
          </div>
          <ChevronRight className="h-6 w-6 text-[#8a847c]" />
        </button>
      </div>
    </div>
  );

  const AddAppsView = (
    <ScrollArea className="max-h-[70vh] pr-1">
      <div className="space-y-4 pb-3">
        {appDefinitions.filter((app) => app.key !== "meta-ads-manager").map((app) => {
          const connected = isConnected(app.type);
          return (
            <button
              key={app.key}
              type="button"
              onClick={() => !connected && ensureConnected(app)}
              className="flex w-full items-start gap-4 rounded-[26px] bg-[#f4f3f0] px-4 py-5 text-left shadow-none transition-colors hover:bg-[#efede8]"
            >
              <AppIconTile icon={app.icon} iconBg={app.iconBg} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[18px] font-semibold leading-6 text-[#2f2b27]">
                  <span>{app.title}</span>
                  {app.beta ? <BetaBadge /> : null}
                </div>
                <div className="mt-1 text-[15px] leading-7 text-[#7a746c]">
                  {app.description}
                </div>
              </div>
              <div className="pt-2 text-[#5cb95c]">
                {connected ? <Check className="h-7 w-7" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );

  const AddApiView = (
    <ScrollArea className="max-h-[70vh] pr-1">
      <div className="space-y-4 pb-3">
        <div className="flex items-start gap-3 rounded-[20px] bg-[#efeeeb] px-4 py-4 text-[16px] leading-7 text-[#69635c]">
          <KeyRound className="mt-1 h-5 w-5 shrink-0 text-[#7b756e]" />
          <span>Connect Manus to any third-party service using your own API keys.</span>
        </div>
        {customApis.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => toast.message(`${item.title} custom API UI added`) }
            className="flex w-full items-start gap-4 rounded-[26px] bg-[#f4f3f0] px-4 py-5 text-left transition-colors hover:bg-[#efede8]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#e4e0d9] bg-white">
              <item.icon className="h-6 w-6 text-[#2f2b27]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-semibold leading-6 text-[#2f2b27]">{item.title}</div>
              <div className="mt-1 text-[15px] leading-7 text-[#7a746c]">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );

  const AddMcpView = (
    <div className="flex min-h-[56vh] flex-col items-center justify-center px-4 text-center">
      <PlugZap className="h-10 w-10 text-[#9a948d]" />
      <div className="mt-6 text-[18px] font-semibold text-[#6a645d]">Not supported on mobile</div>
      <div className="mt-2 max-w-[260px] text-[15px] leading-7 text-[#9a948d]">
        Add a custom MCP on the desktop version.
      </div>
    </div>
  );

  const AddSheet = (
    <div className="rounded-t-[28px] bg-[#f7f6f3] px-4 pb-4 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:rounded-[28px] md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setScreen("main")} className="flex h-11 w-11 items-center justify-center rounded-full text-[#3b3632] hover:bg-[#efede8]">
          <X className="h-7 w-7" />
        </button>
        <div className="text-[18px] font-semibold text-[#3b3632]">Add connectors</div>
        <div className="h-11 w-11" />
      </div>

      <div className="mb-5 flex gap-3">
        {[
          { key: "apps", label: "Apps" },
          { key: "api", label: "Custom API" },
          { key: "mcp", label: "Custom MCP" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as Tab)}
            className={`rounded-full border px-6 py-3 text-[18px] font-semibold transition-colors ${tab === item.key ? "border-black bg-black text-white" : "border-[#ddd8cf] bg-transparent text-[#99938b]"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "apps" ? AddAppsView : null}
      {tab === "api" ? AddApiView : null}
      {tab === "mcp" ? AddMcpView : null}
    </div>
  );

  const ManageSheet = (
    <div className="rounded-t-[28px] bg-[#f7f6f3] px-4 pb-4 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:rounded-[28px] md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setScreen("main")} className="flex h-11 w-11 items-center justify-center rounded-full text-[#3b3632] hover:bg-[#efede8]">
          <X className="h-7 w-7" />
        </button>
        <div className="text-[18px] font-semibold text-[#3b3632]">Connectors</div>
        <button type="button" onClick={() => { setScreen("add"); setTab("apps"); }} className="flex h-11 w-11 items-center justify-center rounded-full text-[#3b3632] hover:bg-[#efede8]">
          <Plus className="h-7 w-7" />
        </button>
      </div>

      <ScrollArea className="max-h-[72vh] pr-1">
        <div className="space-y-4 pb-4">
          {appDefinitions.filter((app) => ["browser","gmail","google-calendar","google-drive","github","instagram","vercel","stripe"].includes(app.key)).map((app) => (
            <button
              key={app.key}
              type="button"
              onClick={() => app.mode === "toggle" ? toggleApp(app) : ensureConnected(app)}
              className="flex w-full items-start gap-4 rounded-[26px] bg-[#f4f3f0] px-4 py-5 text-left transition-colors hover:bg-[#efede8]"
            >
              <AppIconTile icon={app.icon} iconBg={app.iconBg} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[18px] font-semibold leading-6 text-[#2f2b27]">
                  <span>{app.title}</span>
                  {app.beta ? <BetaBadge /> : null}
                </div>
                <div className="mt-1 text-[15px] leading-7 text-[#7a746c]">{app.description}</div>
              </div>
              <ChevronRight className="mt-3 h-6 w-6 shrink-0 text-[#8a847c]" />
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[1px]" onClick={closeOverlay}>
      <div className="flex h-full items-end justify-center px-0 pb-0 md:items-center md:px-6 md:pb-6">
        <div className="w-full max-w-[860px]" onClick={(e) => e.stopPropagation()}>
          {screen === "main" ? MainSheet : null}
          {screen === "add" ? AddSheet : null}
          {screen === "manage" ? ManageSheet : null}
        </div>
      </div>
    </div>
  );
}
