import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  User,
  Terminal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Github,
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
  Check,
  CheckCircle2,
  Clock,
  Circle,
  Star,
  ArrowRight,
  Share2,
  RotateCcw,
  MoreHorizontal,
  MessageSquare,
  X,
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
  { title: "Download Forge for Windows or macOS", description: "Access local files and work seamlessly with your desktop.", kind: "desktop" as const },
  { title: "Customize your AI agent for your business", description: "Connect channels and shape workflows around your team.", kind: "business" as const },
  { title: "Create skills", description: "Package repeatable flows into reusable skills.", kind: "skills" as const },
  { title: "Personalize your Forge", description: "Tune preferences, memory, and behavior.", kind: "personalize" as const },
];

function HeroArtwork({ kind }: { kind: string }) {
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
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
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
  const createConversation = trpc.conversations.create.useMutation();
  const addMessage = trpc.messages.create.useMutation({ onSuccess: () => refetchMessages() });

  const isNvidiaReady = !!nvidiaStatus?.connected;
  const canSend = isNvidiaReady;
  const credits = Math.max(0, Math.round(usageState?.credits ?? 851));

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

  const handleStreamingSend = useCallback(async (targetConvId: number, content: string) => {
    const controller = new AbortController();
    abortRef.current = controller;
    await addMessage.mutateAsync({ conversationId: targetConvId, content, model: selectedModel }).catch(() => {});
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
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText || "Failed to connect"}`);
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
              const tool = event;
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
  }, [selectedModel, conversation, addMessage, refetchMessages]);

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
      } catch { return; }
    }
    void handleStreamingSend(targetConvId, content);
  };

  const handleStop = () => abortRef.current?.abort();
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
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

  // ─── NEW TASK VIEW (no conversation) ───
  if (!convId) {
    return (
      <div className="flex h-full flex-col bg-[#f6f5f2]">
        <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 pb-14 pt-8 md:px-6 md:pt-12">
          <div className="w-full max-w-[780px]">
            {/* Hero heading */}
            <h1 className="text-center font-serif text-[72px] font-medium leading-[0.92] tracking-[-0.06em] text-[#17151c] md:text-[96px]">
              What can I do<br />for you?
            </h1>

            {/* Input card */}
            <div className="mt-8 overflow-hidden rounded-[28px] border border-[#ded9d1] bg-white shadow-[0_8px_30px_rgba(42,37,30,0.06)]">
              <div className="px-6 pt-6">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Assign a task or ask anything"
                  rows={4}
                  spellCheck={false}
                  autoFocus
                  className="min-h-[160px] w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-7 text-[#2f2b27] outline-none placeholder:text-[#9e9890]"
                />

                {/* Bottom bar of input card */}
                <div className="mt-3 flex items-center justify-between pb-5">
                  <div className="flex items-center gap-2.5">
                    <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e0d8] bg-[#faf9f6] text-[#5a5550] transition-colors hover:bg-[#f0eeea]">
                      <Plus className="h-5 w-5" />
                    </button>
                    <button type="button" onClick={() => setLocation("/connectors")} className="flex h-12 items-center gap-2 rounded-full border border-[#e4e0d8] bg-[#faf9f6] px-4 text-sm font-medium text-[#2f2b27] transition-colors hover:bg-[#f0eeea]">
                      <Github className="h-4 w-4" /><span>+1</span>
                    </button>
                    <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e0d8] bg-[#faf9f6] text-[#5a5550] transition-colors hover:bg-[#f0eeea]">
                      <Monitor className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full text-[#7a746c] transition-colors hover:bg-[#f1efea]">
                      <Mic className="h-[18px] w-[18px]" />
                    </button>
                    <button
                      type="button"
                      disabled={!input.trim() || !canSend}
                      onClick={handleSend}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full transition-all",
                        input.trim() && canSend
                          ? "bg-[#1a1816] text-white hover:opacity-90"
                          : "bg-[#ece9e4] text-[#b8b3ab] cursor-not-allowed"
                      )}
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Promo banner */}
              {promoVisible && (
                <div className="flex items-start gap-3 border-t border-[#d9e9fb] bg-[#edf4ff] px-5 py-3.5 text-[14px] leading-6 text-[#53677b]">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3c82f6] text-white">
                    <Gem className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <span>Your task on Forge Desktop consumes </span>
                    <span className="font-semibold">50% fewer credits</span>
                    <span className="ml-2">
                      <button type="button" className="font-medium text-[#3576df] hover:underline">Download now</button>
                    </span>
                  </div>
                  <button type="button" onClick={() => setPromoVisible(false)} className="mt-0.5 text-[#7c8ca0] hover:text-[#5a6b80]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick action chips */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 px-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(action.prompt)}
                  className="flex items-center gap-2.5 rounded-full border border-[#dfdbd2] bg-[#faf9f6] px-5 py-3 text-[14px] font-medium text-[#4a4540] transition-colors hover:bg-[#f0eeea]"
                >
                  <action.icon className="h-4 w-4 text-[#77716b]" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Carousel card */}
            <div className="mx-auto mt-12 w-full max-w-[760px] rounded-[24px] border border-[#e0ddd6] bg-[#efeeea] p-5 shadow-[0_4px_16px_rgba(42,37,30,0.03)]">
              <div className="grid min-h-[160px] grid-cols-[1.1fr_0.9fr] items-center gap-4">
                <div className="pl-2">
                  <h3 className="max-w-[300px] text-[22px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#2f2b27]">{activeSlide.title}</h3>
                  <p className="mt-2.5 max-w-[300px] text-[14px] leading-6 text-[#6f6962]">{activeSlide.description}</p>
                </div>
                <div className="flex justify-end"><HeroArtwork kind={activeSlide.kind} /></div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                {heroSlides.map((_, index) => (
                  <button key={index} type="button" onClick={() => setActiveHeroSlide(index)} className={cn("h-2.5 w-2.5 rounded-full transition-colors", index === activeHeroSlide ? "bg-[#b8b3ab]" : "bg-[#d9d4cc]")} />
                ))}
              </div>
            </div>
            <div className="pb-8" />
          </div>
        </div>
      </div>
    );
  }

  // ─── TASK/CHAT VIEW (active conversation) ───
  const taskSteps = streaming.toolCalls.map((tc, i) => ({
    id: i,
    name: tc.name,
    status: tc.result ? "done" as const : (i === streaming.toolCalls.length - 1 && streaming.active ? "active" as const : "pending" as const),
    result: tc.result,
  }));
  const completedSteps = taskSteps.filter(s => s.status === "done").length;
  const isTaskComplete = !streaming.active && displayMessages.length > 0 && displayMessages[displayMessages.length - 1]?.role === "assistant";

  return (
    <div className="flex h-full flex-col bg-[#f6f5f2]">
      {/* Task header bar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#e8e4dc] bg-[#f6f5f2] px-4">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="truncate text-sm font-medium text-[#36322d]">{conversation?.title || "Task"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#7a746c] transition-colors hover:bg-[#efede8]">
            <Share2 className="h-3.5 w-3.5" /> Collaborate
          </button>
          <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-[#7a746c] transition-colors hover:bg-[#efede8]">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#7a746c] transition-colors hover:bg-[#efede8]">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#7a746c] transition-colors hover:bg-[#efede8]">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chat messages area */}
      <div ref={scrollRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-[720px] space-y-5 px-4 py-6">
            {displayMessages.map((msg) => {
              if (msg.role === "tool") {
                return (
                  <div key={msg.id} className="ml-10">
                    <button onClick={() => toggleTool(msg.id)} className="flex items-center gap-2 text-xs text-[#7a746c] transition-colors hover:text-[#36322d]">
                      {expandedTools.has(msg.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <Terminal className="h-3 w-3" />
                      <span>Tool execution</span>
                    </button>
                    {expandedTools.has(msg.id) && (
                      <div className="mt-2 overflow-x-auto rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-3 text-xs font-mono">
                        <pre className="whitespace-pre-wrap text-[#7a746c]">{msg.content}</pre>
                      </div>
                    )}
                  </div>
                );
              }

              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl bg-[#efede8] px-4 py-3">
                      <p className="whitespace-pre-wrap text-[14px] leading-6 text-[#1a1816]">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              // Assistant message - Manus style
              return (
                <div key={msg.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0ede8]">
                    <img src="/icon-only.png" alt="Forge" className="h-4 w-4 object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif text-sm font-semibold text-[#1a1816]">forge</span>
                      <span className="rounded-md bg-[#efede8] px-1.5 py-0.5 text-[10px] font-medium text-[#7a746c]">
                        {usageState?.selectedTier === "max" ? "Max" : usageState?.selectedTier === "core" ? "Core" : "Lite"}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-[14px] leading-7 text-[#36322d]">
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Streaming state */}
            {streaming.active && (
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0ede8]">
                  <Sparkles className="h-4 w-4 animate-pulse text-[#7a746c]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif text-sm font-semibold text-[#1a1816]">forge</span>
                    <span className="rounded-md bg-[#efede8] px-1.5 py-0.5 text-[10px] font-medium text-[#7a746c]">
                      {usageState?.selectedTier === "max" ? "Max" : usageState?.selectedTier === "core" ? "Core" : "Lite"}
                    </span>
                  </div>
                  {streaming.content ? (
                    <div className="prose prose-sm max-w-none text-[14px] leading-7 text-[#36322d]">
                      <Streamdown>{streaming.content}</Streamdown>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 py-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#b8b3ab]" style={{ animationDelay: "0ms" }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#b8b3ab]" style={{ animationDelay: "150ms" }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-[#b8b3ab]" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task completion state */}
            {isTaskComplete && !streaming.active && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                  <span className="text-sm font-medium text-[#22c55e]">Task completed</span>
                  <div className="ml-auto flex items-center gap-1 text-[#7a746c]">
                    <span className="text-xs">How was this result?</span>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} className="p-0.5 hover:text-[#f59e0b] transition-colors">
                        <Star className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-[#7a746c]">Suggested follow-ups</span>
                  <button className="flex w-full items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-left transition-colors hover:bg-[#faf9f6]">
                    <Sparkles className="h-4 w-4 shrink-0 text-[#7a746c]" />
                    <span className="flex-1 text-sm text-[#36322d]">Make the process into a re-usable skill</span>
                    <ArrowRight className="h-4 w-4 text-[#7a746c]" />
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-left transition-colors hover:bg-[#faf9f6]">
                    <Clock className="h-4 w-4 shrink-0 text-[#7a746c]" />
                    <span className="flex-1 text-sm text-[#36322d]">Continue refining the results</span>
                    <ArrowRight className="h-4 w-4 text-[#7a746c]" />
                  </button>
                </div>
              </div>
            )}

            {/* Sandbox / Computer card */}
            {(streaming.active || taskSteps.length > 0) && (
              <div className="sandbox-card mx-auto max-w-[560px]">
                <div className="flex items-center gap-3 border-b border-[#e8e4dc] px-4 py-3">
                  <div className="h-12 w-16 rounded-lg bg-[#f0ede8] flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-[#7a746c]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1a1816]">Forge's computer</div>
                    <div className="flex items-center gap-1.5 text-xs text-[#7a746c]">
                      <Terminal className="h-3 w-3" />
                      <span>Forge is using {streaming.toolCalls.length > 0 ? streaming.toolCalls[streaming.toolCalls.length - 1].name : "Editor"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="h-7 w-7 rounded-md flex items-center justify-center text-[#7a746c] hover:bg-[#efede8]">
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button className="h-7 w-7 rounded-md flex items-center justify-center text-[#7a746c] hover:bg-[#efede8]">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#1a1816]">Task progress</span>
                    <span className="text-xs text-[#7a746c]">{completedSteps} / {taskSteps.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {taskSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-2.5 py-1">
                        {step.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#22c55e]" />
                        ) : step.status === "active" ? (
                          <div className="h-4 w-4 shrink-0 rounded-full border-2 border-[#3c82f6] bg-[#3c82f6]" />
                        ) : (
                          <Clock className="h-4 w-4 shrink-0 text-[#b8b3ab]" />
                        )}
                        <span className={cn("text-sm", step.status === "done" ? "text-[#36322d]" : step.status === "active" ? "text-[#1a1816] font-medium" : "text-[#7a746c]")}>
                          {step.name}
                        </span>
                        {step.status === "active" && (
                          <span className="ml-auto text-xs text-[#7a746c]">Thinking</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Bottom input bar - Manus style */}
      <div className="shrink-0 border-t border-[#e8e4dc] bg-[#f6f5f2] px-4 py-3">
        <div className="mx-auto max-w-[720px]">
          <div className="flex items-end gap-2 rounded-2xl border border-[#e8e4dc] bg-white px-3 py-2">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Send message to Forge"
                className="w-full resize-none border-0 bg-transparent py-1.5 text-[14px] leading-6 text-[#1a1816] outline-none placeholder:text-[#9e9890]"
                rows={1}
                disabled={streaming.active}
              />
            </div>
            {streaming.active ? (
              <button type="button" onClick={handleStop} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ef4444] text-white transition-colors hover:opacity-90">
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!input.trim() || !canSend}
                onClick={handleSend}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
                  input.trim() && canSend ? "bg-[#1a1816] text-white hover:opacity-90" : "text-[#b8b3ab] cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#7a746c] transition-colors hover:bg-[#efede8]">
              <Plus className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#7a746c] transition-colors hover:bg-[#efede8]">
              <Github className="h-4 w-4" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#7a746c] transition-colors hover:bg-[#efede8]">
              <MessageSquare className="h-4 w-4" />
            </button>
            <span className="rounded-full bg-[#efede8] px-2 py-0.5 text-[10px] font-medium text-[#7a746c]">+2</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#7a746c] transition-colors hover:bg-[#efede8]">
              <Monitor className="h-4 w-4" />
            </button>
            <div className="flex-1" />
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-[#7a746c] transition-colors hover:bg-[#efede8]">
              <Mic className="h-4 w-4" />
            </button>
          </div>
          {!canSend && !streaming.active && (
            <p className="mt-1.5 text-[11px] text-amber-600">Add a valid NVIDIA API key in Settings to start chatting.</p>
          )}
        </div>
      </div>
    </div>
  );
}
