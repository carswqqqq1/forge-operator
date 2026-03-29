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
  Plug,
  FolderPlus,
  Plus,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  Filter,
  Bell,
  SlidersHorizontal,
  Menu,
  Gem,
  Monitor,
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
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-3 pb-0">
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <div className="mr-auto flex items-center gap-2 px-1">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md">
                  <img src="/logo-light.png" alt="Forge Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-[1.65rem] font-semibold tracking-[-0.05em] text-foreground">forge</span>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[#f4f1eb]"
              >
                <Menu className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="mx-auto flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[#f4f1eb]"
              >
                <Menu className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 px-3">
          <div className="space-y-0.5 pt-3">
            <button
              onClick={() => setLocation("/")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive("/") ? "bg-[#f0ede7] text-foreground" : "text-foreground hover:bg-[#f4f1eb]"
              )}
            >
              <PenLine className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>New task</span>}
            </button>

            <button
              onClick={() => setLocation("/skills")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                isActive("/skills") ? "bg-[#f0ede7] text-foreground font-medium" : "text-muted-foreground hover:bg-[#f4f1eb] hover:text-foreground"
              )}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Agents</span>}
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                searchOpen ? "bg-[#f0ede7] text-foreground font-medium" : "text-muted-foreground hover:bg-[#f4f1eb] hover:text-foreground"
              )}
            >
              <Search className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Search</span>}
            </button>

            <button
              onClick={() => setLocation("/memory")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                isActive("/memory") ? "bg-[#f0ede7] text-foreground font-medium" : "text-muted-foreground hover:bg-[#f4f1eb] hover:text-foreground"
              )}
            >
              <Library className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Library</span>}
            </button>

            <button
              onClick={() => setLocation("/connectors")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                location.startsWith("/connectors")
                  ? "bg-[#f0ede7] text-foreground font-medium"
                  : "text-muted-foreground hover:bg-[#f4f1eb] hover:text-foreground"
              )}
            >
              <Plug className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Connectors</span>}
            </button>

            <button
              onClick={() => setLocation("/computer")}
              className={cn(
                "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors",
                isActive("/computer")
                  ? "bg-[#f0ede7] text-foreground font-medium"
                  : "text-muted-foreground hover:bg-[#f4f1eb] hover:text-foreground"
              )}
            >
              <Monitor className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Computer</span>}
            </button>
          </div>

          {!isCollapsed && (
            <>
              <div className="mt-6">
                <div className="mb-1 flex items-center justify-between px-2.5">
                  <span className="text-xs font-medium text-muted-foreground">Projects</span>
                  <button
                    onClick={() => setLocation("/connectors")}
                    className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[#f4f1eb]"
                  >
                    <Plus className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
                <button
                  onClick={() => setLocation("/connectors")}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-[#f4f1eb] hover:text-foreground"
                >
                  <FolderPlus className="h-4 w-4 shrink-0" />
                  <span>New project</span>
                </button>
              </div>

              <SidebarSeparator className="my-3" />

              <div>
                <div className="mb-1 flex items-center justify-between px-2.5">
                  <span className="text-xs font-medium text-muted-foreground">All tasks</span>
                  <button className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-[#f4f1eb]">
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
                            location === `/chat/${conv.id}` ? "bg-[#f0ede7] text-foreground" : "text-muted-foreground hover:bg-[#f4f1eb] hover:text-foreground"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          <span className="truncate text-left">{conv.title}</span>
                        </button>
                      ))
                    ) : (
                      <p className="px-2.5 py-3 text-xs text-muted-foreground/60 text-center">No tasks yet</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </SidebarContent>

        <SidebarFooter className="p-3">
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                {[
                  { icon: SlidersHorizontal, path: "/settings", label: "Settings" },
                  { icon: LayoutDashboard, path: "/connectors", label: "Connectors" },
                ].map((item) => (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setLocation(item.path)}
                        className={cn(
                          "h-8 flex items-center justify-center rounded-md transition-colors",
                          isActive(item.path) ? "bg-[#f0ede7] text-foreground" : "text-muted-foreground hover:bg-[#f4f1eb] hover:text-foreground"
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

      <SidebarInset className="bg-[#f6f5f2]">
        <div className="sticky top-0 z-40 flex h-[74px] items-center justify-between border-b border-[#ddd8cf] bg-[#f6f5f2]/95 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            {(isMobile || isCollapsed) && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#5f5953] transition-colors hover:bg-[#f4f1eb]"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex items-center gap-1.5 rounded-md px-1 py-1 text-[18px] font-medium tracking-[-0.03em] text-[#36322d] transition-colors hover:bg-[#f4f1eb]">
                  <span>{currentModel}</span>
                  <ChevronDown className="h-4 w-4 text-[#7a746c]" />
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
            <button type="button" className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#ddd8cf] bg-[#f8f7f4] text-[#5f5953] transition-colors hover:bg-[#f4f1eb]">
              <Bell className="h-5 w-5" />
              <span className="absolute right-[13px] top-[12px] h-2.5 w-2.5 rounded-full bg-[#ff7f96]" />
            </button>
            <button type="button" className="flex h-12 items-center gap-2 rounded-full border border-[#ddd8cf] bg-[#f8f7f4] px-4 text-[#36322d] transition-colors hover:bg-[#f4f1eb]">
              <Gem className="h-5 w-5 text-[#6d675f]" />
              <span className="text-[18px] font-medium">{credits}</span>
            </button>
            <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6ad3ef] text-[20px] font-medium text-white shadow-none">
              C
            </button>
          </div>
        </div>

        <main className="flex-1 h-[calc(100vh-74px)] overflow-hidden">{children}</main>
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
                <span className="rounded-md bg-[#f0ede7] px-2 py-0.5 text-xs text-muted-foreground">ESC</span>
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
                      "flex w-full items-start justify-between rounded-xl px-3 py-3 text-left hover:bg-[#f4f1eb]",
                      index === 0 && "bg-[#f0ede7]"
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
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
