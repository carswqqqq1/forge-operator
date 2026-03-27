import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Send, Sparkles, User, Terminal, ChevronDown, ChevronRight,
  Cpu, Zap, Clock, Loader2, StopCircle, Github, Instagram,
  CreditCard, MessageCircle, Plus, Settings, Lightbulb, Code,
  Palette, Zap as ZapIcon,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";

type Provider = "ollama" | "claude";

interface StreamingState {
  active: boolean;
  content: string;
  tokenCount: number;
  startTime: number;
  toolCalls: Array<{ name: string; args: string; result?: string }>;
}

export default function Home({ conversationId }: { conversationId?: string }) {
  const [location, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("qwen3:8b");
  const [provider, setProvider] = useState<Provider>("ollama");
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [streaming, setStreaming] = useState<StreamingState>({
    active: false, content: "", tokenCount: 0, startTime: 0, toolCalls: [],
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const convId = conversationId ? parseInt(conversationId) : null;

  // Queries
  const { data: models } = trpc.ollama.models.useQuery();
  const { data: conversation } = trpc.conversations.get.useQuery(
    { id: convId! },
    { enabled: !!convId }
  );
  const { data: messageList, refetch: refetchMessages } = trpc.messages.list.useQuery(
    { conversationId: convId! },
    { enabled: !!convId, refetchInterval: false }
  );
  const { data: health } = trpc.ollama.health.useQuery();
  const { data: claudeStatus } = trpc.claude.status.useQuery(undefined, { refetchInterval: 10000 });
  const { data: claudeModels } = trpc.claude.models.useQuery();

  const createConversation = trpc.conversations.create.useMutation();
  const addMessage = trpc.messages.send.useMutation({ onSuccess: () => refetchMessages() });

  const isClaudeReady = claudeStatus?.connected && claudeStatus?.mode !== "none";
  const isOllamaReady = health?.ok;
  const canSend = provider === "ollama" ? isOllamaReady : isClaudeReady;

  // Set default model
  useEffect(() => {
    if (models && models.length > 0 && selectedModel === "qwen3:8b") {
      const hasGptOss = models.some(m => m.name === "qwen3:8b");
      if (hasGptOss) {
        setSelectedModel("qwen3:8b");
      } else {
        setSelectedModel(conversation?.model || models[0].name);
      }
    }
  }, [models, conversation]);

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
      model: provider === "ollama" ? selectedModel : claudeStatus?.model || "claude-sonnet-4-20250514",
    }).catch(() => {});

    // Build message history
    const allMsgs = await refetchMessages();
    const history = (allMsgs.data || []).map(m => ({
      role: m.role as string,
      content: m.content,
    }));

    setStreaming({ active: true, content: "", tokenCount: 0, startTime: Date.now(), toolCalls: [] });

    try {
      const endpoint = provider === "claude" ? "/api/claude/stream" : "/api/ollama/stream";
      const body: any = {
        messages: history,
        conversationId: targetConvId,
      };

      if (provider === "ollama") {
        body.model = selectedModel;
        body.systemPrompt = conversation?.systemPrompt || undefined;
      }

      const res = await fetch(endpoint, {
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
        if (errorMsg === "fetch failed" && provider === "ollama") {
          errorMsg = "Ollama is not running. Start it with: `ollama serve`";
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
  }, [provider, selectedModel, conversation, claudeStatus]);

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
        setLocation(`/chat/${newConv.id}`);
      } catch {
        return;
      }
    }

    handleStreamingSend(targetConvId, content);
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

  // Empty state - Manus-style home
  if (!convId) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-accent/5">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-2xl w-full space-y-8">
            {/* Hero */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                What can I do for you?
              </h1>
              <p className="text-base text-muted-foreground max-w-lg mx-auto">
                Powered by local {selectedModel} and your Claude subscription. Execute commands, manage files, browse the web, and more.
              </p>
            </div>

            {/* Ollama Status Warning */}
            {provider === "ollama" && !isOllamaReady && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                <p className="font-medium">Ollama is not running</p>
                <p className="text-xs text-orange-700 mt-1">Start it with: <code className="bg-orange-100 px-2 py-1 rounded">ollama serve</code></p>
              </div>
            )}

            {/* Provider Selector */}
            <div className="flex justify-center">
              <div className="flex rounded-lg border border-border bg-card p-1 shadow-sm">
                <button
                  onClick={() => setProvider("ollama")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    provider === "ollama"
                      ? "bg-orange-500/10 text-orange-600 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Cpu className="h-4 w-4" />
                  Local
                </button>
                <button
                  onClick={() => setProvider("claude")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                    provider === "claude"
                      ? "bg-violet-500/10 text-violet-600 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Zap className="h-4 w-4" />
                  Claude
                </button>
              </div>
            </div>

            {/* Connector Icons */}
            <div className="flex justify-center gap-3">
              {[
                { icon: Github, label: "GitHub", color: "text-slate-700" },
                { icon: Instagram, label: "Instagram", color: "text-pink-600" },
                { icon: CreditCard, label: "Stripe", color: "text-blue-600" },
                { icon: MessageCircle, label: "Telegram", color: "text-sky-500" },
                { icon: Plus, label: "Add connector", color: "text-muted-foreground" },
              ].map((item, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => item.label === "Add connector" && setLocation("/connectors")}
                      className={cn(
                        "h-10 w-10 rounded-lg border border-border hover:bg-accent transition-colors flex items-center justify-center",
                        item.label === "Add connector" ? "bg-accent" : "bg-card"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", item.color)} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">{item.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { icon: Lightbulb, label: "Create slides" },
                { icon: Code, label: "Build website" },
                { icon: Zap, label: "Desktop apps" },
                { icon: Palette, label: "Design" },
              ].map((action, i) => (
                <button
                  key={i}
                  className="px-3 py-1.5 rounded-full border border-border bg-card hover:bg-accent text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Bottom Customization Card */}
            <div className="mt-8 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Customize your AI agent</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    A distinct identity that grows with your business.
                  </p>
                  <button
                    onClick={() => setLocation("/settings")}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Connect Claude account →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background/95 backdrop-blur-sm shrink-0">
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
                placeholder="Assign a task or ask anything..."
                className="flex-1 max-h-32 resize-none min-h-[44px] bg-card border-border text-sm"
                rows={1}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || !canSend}
                className="shrink-0 h-[44px] w-[44px]"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {!canSend && (
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1.5">
                {provider === "ollama"
                  ? "Ollama is offline. Run `ollama serve` to start."
                  : "Claude not connected. Configure in Settings → Claude."
                }
              </p>
            )}
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
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-accent/20 p-0.5">
            <button
              onClick={() => setProvider("ollama")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                provider === "ollama"
                  ? "bg-orange-500/15 text-orange-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Cpu className="h-3 w-3" />
              Local
            </button>
            <button
              onClick={() => setProvider("claude")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all",
                provider === "claude"
                  ? "bg-violet-500/15 text-violet-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="h-3 w-3" />
              Claude
            </button>
          </div>
        </div>
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

                    {msg.role === "assistant" && (msg.tokenCount || msg.durationMs) && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20">
                        {msg.model && (
                          <Badge variant="outline" className="text-[9px] h-4">
                            {msg.model}
                          </Badge>
                        )}
                        {msg.tokensPerSecond && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5" />
                            {msg.tokensPerSecond} tok/s
                          </span>
                        )}
                        {msg.tokenCount && (
                          <span className="text-[10px] text-muted-foreground">
                            {msg.tokenCount} tokens
                          </span>
                        )}
                        {msg.durationMs && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {(msg.durationMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
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

                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/20">
                      <Badge variant="outline" className="text-[9px] h-4">
                        {provider === "claude" ? claudeStatus?.model : selectedModel}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5 text-amber-500" />
                        {liveTps} tok/s
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {streaming.tokenCount} tokens
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {elapsed.toFixed(1)}s
                      </span>
                    </div>
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
              placeholder={provider === "claude" ? "Ask Claude..." : "Ask anything..."}
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
              {provider === "ollama"
                ? "Ollama is offline. Run `ollama serve` to start."
                : "Claude not connected. Configure in Settings → Claude."
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
