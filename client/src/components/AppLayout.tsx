import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  PenLine,
  Sparkles,
  Search,
  Library,
  FolderPlus,
  Plus,
  PanelLeft,
  ChevronDown,
  Settings,
  LayoutGrid,
  Smartphone,
  MessageSquare,
  LayoutDashboard,
  ScrollText,
  Zap,
  Link2,
  Clock,
  Brain,
  BookOpen,
  Filter,
} from "lucide-react";
import { CSSProperties, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const SIDEBAR_WIDTH_KEY = "manus-sidebar-width";
const DEFAULT_WIDTH = 240;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const { data: conversations } = trpc.conversations.list.useQuery();
  const { data: health } = trpc.ollama.health.useQuery(undefined, { refetchInterval: 30000 });
  const { data: claudeStatus } = trpc.claude.status.useQuery(undefined, { refetchInterval: 15000 });
  const { data: models } = trpc.ollama.models.useQuery();

  const createConversation = trpc.conversations.create.useMutation({
    onSuccess: (data) => setLocation(`/chat/${data.id}`),
  });

  const isActive = (path: string) => {
    if (path === "/" && (location === "/" || location.startsWith("/chat/"))) return true;
    return location === path;
  };

  // Get current model name for header
  const currentModel = models?.[0]?.name || "Local Agent";
  const isOllamaReady = health?.ok;
  const isClaudeReady = claudeStatus?.connected;

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        {/* Header */}
        <SidebarHeader className="p-3 pb-0">
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded-md transition-colors shrink-0"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded-md transition-colors mx-auto"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 px-3">
          {/* Top Actions */}
          <div className="space-y-0.5 pt-3">
            {/* New Task */}
            <button
              onClick={() => {
                createConversation.mutate({});
              }}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                "text-foreground hover:bg-accent"
              )}
            >
              <PenLine className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>New task</span>}
            </button>

            {/* Agents */}
            <button
              onClick={() => setLocation("/skills")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                isActive("/skills")
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span>Agents</span>
                  <span className="ml-auto text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">New</span>
                </>
              )}
            </button>

            {/* Search */}
            <button
              onClick={() => setLocation("/research")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                isActive("/research")
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Search className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Search</span>}
            </button>

            {/* Library */}
            <button
              onClick={() => setLocation("/memory")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                isActive("/memory")
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Library className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Library</span>}
            </button>
          </div>

          {!isCollapsed && (
            <>
              {/* Projects Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between px-2.5 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Projects</span>
                  <button
                    onClick={() => setLocation("/connectors")}
                    className="h-5 w-5 flex items-center justify-center hover:bg-accent rounded transition-colors"
                  >
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
                <button
                  onClick={() => setLocation("/connectors")}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <FolderPlus className="h-4 w-4 shrink-0" />
                  <span>New project</span>
                </button>
              </div>

              <SidebarSeparator className="my-3" />

              {/* All Tasks / Past Chats */}
              <div>
                <div className="flex items-center justify-between px-2.5 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">All tasks</span>
                  <button className="h-5 w-5 flex items-center justify-center hover:bg-accent rounded transition-colors">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
                <ScrollArea className="max-h-[calc(100vh-480px)]">
                  <div className="space-y-0.5">
                    {conversations && conversations.length > 0 ? (
                      conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setLocation(`/chat/${conv.id}`)}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group",
                            location === `/chat/${conv.id}`
                              ? "bg-accent text-foreground"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          <span className="truncate text-left">{conv.title}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-2.5 py-3 text-xs text-muted-foreground/60 text-center">
                        No tasks yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="p-3">
          {!isCollapsed && (
            <div className="space-y-2">
              {/* Quick Nav Links */}
              <div className="grid grid-cols-4 gap-1">
                {[
                  { icon: LayoutDashboard, path: "/dashboard", label: "Dashboard" },
                  { icon: ScrollText, path: "/logs", label: "Logs" },
                  { icon: Clock, path: "/scheduled", label: "Scheduled" },
                  { icon: BookOpen, path: "/prompts", label: "Prompts" },
                ].map((item) => (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setLocation(item.path)}
                        className={cn(
                          "h-8 flex items-center justify-center rounded-md transition-colors",
                          isActive(item.path)
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">{item.label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <SidebarSeparator />

              {/* Bottom Bar: Settings, Grid, Mobile */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setLocation("/settings")}
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
                          isActive("/settings")
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Settings</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setLocation("/connectors")}
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
                          isActive("/connectors")
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Connectors</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                        <Smartphone className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">Mobile App</TooltipContent>
                  </Tooltip>
                </div>

                {/* Status dots */}
                <div className="flex items-center gap-1.5 px-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        isOllamaReady ? "bg-emerald-500" : "bg-red-400"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Ollama {isOllamaReady ? "Online" : "Offline"}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        isClaudeReady ? "bg-violet-500" : "bg-zinc-300"
                      )} />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Claude {isClaudeReady ? "Connected" : "Not connected"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Meta branding */}
              <div className="text-center pt-1">
                <span className="text-[10px] text-muted-foreground/50">Local Manus Agent</span>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top Header Bar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-background/95 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {(isMobile || isCollapsed) && (
              <SidebarTrigger className="h-7 w-7 rounded-md" />
            )}
            {/* Model Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-sm font-medium hover:bg-accent px-2 py-1 rounded-md transition-colors">
                  <span>{currentModel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Ollama Models</div>
                {models?.map((m) => (
                  <DropdownMenuItem key={m.name} className="text-sm">
                    <span className="flex-1">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {m.size >= 1e9 ? `${(m.size / 1e9).toFixed(1)}GB` : `${(m.size / 1e6).toFixed(0)}MB`}
                    </span>
                  </DropdownMenuItem>
                )) || (
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    No models available
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Claude (Subscription)</div>
                <DropdownMenuItem
                  className="text-sm"
                  onClick={() => setLocation("/settings")}
                >
                  <span className="flex-1">
                    {isClaudeReady ? claudeStatus?.model || "Claude Sonnet" : "Connect Claude"}
                  </span>
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isClaudeReady ? "bg-violet-500" : "bg-zinc-300"
                  )} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side: status indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                isOllamaReady ? "bg-emerald-500" : "bg-red-400"
              )} />
              <span>Ollama</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                isClaudeReady ? "bg-violet-500" : "bg-zinc-300"
              )} />
              <span>Claude</span>
            </div>
          </div>
        </div>

        <main className="flex-1 h-[calc(100vh-48px)] overflow-hidden">{children}</main>
      </SidebarInset>
    </>
  );
}
