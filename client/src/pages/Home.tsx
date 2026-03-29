import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { startConnectorAuth } from "@/lib/connector-auth";
import { GithubBrandIcon, GmailBrandIcon, GoogleDriveBrandIcon } from "@/components/connectors-data";
import {
  Send,
  Sparkles,
  User,
  Terminal,
  ChevronDown,
  ChevronRight,
  Plus,
  Monitor,
  Palette,
  Mic,
  Presentation,
  LaptopMinimal,
  AudioLines,
  StopCircle,
  Loader2,
  Search,
  FileText,
  BarChart3,
  Gem,
  Link2,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";

interface StreamingState {
  active: boolean;
  content: string;
  tokenCount: number;
  startTime: number;
  toolCalls: Array<{ name: string; args: string; result?: string }>;
}

const pendingPromptKey = (conversationId: number) => `forge-pending-prompt:${conversationId}`;
const tierModelMap = {
  lite: "meta/llama-3.1-8b-instruct",
  core: "meta/llama-3.1-70b-instruct",
  max: "deepseek-ai/deepseek-v3.1",
} as const;

const heroSlides = [
  { title: "Download Forge for Windows or macOS", description: "Access local files and work seamlessly with your desktop.", kind: "desktop" },
  { title: "Customize your AI agent for your business", description: "Connect channels and shape workflows around your team.", kind: "business" },
  { title: "Create skills", description: "Package repeatable flows into reusable skills.", kind: "skills" },
  { title: "Personalize your Forge", description: "Tune preferences, memory, and behavior.", kind: "personalize" },
] as const;

function HeroArtwork({ kind }: { kind: (typeof heroSlides)[number]["kind"] }) {
  if (kind === "desktop") {
    return (
      <div className="relative flex h-[138px] w-[194px] items-center justify-center overflow-hidden rounded-[22px] border border-[#dfdbd2] bg-white shadow-[0_6px_20px_rgba(42,37,30,0.05)]">
        <div className="absolute left-4 top-4 flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="w-[124px] rounded-[16px] border border-[#e9e5de] bg-[#fbfaf8] p-3 shadow-[0_4px_10px_rgba(42,37,30,0.04)]">
          <div className="font-serif text-[12px] leading-4 tracking-[-0.03em] text-[#2f2b27]">What can I do for you?</div>
          <div className="mt-3 rounded-[12px] border border-[#ece8e0] bg-white px-3 py-3">
            <div className="h-2.5 w-14 rounded-full bg-[#ebe7df]" />
            <div className="mt-2 h-2.5 w-10 rounded-full bg-[#f0ece5]" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "business") {
    return (
      <div className="relative flex h-[138px] w-[194px] items-center justify-center">
        <div className="absolute right-8 top-4 h-3 w-3 rounded-full bg-[#4ccf62]" />
        <div className="absolute right-1 top-12 h-4 w-4 rounded-full bg-[#31c47d]" />
        <div className="absolute left-6 top-10 h-4 w-4 rounded-full bg-[#3da6f3]" />
        <div className="absolute right-0 top-2 h-4 w-4 rounded-full bg-[#2d7ff0]" />
        <div className="absolute left-0 top-0 h-4 w-4 rounded-full bg-[#36c978]" />
        <div className="relative flex h-[126px] w-[92px] items-end justify-center rounded-[22px] border border-[#dad6cf] bg-white shadow-[0_6px_20px_rgba(42,37,30,0.05)]">
          <div className="absolute top-6 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full bg-[#ebe7df]" />
          <div className="absolute top-12 left-1/2 h-2.5 w-10 -translate-x-1/2 rounded-full bg-[#f0ece5]" />
          <div className="absolute bottom-7 left-1/2 w-[118px] -translate-x-1/2 rounded-[14px] border border-[#e8e4dc] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.06)]">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1efea]"><Sparkles className="h-3 w-3 text-[#6b655f]" /></div>
              <div className="h-2.5 flex-1 rounded-full bg-[#ebe7df]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "skills") {
    return (
      <div className="relative flex h-[138px] w-[194px] items-center justify-center">
        <div className="space-y-3">
          <div className="ml-8 flex w-[120px] items-center gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.05)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#57ce63]"><Search className="h-4 w-4 text-white" /></div>
            <div className="space-y-1.5"><div className="h-2.5 w-14 rounded-full bg-[#ece7e0]" /><div className="h-2 w-10 rounded-full bg-[#f1eee8]" /></div>
          </div>
          <div className="flex w-[128px] items-center gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.05)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e8cf4]"><FileText className="h-4 w-4 text-white" /></div>
            <div className="space-y-1.5"><div className="h-2.5 w-16 rounded-full bg-[#ece7e0]" /><div className="h-2 w-12 rounded-full bg-[#f1eee8]" /></div>
          </div>
          <div className="ml-10 flex w-[122px] items-center gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.05)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2b324]"><BarChart3 className="h-4 w-4 text-white" /></div>
            <div className="space-y-1.5"><div className="h-2.5 w-14 rounded-full bg-[#ece7e0]" /><div className="h-2 w-10 rounded-full bg-[#f1eee8]" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[138px] w-[194px] items-center justify-center">
      <div className="relative flex h-[130px] w-[156px] flex-col gap-3 rounded-[20px] border border-[#dad6cf] bg-white px-5 py-4 shadow-[0_6px_20px_rgba(42,37,30,0.05)]">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#f2efe9]"><Palette className="h-4 w-4 text-[#6d675f]" /></div>
          <div className="space-y-1.5"><div className="h-2.5 w-14 rounded-full bg-[#ece7e0]" /><div className="h-2 w-12 rounded-full bg-[#f1eee8]" /></div>
        </div>
        <div className="space-y-2"><div className="h-2.5 rounded-full bg-[#ece7e0]" /><div className="h-2.5 w-[88%] rounded-full bg-[#f1eee8]" /><div className="h-2.5 w-[76%] rounded-full bg-[#ece7e0]" /></div>
        <div className="mt-auto overflow-hidden rounded-[12px] bg-[#f4f0ea]"><div className="h-10 bg-gradient-to-r from-[#c9d9f1] via-[#e7e0d5] to-[#f2c9b7]" /></div>
      </div>
    </div>
  );
}

export default function Home({ conversationId }: { conversationId?: string }) {
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("meta/llama-3.1-70b-instruct");
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [promoVisible, setPromoVisible] = useState(true);
  const [streaming, setStreaming] = useState<StreamingState>({ active: false, content: "", tokenCount: 0, startTime: 0, toolCalls: [] });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingPromptHandledRef = useRef<number | null>(null);

  const convId = conversationId ? parseInt(conversationId) : null;
  const { data: conversation } = trpc.conversations.get.useQuery({ id: convId! }, { enabled: !!convId });
  const { data: messageList, refetch: refetchMessages } = trpc.messages.list.useQuery({ conversationId: convId! }, { enabled: !!convId, refetchInterval: false });
  const { data: nvidiaStatus } = trpc.nvidia.status.useQuery();
  const { data: usageState } = trpc.usage.state.useQuery(undefined, { refetchInterval: 5000 });
  const { data: connectors, refetch: refetchConnectors } = trpc.connectors.list.useQuery(undefined, { refetchInterval: 5000 });
  const createConversation = trpc.conversations.create.useMutation();
  const addMessage = trpc.messages.create.useMutation({ onSuccess: () => refetchMessages() });

  const isNvidiaReady = !!nvidiaStatus?.connected;
  const canSend = isNvidiaReady;
  const connectorsByType = useMemo(() => {
    const map = new Map<string, any>();
    (connectors || []).forEach((connector: any) => {
      if (!map.has(connector.type)) map.set(connector.type, connector);
    });
    return map;
  }, [connectors]);

  const connectorRows = [
    {
      key: "github",
      type: "github",
      title: "GitHub",
      description: "Analyze repositories, cite code, and track changes.",
      icon: GithubBrandIcon,
      authUrl: "/api/connectors/github/auth",
    },
    {
      key: "gmail",
      type: "gmail",
      title: "Gmail",
      description: "Search, summarize, and draft email replies.",
      icon: GmailBrandIcon,
      authUrl: "/api/connectors/google/auth?service=gmail",
    },
    {
      key: "google_drive",
      type: "google_drive",
      title: "Google Drive",
      description: "Read docs, search files, and pull file context.",
      icon: GoogleDriveBrandIcon,
      authUrl: "/api/connectors/google/auth?service=drive",
    },
  ] as const;

  const handleConnectorToggle = useCallback(async (row: (typeof connectorRows)[number]) => {
    const connected = connectorsByType.has(row.type);
    try {
      if (connected) {
        const response = await fetch("/api/connectors/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ service: row.type }),
        });
        if (!response.ok) throw new Error("Failed to disconnect connector");
        await refetchConnectors();
        return;
      }

      const response = await fetch(row.authUrl, { credentials: "include" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Failed to begin connector auth");
      }
      const { authUrl } = await response.json();
      await startConnectorAuth(authUrl, row.key);
      await refetchConnectors();
    } catch (error) {
      console.error("[Forge] Connector auth error", error);
    }
  }, [connectorsByType, refetchConnectors]);

  useEffect(() => {
    if (conversation?.model) return void setSelectedModel(conversation.model);
    if (isNvidiaReady && usageState?.selectedTier) return void setSelectedModel(tierModelMap[usageState.selectedTier] || "meta/llama-3.1-70b-instruct");
    if (isNvidiaReady) setSelectedModel("meta/llama-3.1-70b-instruct");
  }, [conversation?.model, isNvidiaReady, usageState?.selectedTier]);

  useEffect(() => {
    if (convId) return;
    const interval = window.setInterval(() => setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length), 3200);
    return () => window.clearInterval(interval);
  }, [convId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    if (!viewport) return;
    requestAnimationFrame(() => viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" }));
  }, [messageList, streaming.content, streaming.active]);

  const displayMessages = useMemo(() => (messageList || []).filter((m) => m.role !== "system"), [messageList]);

  const ensureLocalSession = useCallback(async () => {
    const response = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        provider: "email",
        email: "local-user@forge.local",
        name: "Forge Local User",
      }),
    });

    if (!response.ok) {
      throw new Error("Unable to establish a local session");
    }
  }, []);

  const handleStreamingSend = useCallback(async (targetConvId: number, content: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await addMessage.mutateAsync({ conversationId: targetConvId, content, model: selectedModel });
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.includes("Please login") || message.includes("UNAUTHORIZED")) {
        await ensureLocalSession();
        await addMessage.mutateAsync({ conversationId: targetConvId, content, model: selectedModel });
      }
    }
    const allMsgs = await refetchMessages();
    const history = (allMsgs.data || []).map((m) => ({ role: m.role as string, content: m.content }));
    setStreaming({ active: true, content: "", tokenCount: 0, startTime: Date.now(), toolCalls: [] });

    try {
      const response = await fetch("/api/nvidia/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, conversationId: targetConvId, model: selectedModel, systemPrompt: conversation?.systemPrompt || undefined }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText || "Failed to connect to streaming endpoint"}`);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let tokenCount = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const event = JSON.parse(data);
            if (event.type === "text") {
              fullContent += event.content;
              tokenCount = event.tokenCount || tokenCount + 1;
              setStreaming((prev) => ({ ...prev, content: fullContent, tokenCount }));
            } else if (event.type === "tool_use") {
              const tool = JSON.parse(event.content);
              setStreaming((prev) => ({ ...prev, toolCalls: [...prev.toolCalls, { name: tool.name, args: JSON.stringify(tool.args) }] }));
            } else if (event.type === "tool_result") {
              setStreaming((prev) => {
                const calls = [...prev.toolCalls];
                if (calls.length > 0) calls[calls.length - 1].result = event.content;
                return { ...prev, toolCalls: calls };
              });
            } else if (event.type === "done") {
              tokenCount = event.tokenCount || tokenCount;
            } else if (event.type === "error") {
              fullContent += `\n\n**Error:** ${event.content}`;
              setStreaming((prev) => ({ ...prev, content: fullContent }));
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        const errorMsg = e.message === "fetch failed" ? "Forge could not reach the model service." : e.message;
        setStreaming((prev) => ({ ...prev, content: prev.content + `\n\n**Error:** ${errorMsg}` }));
      }
    } finally {
      setStreaming((prev) => ({ ...prev, active: false }));
      abortRef.current = null;
      refetchMessages();
    }
  }, [selectedModel, conversation, addMessage, refetchMessages, ensureLocalSession]);

  useEffect(() => {
    if (!convId || streaming.active || pendingPromptHandledRef.current === convId) return;
    const storedPrompt = window.sessionStorage.getItem(pendingPromptKey(convId));
    if (!storedPrompt) return;
    pendingPromptHandledRef.current = convId;
    window.sessionStorage.removeItem(pendingPromptKey(convId));
    void handleStreamingSend(convId, storedPrompt);
  }, [convId, handleStreamingSend, streaming.active]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || streaming.active) return;
    setInput("");
    let targetConvId = convId;
    if (!targetConvId) {
      try {
        const newConv = await createConversation.mutateAsync({ model: selectedModel || undefined });
        targetConvId = newConv.id;
        window.sessionStorage.setItem(pendingPromptKey(newConv.id), content);
        setLocation(`/chat/${newConv.id}`);
        return;
      } catch (error: any) {
        const message = String(error?.message || "");
        if (message.includes("Please login") || message.includes("UNAUTHORIZED")) {
          try {
            await ensureLocalSession();
            const newConv = await createConversation.mutateAsync({ model: selectedModel || undefined });
            targetConvId = newConv.id;
            window.sessionStorage.setItem(pendingPromptKey(newConv.id), content);
            setLocation(`/chat/${newConv.id}`);
            return;
          } catch {
            return;
          }
        }
        return;
      }
    }
    void handleStreamingSend(targetConvId, content);
  };

  const handleStop = () => abortRef.current?.abort();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  const toggleTool = (id: number) => setExpandedTools((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const quickActions = [
    { icon: Presentation, label: "Create slides", prompt: "Create a 12-slides minimalist product launch PPT for xxx." },
    { icon: Monitor, label: "Build website", prompt: "Build a modern landing page for my product with clear sections and strong copy." },
    { icon: LaptopMinimal, label: "Develop desktop apps", prompt: "Plan and scaffold a desktop app with the best architecture and first features." },
    { icon: Palette, label: "Design", prompt: "Design a polished UI direction and component system for my product." },
    { icon: Plus, label: "More", prompt: "Show me more things Forge can help me build and automate." },
  ];

  const activeSlide = heroSlides[activeHeroSlide];

  if (!convId) {
    return (
      <div className="flex h-full flex-col bg-[#f6f5f2]">
        <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 pb-14 pt-10 md:px-6 md:pt-14">
          <div className="w-full max-w-[780px]">
            <div className="mx-auto mt-6 w-full max-w-[760px] md:mt-10">
              <h1 className="text-center font-serif text-[86px] font-medium leading-[0.9] tracking-[-0.085em] text-[#17151c] md:text-[110px]">What can I do<br />for you?</h1>

              <div className="mt-7 overflow-hidden rounded-[30px] border border-[#ded9d1] bg-white shadow-[0_8px_30px_rgba(42,37,30,0.05)]">
                <div className="px-5 pt-5">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Assign a task or ask anything"
                    rows={4}
                    spellCheck={false}
                    autoFocus
                    className="min-h-[166px] w-full resize-none border-0 bg-transparent p-0 text-[16px] leading-8 text-[#2f2b27] outline-none placeholder:text-[#6e6963] focus-visible:ring-0 focus-visible:shadow-none"
                  />

                  <div className="mt-4 flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2.5">
                      <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e0d8] bg-[#faf9f6] text-[#3b3632] transition-colors hover:bg-[#f4f1eb]"><Plus className="h-5 w-5" /></button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="flex h-12 items-center gap-2 rounded-full border border-[#e4e0d8] bg-[#faf9f6] px-4.5 text-[15px] font-medium text-[#2f2b27] transition-colors hover:bg-[#f4f1eb]">
                            <Link2 className="h-4.5 w-4.5" />
                            <span>{connectorsByType.size ? `+${connectorsByType.size}` : "+0"}</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" side="top" sideOffset={12} className="w-[320px] rounded-[22px] border border-[#e6e1d8] bg-white p-2 shadow-[0_22px_60px_rgba(42,37,30,0.12)]">
                          <div className="space-y-1">
                            {connectorRows.map((row) => {
                              const connected = connectorsByType.has(row.type);
                              return (
                                <button
                                  key={row.key}
                                  type="button"
                                  onClick={() => handleConnectorToggle(row)}
                                  className="flex w-full items-center justify-between rounded-[16px] px-3 py-2 text-left transition-colors hover:bg-[#f4f1eb]"
                                >
                                  <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="grid h-8 w-8 place-items-center rounded-full bg-[#f7f5f1]">
                                      <row.icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[13px] font-medium text-[#2f2b27]">{row.title}</div>
                                      <div className="truncate text-[11px] leading-4 text-[#8a847c]">{row.description}</div>
                                    </div>
                                  </div>
                                  <Switch checked={connected} className="pointer-events-none" />
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-2 grid gap-1 rounded-[16px] border border-[#ece7df] bg-[#fbfaf8] p-1">
                            <button type="button" onClick={() => setLocation("/connectors")} className="flex items-center justify-between rounded-[13px] px-3 py-2 text-left text-[13px] font-medium text-[#2f2b27] transition-colors hover:bg-[#f2efe9]">
                              <span>Add connectors</span>
                              <ChevronRight className="h-3.5 w-3.5 text-[#8a847c]" />
                            </button>
                            <button type="button" onClick={() => setLocation("/connectors")} className="flex items-center justify-between rounded-[13px] px-3 py-2 text-left text-[13px] font-medium text-[#2f2b27] transition-colors hover:bg-[#f2efe9]">
                              <span>Manage connectors</span>
                              <ChevronRight className="h-3.5 w-3.5 text-[#8a847c]" />
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <button type="button" onClick={() => setLocation("/connectors")} className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e0d8] bg-[#faf9f6] text-[#3b3632] transition-colors hover:bg-[#f4f1eb]"><Monitor className="h-4.5 w-4.5" /></button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#5a5550] transition-colors hover:bg-[#f1efea]"><AudioLines className="h-4.5 w-4.5" /></button>
                      <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#5a5550] transition-colors hover:bg-[#f1efea]"><Mic className="h-4.5 w-4.5" /></button>
                      <button type="button" disabled={!input.trim() || !canSend} onClick={handleSend} className={cn("flex h-12 w-12 items-center justify-center rounded-full transition-colors", input.trim() && canSend ? "bg-[#121212] text-white hover:opacity-90" : "bg-[#ece9e4] text-[#b8b3ab] cursor-not-allowed")}><Send className="h-5 w-5" /></button>
                    </div>
                  </div>
                </div>

                {promoVisible ? (
                  <div className="flex items-start gap-4 border-t border-[#d9e9fb] bg-[#e9f4ff] px-6 py-4 text-[15px] leading-7 text-[#53677b]">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3c82f6] text-white"><Gem className="h-4 w-4" /></div>
                    <div className="flex-1">
                      <div><span>Your task on Forge Desktop consumes </span><span className="font-semibold">50% fewer credits</span></div>
                      <div className="mt-1"><button type="button" className="font-medium text-[#3576df]">Download now</button></div>
                    </div>
                    <button type="button" onClick={() => setPromoVisible(false)} className="mt-1 text-[#7c8ca0]"><ChevronRight className="h-5 w-5 rotate-45" /></button>
                  </div>
                ) : null}
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-4 px-2">
                {quickActions.map((action, i) => (
                  <button key={i} type="button" onClick={() => setInput(action.prompt)} className="flex items-center gap-3 rounded-full border border-[#dfdbd2] bg-[#faf9f6] px-6 py-3.5 text-[16px] font-medium text-[#4a4540] transition-colors hover:bg-[#f0eeea]">
                    <action.icon className="h-4 w-4 text-[#77716b]" />{action.label}
                  </button>
                ))}
              </div>

              <div className="mx-auto mt-14 w-full max-w-[760px] rounded-[30px] border border-[#e0ddd6] bg-[#efeeea] p-5 md:p-6 shadow-[0_8px_24px_rgba(42,37,30,0.03)]">
                <div className="grid min-h-[176px] grid-cols-[1.1fr_0.9fr] items-center gap-4">
                  <div className="pl-2 md:pl-3">
                    <h3 className="max-w-[310px] text-[24px] font-semibold leading-[1.2] tracking-[-0.045em] text-[#2f2b27] md:text-[26px]">{activeSlide.title}</h3>
                    <p className="mt-3 max-w-[320px] text-[15px] leading-7 text-[#6f6962]">{activeSlide.description}</p>
                  </div>
                  <div className="flex justify-end"><HeroArtwork kind={activeSlide.kind} /></div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {heroSlides.map((_, index) => (
                    <button key={index} type="button" onClick={() => setActiveHeroSlide(index)} className={cn("h-3 w-3 rounded-full transition-colors", index === activeHeroSlide ? "bg-[#b8b3ab]" : "bg-[#d9d4cc]")} />
                  ))}
                </div>
              </div>
              <div className="pb-10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
            {displayMessages.map((msg) => {
              if (msg.role === "tool") {
                return <div key={msg.id} className="ml-11"><button onClick={() => toggleTool(msg.id)} className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground">{expandedTools.has(msg.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}<Terminal className="h-3 w-3" /><span>Tool execution</span></button>{expandedTools.has(msg.id) && <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-accent/30 p-3 text-xs font-mono"><pre className="whitespace-pre-wrap text-muted-foreground">{msg.content}</pre></div>}</div>;
              }
              return <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>{msg.role === "assistant" && <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"><img src="/logo-light.png" alt="Forge Logo" className="h-4 w-4 object-contain" /></div>}<div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5", msg.role === "user" ? "bg-[#33d233] text-[#121212]" : "border border-[#e3ddd4] bg-white text-[#2f2b27]")}>{msg.role === "assistant" ? <div className="prose prose-sm max-w-none text-[13px] leading-relaxed text-[#2f2b27] dark:prose-invert"><Streamdown>{msg.content}</Streamdown></div> : <p className="whitespace-pre-wrap text-sm">{msg.content}</p>}</div>{msg.role === "user" && <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary"><User className="h-4 w-4 text-secondary-foreground" /></div>}</div>;
            })}
            {streaming.active && <><div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"><Sparkles className="h-4 w-4 animate-pulse text-primary" /></div><div className="max-w-[80%] rounded-2xl border border-[#e3ddd4] bg-white px-4 py-2.5 text-[#2f2b27]">{streaming.content ? <div className="prose prose-sm max-w-none text-[13px] leading-relaxed text-[#2f2b27] dark:prose-invert"><Streamdown>{streaming.content}</Streamdown></div> : <div className="flex gap-1.5 py-1"><div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" /><div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" /><div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" /></div>}</div></div></>}
          </div>
        </ScrollArea>
      </div>
      <div className="shrink-0 border-t border-[#ddd8cf] bg-[#f6f5f2]/95 p-4 backdrop-blur-sm"><div className="mx-auto max-w-3xl"><form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2"><Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything..." className="min-h-[44px] max-h-32 flex-1 resize-none rounded-[18px] border border-[#ded9d1] bg-white px-4 py-3 text-[14px] text-[#2f2b27] shadow-none outline-none placeholder:text-[#8b857c] focus-visible:border-[#ded9d1] focus-visible:ring-0 focus-visible:shadow-none" rows={1} disabled={streaming.active} />{streaming.active ? <Button type="button" size="icon" variant="destructive" className="h-[44px] w-[44px] shrink-0" onClick={handleStop}><StopCircle className="h-4 w-4" /></Button> : <Button type="submit" size="icon" disabled={!input.trim() || !canSend} className="h-[44px] w-[44px] shrink-0"><Send className="h-4 w-4" /></Button>}</form>{!canSend && !streaming.active && <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-500">Add a valid NVIDIA API key to start chatting.</p>}</div></div>
    </div>
  );
}
