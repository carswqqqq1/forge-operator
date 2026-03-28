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
  ChevronRight,
  Settings,
  LayoutGrid,
  Smartphone,
  MessageSquare,
  LayoutDashboard,
  ScrollText,
  Clock,
  BookOpen,
  Filter,
  Bell,
  Gem,
  Share2,
  SlidersHorizontal,
  Plug,
} from "lucide-react";
import { CSSProperties, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const SIDEBAR_WIDTH_KEY = "manus-sidebar-width";
const DEFAULT_WIDTH = 240;
const modelOptions = [
  {
    id: "max",
    label: "Forge 1.6 Max",
    description: "High-performance agent designed for complex tasks.",
  },
  {
    id: "core",
    label: "Forge 1.6",
    description: "Versatile agent capable of most tasks.",
  },
  {
    id: "lite",
    label: "Forge 1.6 Lite",
    description: "A lightweight agent for everyday tasks.",
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_WIDTH_KEY) : null;
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
  const [selectedTier, setSelectedTier] = useState<"max" | "core" | "lite">("max");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: conversations } = trpc.conversations.list.useQuery();
  const { data: usageState } = trpc.usage.state.useQuery(undefined, { refetchInterval: 5000 });
  const setTierMutation = trpc.usage.setTier.useMutation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    return location === path;
  };

  // Get current model name for header
  const currentModel = modelOptions.find((option) => option.id === selectedTier)?.label || "Forge 1.6 Max";

  useEffect(() => {
    if (usageState?.selectedTier) {
      setSelectedTier(usageState.selectedTier);
    }
  }, [usageState?.selectedTier]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        {/* Header */}
        <SidebarHeader className="p-3 pb-0">
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <div className="mr-auto flex items-center gap-2 px-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-md text-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="text-[1.65rem] font-semibold tracking-[-0.05em] text-foreground">forge</span>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="ml-auto h-7 w-7 flex items-center justify-center hover:bg-accent rounded-md transition-colors shrink-0"
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
                setLocation("/");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/")
                  ? "bg-accent text-foreground"
                  : "text-foreground hover:bg-accent"
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
              onClick={() => setSearchOpen(true)}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                searchOpen
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
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-3 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.02)] transition-colors hover:bg-accent/60"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">Share Forge with a friend</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Get 500 credits each</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Quick Nav Links */}
              <div className="grid grid-cols-3 gap-1">
                {[
                  { icon: SlidersHorizontal, path: "/settings", label: "Settings" },
                  { icon: LayoutDashboard, path: "/connectors", label: "Connectors" },
                  { icon: Share2, path: "/scheduled", label: "Desktop" },
                ].map((item) => (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                  <Plug className="h-3 w-3" />
                  <span>{usageState?.selectedTier ? `${usageState.selectedTier} tier active` : "Forge runtime ready"}</span>
                </div>
                <span className="text-[11px] text-muted-foreground/60">from Forge</span>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Top Header Bar */}
        <div className="h-14 border-b border-border/80 flex items-center justify-between px-4 bg-background/95 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {(isMobile || isCollapsed) && (
              <SidebarTrigger className="h-7 w-7 rounded-md" />
            )}
            {/* Model Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[1.05rem] font-semibold tracking-[-0.03em] hover:bg-accent transition-colors">
                  <span>{currentModel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[286px] rounded-2xl p-2 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
                {modelOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className="flex flex-col items-start gap-1 rounded-xl px-3 py-2.5"
                    onClick={() => {
                      const tier = option.id as "max" | "core" | "lite";
                      setSelectedTier(tier);
                      setTierMutation.mutate({ tier });
                    }}
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-sm font-medium text-foreground">{option.label}</span>
                      {selectedTier === option.id ? <span className="text-base">✓</span> : null}
                    </div>
                    <span className="text-xs leading-5 text-muted-foreground">{option.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-accent">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
            </button>
            <button
              type="button"
              onClick={() => setLocation("/billing")}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-accent"
            >
              <Gem className="h-4 w-4 text-muted-foreground" />
              <span>{Math.max(0, Math.round(usageState?.credits ?? 851))}</span>
            </button>
            <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/80 text-sm font-medium text-white">
              C
            </button>
          </div>
        </div>

        <main className="flex-1 h-[calc(100vh-48px)] overflow-hidden">{children}</main>
      </SidebarInset>
      {searchOpen ? (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/10 px-4 pt-16 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div
            className="w-full max-w-[590px] rounded-[22px] border border-border bg-card shadow-[0_30px_70px_rgba(15,23,42,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-border p-3">
              <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <span className="rounded-md bg-accent px-2 py-0.5 text-xs text-muted-foreground">ESC</span>
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-2">
              {[
                "Does Forge use credits?",
                "How credits work",
                "How does the credit system work for recording and generating notes?",
                "Only owner consumes credits",
                "Does using Nano Banana Pro consume more credits?",
                "How billing works",
              ]
                .filter((item) => item.toLowerCase().includes(searchValue.toLowerCase() || ""))
                .map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    className={cn(
                      "flex w-full items-start justify-between rounded-xl px-3 py-3 text-left hover:bg-accent",
                      index === 0 && "bg-accent/70"
                    )}
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{item}</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        Billing, usage, credits, and model consumption documentation.
                      </div>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              <div className="mt-2 rounded-xl px-3 py-3 text-left">
                <div className="text-xs text-muted-foreground">Ask AI assistant</div>
                <div className="mt-2 text-sm font-medium text-foreground">Can you tell me about credits?</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
