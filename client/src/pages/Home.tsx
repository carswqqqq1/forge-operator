import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send, Sparkles, User, Terminal, ChevronDown, ChevronRight,
  Github, Plus, Monitor, Palette, Mic,
  Presentation, LaptopMinimal, AudioLines,
  StopCircle, Loader2, Search, FileText, BarChart3,
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
  {
    title: "Download Manus for Windows or macOS",
    description: "Access local files and work seamlessly with your desktop.",
    kind: "desktop",
  },
  {
    title: "Customize your AI agent for your business",
    description: "Connect channels and shape workflows around your team.",
    kind: "business",
  },
  {
    title: "Create skills",
    description: "Package repeatable flows into reusable skills.",
    kind: "skills",
  },
  {
    title: "Personalize your Manus",
    description: "Tune preferences, memory, and behavior.",
    kind: "personalize",
  },
] as const;

function HeroArtwork({ kind }: { kind: (typeof heroSlides)[number]["kind"] }) {
  if (kind === "desktop") {
    return (
      <div className="relative flex h-[130px] w-[186px] items-center justify-center overflow-hidden rounded-[20px] border border-[#dfdbd2] bg-white shadow-[0_6px_20px_rgba(42,37,30,0.05)]">
        <div className="absolute left-4 top-4 flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="w-[120px] rounded-[16px] border border-[#e9e5de] bg-[#fbfaf8] p-3 shadow-[0_4px_10px_rgba(42,37,30,0.04)]">
          <div className="font-serif text-[12px] leading-4 tracking-[-0.03em] text-[#2f2b27]">
            What can I do for you?
          </div>
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
      <div className="relative flex h-[130px] w-[186px] items-center justify-center">
        <div className="absolute right-8 top-4 h-3 w-3 rounded-full bg-[#4ccf62]" />
        <div className="absolute right-1 top-12 h-4 w-4 rounded-full bg-[#31c47d]" />
        <div className="absolute left-6 top-10 h-4 w-4 rounded-full bg-[#3da6f3]" />
        <div className="absolute right-0 top-2 h-4 w-4 rounded-full bg-[#2d7ff0]" />
        <div className="absolute left-0 top-0 h-4 w-4 rounded-full bg-[#36c978]" />
        <div className="relative flex h-[124px] w-[90px] items-end justify-center rounded-[22px] border border-[#dad6cf] bg-white shadow-[0_6px_20px_rgba(42,37,30,0.05)]">
          <div className="absolute top-6 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full bg-[#ebe7df]" />
          <div className="absolute top-12 left-1/2 h-2.5 w-10 -translate-x-1/2 rounded-full bg-[#f0ece5]" />
          <div className="absolute bottom-7 left-1/2 w-[116px] -translate-x-1/2 rounded-[14px] border border-[#e8e4dc] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.06)]">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1efea]">
                <Sparkles className="h-3 w-3 text-[#6b655f]" />
              </div>
              <div className="h-2.5 flex-1 rounded-full bg-[#ebe7df]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "skills") {
    return (
      <div className="relative flex h-[130px] w-[186px] items-center justify-center">
        <div className="space-y-3">
          <div className="ml-8 flex w-[118px] items-center gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.05)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#57ce63]">
              <Search className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-14 rounded-full bg-[#ece7e0]" />
              <div className="h-2 w-10 rounded-full bg-[#f1eee8]" />
            </div>
          </div>
          <div className="flex w-[126px] items-center gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.05)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2e8cf4]">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-16 rounded-full bg-[#ece7e0]" />
              <div className="h-2 w-12 rounded-full bg-[#f1eee8]" />
            </div>
          </div>
          <div className="ml-10 flex w-[120px] items-center gap-3 rounded-[14px] bg-white px-3 py-2 shadow-[0_4px_12px_rgba(42,37,30,0.05)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f2b324]">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-14 rounded-full bg-[#ece7e0]" />
              <div className="h-2 w-10 rounded-full bg-[#f1eee8]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[130px] w-[186px] items-center justify-center">
      <div className="relative flex h-[128px] w-[152px] flex-col gap-3 rounded-[20px] border border-[#dad6cf] bg-white px-5 py-4 shadow-[0_6px_20px_rgba(42,37,30,0.05)]">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#f2efe9]">
            <Palette className="h-4 w-4 text-[#6d675f]" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 w-14 rounded-full bg-[#ece7e0]" />
            <div className="h-2 w-12 rounded-full bg-[#f1eee8]" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2.5 rounded-full bg-[#ece7e0]" />
          <div className="h-2.5 w-[88%] rounded-full bg-[#f1eee8]" />
          <div className="h-2.5 w-[76%] rounded-full bg-[#ece7e0]" />
        </div>
        <div className="mt-auto overflow-hidden rounded-[12px] bg-[#f4f0ea]">
          <div className="h-10 bg-gradient-to-r from-[#c9d9f1] via-[#e7e0d5] to-[#f2c9b7]" />
        </div>
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
  const [streaming, setStreaming] = useState<StreamingState>({
    active: false, content: "", tokenCount: 0, startTime: 0, toolCalls: [],
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingPromptHandledRef = useRef<number | null>(null);

  const convId = conversationId ? parseInt(conversationId) : null;

  const { data: conversation } = trpc.conversations.get.useQuery(
    { id: convId! },
    { enabled: !!convId }
  );
  const { data: messageList, refetch: refetchMessages } = trpc.messages.list.useQuery(
    { conversationId: convId! },
    { enabled: !!convId, refetchInterval: false }
  );
  const { data: nvidiaStatus } = trpc.nvidia.status.useQuery();
  const { data: usageState } = trpc.usage.state.useQuery(undefined, { refetchInterval: 5000 });

  const createConversation = trpc.conversations.create.useMutation();
  const addMessage = trpc.messages.create.useMutation({ onSuccess: () => refetchMessages() });

  const isNvidiaReady = !!nvidiaStatus?.connected;
  const canSend = isNvidiaReady;

  useEffect(() => {
    if (conversation?.model) {
      setSelectedModel(conversation.model);
      return;
    }

    if (isNvidiaReady && usageState?.selectedTier) {
      setSelectedModel(tierModelMap[usageState.selectedTier] || "meta/llama-3.1-70b-instruct");
      return;
    }

    if (isNvidiaReady) {
      setSelectedModel("meta/llama-3.1-70b-instruct");
    }
  }, [conversation?.model, isNvidiaReady, usageState?.selectedTier]);

  useEffect(() => {
    if (convId) return;
    const interval = window.setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3200);
    return () => window.clearInterval(interval);
  }, [convId]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        requestAnimationFrame(() => {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
        });
      }
    }
  }, [messageList, streaming.content, streaming.active]);

  const displayMessages = useMemo(() => {
    return (messageList || []).filter((m) => m.role !== "system");
  }, [messageList]);

  const handleStreamingSend = useCallback(async (targetConvId: number, content: string) => {
    const controller = new AbortController();
    abortRef.current = controller;

    await addMessage.mutateAsync({
      conversationId: targetConvId,
      content,
      model: selectedModel,
    }).catch(() => {});

    const allMsgs = await refetchMessages();
    const history = (allMsgs.data || []).map((m) => ({
      role: m.role as string,
      content: m.content,
    }));

    setStreaming({ active: true, content: "", tokenCount: 0, startTime: Date.now(), toolCalls: [] });

    try {
      const body: any = {
        messages: history,
        conversationId: targetConvId,
        model: selectedModel,
        systemPrompt: conversation?.systemPrompt || undefined,
      };

      const res = await fetch("/api/ollama/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText || "Failed to connect to streaming endpoint"}`);
      }

      const reader = res.body!.getReader();
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
              setStreaming((prev) => ({
                ...prev,
                content: fullContent,
                tokenCount,
              }));
            } else if (event.type === "tool_use") {
              const tool = JSON.parse(event.content);
              setStreaming((prev) => ({
                ...prev,
                toolCalls: [...prev.toolCalls, { name: tool.name, args: JSON.stringify(tool.args) }],
              }));
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
        let errorMsg = e.message;
        if (errorMsg === "fetch failed") {
          errorMsg = "Forge could not reach the model service.";
        }
        setStreaming((prev) => ({
          ...prev,
          content: prev.content + `\n\n**Error:** ${errorMsg}`,
        }));
      }
    } finally {
      setStreaming((prev) => ({ ...prev, active: false }));
      abortRef.current = null;
      refetchMessages();
    }
  }, [selectedModel, conversation, addMessage, refetchMessages]);

  useEffect(() => {
    if (!convId || streaming.active) return;
    if (pendingPromptHandledRef.current === convId) return;

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
        const newConv = await createConversation.mutateAsync({
          model: selectedModel || undefined,
        });
        targetConvId = newConv.id;
        window.sessionStorage.setItem(pendingPromptKey(newConv.id), content);
        setLocation(`/chat/${newConv.id}`);
        return;
      } catch {
        return;
      }
    }

    void handleStreamingSend(targetConvId, content);
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTool = (id: number) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 pb-14 pt-12 md:px-6 md:pt-16">
          <div className="w-full max-w-[760px]">
            <div className="mx-auto mt-12 w-full max-w-[760px] md:mt-16">
              <h1 className="text-center font-serif text-[42px] font-medium leading-[0.98] tracking-[-0.065em] text-[#2f2b27] md:text-[64px]">
                What can I do for you?
              </h1>

              <div className="mt-9 overflow-hidden rounded-[30px] border border-[#dfdbd2] bg-white shadow-[0_8px_30px_rgba(42,37,30,0.05)]">
                <div className="px-5 pt-5">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="e.g., Create a 12-slides minimalist product launch PPT for xxx."
                    rows={3}
                    spellCheck={false}
                    autoFocus
                    className="min-h-[112px] w-full resize-none border-0 bg-transparent p-0 text-[16px] leading-8 text-[#2f2b27] outline-none placeholder:text-[#403c38]"
                  />

                  <div className="mt-4 flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e7e3da] bg-[#faf9f6] text-[#3b3632] transition-colors hover:bg-[#f0eeea]">
                        <Plus className="h-6 w-6" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocation("/connectors")}
                        className="flex h-12 items-center gap-2 rounded-full border border-[#e7e3da] bg-[#faf9f6] px-4 text-[14px] font-medium text-[#2f2b27] transition-colors hover:bg-[#f0eeea]"
                      >
                        <Github className="h-5 w-5" />
                        <span>+1</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocation("/scheduled")}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e7e3da] bg-[#faf9f6] text-[#3b3632] transition-colors hover:bg-[#f0eeea]"
                      >
                        <Monitor className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-[#5a5550] transition-colors hover:bg-[#f1efea]">
                        <AudioLines className="h-5 w-5" />
                      </button>
                      <button type="button" className="flex h-11 w-11 items-center justify-center rounded-full text-[#5a5550] transition-colors hover:bg-[#f1efea]">
                        <Mic className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        disabled={!input.trim() || !canSend}
                        onClick={handleSend}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <Send className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {promoVisible ? (
                  <div className="flex items-start gap-3 border-t border-[#d9e9fb] bg-[#e9f5ff] px-5 py-4 text-[15px] leading-7 text-[#4e6176]">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2583ff] text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1">
                      <span>Your task on Manus Desktop consumes </span>
                      <span className="font-semibold">50% fewer credits</span>
                      <span>- offer ends 3/30 (PDT) </span>
                      <button type="button" className="font-medium text-[#2e7ce6]">Download now</button>
                    </div>
                    <button type="button" onClick={() => setPromoVisible(false)} className="mt-1 text-[#7c8ca0]">
                      <ChevronRight className="h-5 w-5 rotate-45" />
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 px-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInput(action.prompt)}
                    className="flex items-center gap-2 rounded-full border border-[#dfdbd2] bg-[#faf9f6] px-5 py-3 text-[14px] font-medium text-[#4a4540] transition-colors hover:bg-[#f0eeea]"
                  >
                    <action.icon className="h-4 w-4 text-[#77716b]" />
                    {action.label}
                  </button>
                ))}
              </div>

              <div className="mx-auto mt-14 w-full max-w-[760px] rounded-[28px] border border-[#e0ddd6] bg-[#efeeea] p-4 md:p-6 shadow-[0_8px_24px_rgba(42,37,30,0.03)]">
                <div className="grid min-h-[168px] grid-cols-[1.15fr_0.85fr] items-center gap-4">
                  <div className="pl-2 md:pl-3">
                    <h3 className="max-w-[300px] text-[22px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#2f2b27] md:text-[24px]">
                      {activeSlide.title}
                    </h3>
                    <p className="mt-2 max-w-[300px] text-[14px] leading-6 text-[#6f6962]">
                      {activeSlide.description}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <HeroArtwork kind={activeSlide.kind} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveHeroSlide(index)}
                      className={cn(
                        "h-3 w-3 rounded-full transition-colors",
                        index === activeHeroSlide ? "bg-[#b8b3ab]" : "bg-[#d9d4cc]"
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="h-12 shrink-0 border-b border-border bg-background/95 px-4 backdrop-blur-sm flex items-center justify-between">
        <div className="min-w-0 flex items-center gap-3">
          <h2 className="truncate text-sm font-medium">
            {conversation?.title || "Chat"}
          </h2>
        </div>
        <div />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
            {displayMessages.map((msg) => {
              if (msg.role === "tool") {
                return (
                  <div key={msg.id} className="ml-11">
                    <button
                      onClick={() => toggleTool(msg.id)}
                      className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {expandedTools.has(msg.id) ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <Terminal className="h-3 w-3" />
                      <span>Tool execution</span>
                    </button>
                    {expandedTools.has(msg.id) && (
                      <div className="mt-2 overflow-x-auto rounded-lg border border-border bg-accent/30 p-3 text-xs font-mono">
                        <pre className="whitespace-pre-wrap text-muted-foreground">{msg.content}</pre>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <img src="/logo-light.png" alt="Forge Logo" className="h-4 w-4 object-contain" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/30 bg-card"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none text-[13px] leading-relaxed dark:prose-invert">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              );
            })}

            {streaming.active && (
              <>
                {streaming.toolCalls.map((tc, i) => (
                  <div key={`tc-${i}`} className="ml-11">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Terminal className="h-3 w-3 text-amber-500" />
                      <span className="font-medium">{tc.name}</span>
                      {tc.result ? (
                        <Badge className="h-4 border-emerald-500/20 bg-emerald-500/10 text-[9px] text-emerald-500">done</Badge>
                      ) : (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                    </div>
                    {tc.result && (
                      <div className="mt-1 max-h-24 overflow-y-auto rounded-lg border border-border bg-accent/30 p-2 text-[11px] font-mono">
                        <pre className="whitespace-pre-wrap text-muted-foreground">{tc.result.slice(0, 500)}</pre>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl border border-border/30 bg-card px-4 py-2.5">
                    {streaming.content ? (
                      <div className="prose prose-sm max-w-none text-[13px] leading-relaxed dark:prose-invert">
                        <Streamdown>{streaming.content}</Streamdown>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 py-1">
                        <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                        <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                        <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {addMessage.isPending && !streaming.active && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl border border-border/30 bg-card px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                    <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                    <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="shrink-0 border-t border-border bg-background/95 p-4 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-end gap-2"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="min-h-[44px] max-h-32 flex-1 resize-none border-border bg-card text-sm"
              rows={1}
              disabled={streaming.active}
            />
            {streaming.active ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-[44px] w-[44px] shrink-0"
                onClick={handleStop}
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || !canSend}
                className="h-[44px] w-[44px] shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
          {!canSend && !streaming.active && (
            <p className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-500">
              Add a valid NVIDIA API key to start chatting.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
