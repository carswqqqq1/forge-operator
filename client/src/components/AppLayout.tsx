import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
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
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Filter,
  Bell,
  SlidersHorizontal,
  LayoutGrid,
  Monitor,
  Menu,
  Gem,
  Share2,
  Gift,
  Check,
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
const DEFAULT_WIDTH = 260;
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
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_WIDTH_KEY) : null;
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [selectedTier, setSelectedTier] = useState<"max" | "core" | "lite">("lite");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: conversations } = trpc.conversations.list.useQuery();
  const { data: usageState } = trpc.usage.state.useQuery(undefined, { refetchInterval: 5000 });
  const setTierMutation = trpc.usage.setTier.useMutation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    return location === path;
  };

  const currentModel = modelOptions.find((option) => option.id === selectedTier)?.label || "Forge 1.6 Lite";
  const credits = Math.max(0, Math.round(usageState?.credits ?? 851));

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
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-white">
        <SidebarHeader className="p-3 pb-0">
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <div className="mr-auto flex items-center gap-2 px-1">
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md">
                  <img src="/icon-only.png" alt="Forge Logo" className="h-full w-full object-contain" />
                </div>
                <span className="font-serif text-[1.5rem] font-semibold tracking-[-0.04em] text-[#1a1816]">forge</span>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className={cn(
                "h-7 w-7 shrink-0 rounded-md transition-colors hover:bg-[#efede8] flex items-center justify-center",
                isCollapsed && "mx-auto"
              )}
            >
              <Menu className="h-4 w-4 text-[#7a746c]" />
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 px-3">
          <div className="space-y-0.5 pt-3">
            {/* New task */}
            <button
              onClick={() => setLocation("/")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/") ? "bg-[#efede8] text-[#1a1816]" : "text-[#1a1816] hover:bg-[#efede8]"
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
                isActive("/skills") ? "bg-[#efede8] text-[#1a1816] font-medium" : "text-[#7a746c] hover:bg-[#efede8] hover:text-[#1a1816]"
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Agents</span>}
            </button>

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                searchOpen ? "bg-[#efede8] text-[#1a1816] font-medium" : "text-[#7a746c] hover:bg-[#efede8] hover:text-[#1a1816]"
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
                isActive("/memory") ? "bg-[#efede8] text-[#1a1816] font-medium" : "text-[#7a746c] hover:bg-[#efede8] hover:text-[#1a1816]"
              )}
            >
              <Library className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Library</span>}
            </button>
          </div>

          {!isCollapsed && (
            <>
              {/* Projects section */}
              <div className="mt-6">
                <div className="mb-1 flex items-center justify-between px-2.5">
                  <span className="text-xs font-medium text-[#7a746c]">Projects</span>
                  <button className="h-5 w-5 rounded transition-colors hover:bg-[#efede8] flex items-center justify-center">
                    <Plus className="h-3 w-3 text-[#7a746c]" />
                  </button>
                </div>
                <button
                  onClick={() => setLocation("/connectors")}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-[#7a746c] hover:bg-[#efede8] hover:text-[#1a1816] transition-colors"
                >
                  <FolderPlus className="h-4 w-4 shrink-0" />
                  <span>New project</span>
                </button>
              </div>

              <SidebarSeparator className="my-3 bg-[#e8e4dc]" />

              {/* All tasks section */}
              <div>
                <div className="mb-1 flex items-center justify-between px-2.5">
                  <span className="text-xs font-medium text-[#7a746c]">All tasks</span>
                  <button className="h-5 w-5 rounded transition-colors hover:bg-[#efede8] flex items-center justify-center">
                    <Filter className="h-3 w-3 text-[#7a746c]" />
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
                            location === `/chat/${conv.id}` ? "bg-[#efede8] text-[#1a1816]" : "text-[#7a746c] hover:bg-[#efede8]/60 hover:text-[#1a1816]"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          <span className="truncate text-left">{conv.title}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-2.5 py-3 text-xs text-[#7a746c]/60 text-center">No tasks yet</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="p-3">
          {!isCollapsed && (
            <div className="space-y-3">
              {/* Share referral banner */}
              <button className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-[#efede8]">
                <Gift className="h-5 w-5 shrink-0 text-[#7a746c]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#1a1816]">Share Forge with a friend</div>
                  <div className="text-xs text-[#7a746c]">Get 500 credits each</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#7a746c]" />
              </button>

              <SidebarSeparator className="bg-[#e8e4dc]" />

              {/* Bottom icon bar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1">
                  {[
                    { icon: SlidersHorizontal, path: "/settings", label: "Settings" },
                    { icon: LayoutGrid, path: "/connectors", label: "Apps" },
                    { icon: Monitor, path: "/dashboard", label: "Desktop" },
                  ].map((item) => (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setLocation(item.path)}
                          className={cn(
                            "h-8 w-8 flex items-center justify-center rounded-md transition-colors",
                            isActive(item.path) ? "bg-[#efede8] text-[#1a1816]" : "text-[#7a746c] hover:bg-[#efede8] hover:text-[#1a1816]"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">{item.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                <span className="text-[11px] text-[#7a746c]/60">from Forge</span>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-[#f6f5f2]">
        {/* Top header bar - matches Manus exactly */}
        <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-[#f6f5f2]/95 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            {(isMobile || isCollapsed) && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#7a746c] transition-colors hover:bg-[#efede8]"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            {/* Model selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[15px] font-medium tracking-[-0.02em] text-[#36322d] transition-colors hover:bg-[#efede8]">
                  <span>{currentModel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-[#7a746c]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[280px] rounded-2xl border-[#e8e4dc] bg-white p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                {modelOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className="flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 cursor-pointer focus:bg-[#efede8]"
                    onClick={() => {
                      const tier = option.id as "max" | "core" | "lite";
                      setSelectedTier(tier);
                      setTierMutation.mutate({ tier });
                    }}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-medium text-[#1a1816]">{option.label}</span>
                      {selectedTier === option.id && <Check className="h-4 w-4 text-[#1a1816]" />}
                    </div>
                    <span className="text-xs text-[#7a746c]">{option.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side: notification, credits, avatar */}
          <div className="flex items-center gap-2">
            <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#7a746c] transition-colors hover:bg-[#efede8]">
              <Bell className="h-[18px] w-[18px]" />
            </button>
            <button type="button" className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[#36322d] transition-colors hover:bg-[#efede8]">
              <Gem className="h-4 w-4 text-[#7a746c]" />
              <span className="text-sm font-medium">{credits}</span>
            </button>
            <button
              type="button"
              onClick={() => setLocation("/settings")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0ea5e9] text-sm font-semibold text-white shadow-none"
            >
              C
            </button>
          </div>
        </div>

        <main className="flex-1 h-[calc(100vh-56px)] overflow-hidden">{children}</main>
      </SidebarInset>

      {/* Search modal overlay - matches Manus docs search */}
      {searchOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/10 px-4 pt-[15vh] backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div
            className="w-full max-w-[580px] rounded-2xl border border-[#e8e4dc] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#e8e4dc] px-4 py-3">
              <Search className="h-4 w-4 text-[#7a746c]" />
              <input
                autoFocus
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search"
                className="flex-1 bg-transparent text-sm text-[#1a1816] outline-none placeholder:text-[#7a746c]"
              />
              <span className="rounded-md bg-[#efede8] px-2 py-0.5 text-xs text-[#7a746c]">ESC</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2">
              {[
                { title: "Does Forge use credits?", breadcrumb: "Billing > Credits", desc: "Yes. Tasks triggered via Forge consume credits based on complexity." },
                { title: "How credits work", breadcrumb: "Plans and Pricing > How Credits Work", desc: "The specific number of credits consumed depends on task complexity." },
                { title: "How does the credit system work?", breadcrumb: "Meeting minutes > Credits", desc: "Generation of notes will consume credits. If you run out..." },
                { title: "Only owner consumes credits", breadcrumb: "Forge Collab > Credits", desc: "Important: In collaboration mode, only the owner consumes credits." },
                { title: "How billing works", breadcrumb: "Usage and Pricing > How Billing Works", desc: "Forge uses two distinct systems for billing: Credit-Based System..." },
              ]
                .filter((item) => item.title.toLowerCase().includes(searchValue.toLowerCase() || ""))
                .map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition-colors hover:bg-[#efede8]",
                      index === 0 && !searchValue && "bg-[#efede8]/60"
                    )}
                  >
                    <span className="text-[11px] text-[#7a746c]">{item.breadcrumb}</span>
                    <span className="text-sm font-medium text-[#1a1816]">{item.title}</span>
                    <span className="text-xs text-[#7a746c] line-clamp-1">{item.desc}</span>
                  </button>
                ))}
              <div className="mt-2 border-t border-[#e8e4dc] pt-3 px-3">
                <span className="text-xs text-[#7a746c]">Ask AI assistant</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#7a746c]" />
                  <span className="text-sm text-[#36322d]">Can you tell me about credits?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
