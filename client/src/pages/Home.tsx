import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Send, Sparkles, User, Terminal, ChevronDown, ChevronRight,
  Zap, Clock, Loader2, StopCircle, Github, Instagram,
  CreditCard, Plus, Lightbulb, Code,
  Palette, Monitor, Mic, Volume2, X,
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

export default function Home({ conversationId }: { conversationId?: string }) {
  const [location, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("meta/llama-3.1-70b-instruct");
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [streaming, setStreaming] = useState<StreamingState>({
    active: false, content: "", tokenCount: 0, startTime: 0, toolCalls: [],
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingPromptHandledRef = useRef<number | null>(null);

  const convId = conversationId ? parseInt(conversationId) : null;

  // Queries
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

  // Auto-scroll
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
    return (messageList || []).filter(m => m.role !== "system");
  }, [messageList]);

  // Streaming send via SSE
  const handleStreamingSend = useCallback(async (targetConvId: number, content: string) => {
    const controller = new AbortController();
    abortRef.current = controller;

    // Save user message first
    await addMessage.mutateAsync({
      conversationId: targetConvId,
      content,
      model: selectedModel,
    }).catch(() => {});

    // Build message history
    const allMsgs = await refetchMessages();
    const history = (allMsgs.data || []).map(m => ({
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
              setStreaming(prev => ({
                ...prev,
                content: fullContent,
                tokenCount,
              }));
            } else if (event.type === "tool_use") {
              const tool = JSON.parse(event.content);
              setStreaming(prev => ({
                ...prev,
                toolCalls: [...prev.toolCalls, { name: tool.name, args: JSON.stringify(tool.args) }],
              }));
            } else if (event.type === "tool_result") {
              setStreaming(prev => {
                const calls = [...prev.toolCalls];
                if (calls.length > 0) calls[calls.length - 1].result = event.content;
                return { ...prev, toolCalls: calls };
              });
            } else if (event.type === "done") {
              tokenCount = event.tokenCount || tokenCount;
            } else if (event.type === "error") {
              fullContent += `\n\n**Error:** ${event.content}`;
              setStreaming(prev => ({ ...prev, content: fullContent }));
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
        setStreaming(prev => ({
          ...prev,
          content: prev.content + `\n\n**Error:** ${errorMsg}`,
        }));
      }
    } finally {
      setStreaming(prev => ({ ...prev, active: false }));
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
    setExpandedTools(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)}GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)}MB`;
    return `${bytes}B`;
  };

  const elapsed = streaming.active ? ((Date.now() - streaming.startTime) / 1000) : 0;
  const liveTps = elapsed > 0 ? (streaming.tokenCount / elapsed).toFixed(1) : "0";

  const connectorButtons = [
    { icon: Github, onClick: () => setLocation("/connectors") },
    { icon: Instagram, onClick: () => setLocation("/research") },
    { icon: CreditCard, onClick: () => setLocation("/billing") },
  ];
  const quickActions = [
    { icon: Lightbulb, label: "Create slides", prompt: "Create a slide deck outline for my topic with a strong narrative arc." },
    { icon: Code, label: "Build website", prompt: "Plan and build a landing page for my product with sections, copy, and a launch checklist." },
    { icon: Monitor, label: "Develop desktop apps", prompt: "Help me plan and scaffold a desktop app with the core features and architecture." },
    { icon: Palette, label: "Design", prompt: "Generate a polished design direction and UI plan for this product idea." },
    { icon: Plus, label: "More", prompt: "Show me more things Forge can help me build and automate." },
  ];

  // Empty state - Manus-style home
  if (!convId) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto px-6 pb-16 pt-24">
          <div className="w-full max-w-[668px]">
            <h1 className="text-center font-serif text-[4.1rem] font-medium tracking-[-0.06em] text-foreground">
              What can I do for you?
            </h1>

            <div className="mt-10 overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_3px_18px_rgba(15,23,42,0.05)] manus-input-glow">
              <div className="p-4 pb-2">
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
                  placeholder="Assign a task or ask anything"
                  rows={4}
                  spellCheck={false}
                  autoFocus
                  className="relative z-10 min-h-[118px] w-full resize-none border-0 bg-transparent px-1 py-1 text-[16px] leading-7 text-foreground caret-foreground outline-none placeholder:text-muted-foreground"
                />
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent">
                      <Plus className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {connectorButtons.map((button, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={button.onClick}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-accent"
                        >
                          <button.icon className="h-4 w-4" />
                        </button>
                      ))}
                      <button type="button" onClick={() => setLocation("/scheduled")} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-accent">
                        <Monitor className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
                      <Mic className="h-4 w-4" />
                    </button>
                    <Button
                      type="button"
                      size="icon"
                      disabled={!input.trim() || !canSend}
                      onClick={handleSend}
                      className="h-8 w-8 rounded-full bg-accent text-muted-foreground shadow-none hover:bg-foreground hover:text-background"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#d9eafc] bg-[#eef6ff] px-4 py-2.5 text-sm text-[#54677d]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#4787e8]" />
                  <span>Your task on Forge Desktop consumes <span className="font-semibold">50% fewer credits</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className="font-medium text-[#2c7be5]">Download now</button>
                  <button type="button" className="text-[#73859b]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(action.prompt)}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground/80 shadow-[0_1px_2px_rgba(15,23,42,0.02)] hover:bg-accent"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>

            <div className="mx-auto mt-32 max-w-[500px] rounded-[18px] border border-border bg-[#f3f2ef] p-4 shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
              <div className="grid grid-cols-[1.25fr_0.75fr] gap-4">
                <div>
                  <h3 className="text-[1.15rem] font-semibold leading-6 tracking-[-0.03em] text-foreground">
                    Download Forge for Windows or macOS
                  </h3>
                  <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
                    Access local files and work seamlessly with your desktop.
                  </p>
                </div>
                <div className="rounded-[14px] border border-border bg-white p-3">
                  <div className="mb-2 flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                    <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                    <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  </div>
                  <div className="rounded-[10px] border border-border bg-background p-3">
                    <div className="font-serif text-sm tracking-[-0.03em] text-foreground">What can I do for you?</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/35" />
                <span className="h-2 w-2 rounded-full bg-border" />
                <span className="h-2 w-2 rounded-full bg-border" />
                <span className="h-2 w-2 rounded-full bg-border" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-sm font-medium truncate">
            {conversation?.title || "Chat"}
          </h2>
        </div>
        <div />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {displayMessages.map((msg) => {
              if (msg.role === "tool") {
                return (
                  <div key={msg.id} className="ml-11">
                    <button
                      onClick={() => toggleTool(msg.id)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                      <div className="mt-2 rounded-lg bg-accent/30 border border-border p-3 text-xs font-mono overflow-x-auto">
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
                    <div className="h-8 w-8 shrink-0 mt-0.5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border/30"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    )}

                  </div>

                  {msg.role === "user" && (
                    <div className="h-8 w-8 shrink-0 mt-0.5 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming response */}
            {streaming.active && (
              <>
                {streaming.toolCalls.map((tc, i) => (
                  <div key={`tc-${i}`} className="ml-11">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Terminal className="h-3 w-3 text-amber-500" />
                      <span className="font-medium">{tc.name}</span>
                      {tc.result ? (
                        <Badge className="text-[9px] h-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">done</Badge>
                      ) : (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                    </div>
                    {tc.result && (
                      <div className="mt-1 rounded-lg bg-accent/30 border border-border p-2 text-[11px] font-mono max-h-24 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-muted-foreground">{tc.result.slice(0, 500)}</pre>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl bg-card border border-border/30 px-4 py-2.5">
                    {streaming.content ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed">
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
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-card border border-border/30 px-4 py-3">
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

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0 bg-background/95 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 items-end"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 max-h-32 resize-none min-h-[44px] bg-card border-border text-sm"
              rows={1}
              disabled={streaming.active}
            />
            {streaming.active ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="shrink-0 h-[44px] w-[44px]"
                onClick={handleStop}
              >
                <StopCircle className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || !canSend}
                className="shrink-0 h-[44px] w-[44px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
          {!canSend && !streaming.active && (
            <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5">
              Add a valid NVIDIA API key to start chatting.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
