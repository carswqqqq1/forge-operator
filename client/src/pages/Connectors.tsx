import { trpc } from "@/lib/trpc"
import type { ComponentType } from "react"
import {
  Check,
  ChevronRight,
  CornerDownRight,
  KeyRound,
  Plus,
  SlidersHorizontal,
  Sparkles,
  X,
  AudioLines,
  Bot,
  PlugZap,
  Search,
  Database,
  Globe,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useLocation } from "wouter"
import { toast } from "sonner"
import { startConnectorAuth } from "@/lib/connector-auth"
import { GithubConnectorModal } from "@/components/github-connector-modal"

type Screen = "main" | "add" | "manage"
type Tab = "apps" | "api" | "mcp"

type AppDefinition = {
  key: string
  title: string
  type: string
  description: string
  mode: "toggle" | "connect"
  beta?: boolean
  icon: ComponentType<{ className?: string }>
  config?: Record<string, unknown>
}

type ApiDefinition = {
  key: string
  title: string
  description: string
  icon: any
}

function GithubBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.24c-3.34.73-4.04-1.41-4.04-1.41-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.72.08-.72 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.37 1.24-3.21-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.55 11.55 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.64.24 2.86.12 3.16.77.84 1.24 1.9 1.24 3.21 0 4.62-2.81 5.65-5.49 5.95.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .5Z"/></svg>
}

function ChromeBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 4c7.7 0 14.7 4.1 18.5 10.8H24c-3.6 0-6.8 2-8.5 5.1L9.2 9.1A20 20 0 0 1 24 4Z" />
      <path fill="#FBBC05" d="M42.5 14.8A20 20 0 0 1 24 44l9.3-16.1c1.8-3.1 1.8-7.1 0-10.2l-4.1-7h13.3Z" />
      <path fill="#34A853" d="M24 44A20 20 0 0 1 9.2 9.1l9.3 16.1c1.8 3.1 5.1 5.1 8.7 5.1h8.1L24 44Z" />
      <circle cx="24" cy="24" r="8.7" fill="#4285F4" />
      <circle cx="24" cy="24" r="4.2" fill="#D2E3FC" />
    </svg>
  )
}

function GmailBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M6 14.3v23c0 2.2 1.8 4 4 4h6.1V20.7L24 27l7.9-6.3v20.6H38c2.2 0 4-1.8 4-4v-23l-18 13.4L6 14.3Z" />
      <path fill="#4285F4" d="M6 14.3v23c0 2.2 1.8 4 4 4h2.8V19.2L6 14.3Z" />
      <path fill="#34A853" d="M35.2 41.3H38c2.2 0 4-1.8 4-4v-23l-6.8 4.9v22.1Z" />
      <path fill="#FBBC04" d="M42 14.3V11c0-3.1-3.5-4.8-5.9-2.9L24 17 11.9 8.1C9.5 6.2 6 7.9 6 11v3.3L24 27.7 42 14.3Z" />
    </svg>
  )
}

function GoogleCalendarBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="6" y="8" width="36" height="34" rx="4" fill="#fff" />
      <path fill="#1A73E8" d="M38 8H10a4 4 0 0 0-4 4v6h36v-6a4 4 0 0 0-4-4Z" />
      <path fill="#34A853" d="M6 18h36v20a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V18Z" />
      <path fill="#FBBC04" d="M36 18h6v20a4 4 0 0 1-4 4h-2V18Z" />
      <path fill="#EA4335" d="M6 18h6v24h-2a4 4 0 0 1-4-4V18Z" />
      <rect x="13" y="18" width="23" height="21" fill="#fff" />
      <text x="24.5" y="33.5" textAnchor="middle" fontSize="18" fontWeight="700" fill="#4285F4" fontFamily="Arial, sans-serif">31</text>
    </svg>
  )
}

function GoogleDriveBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#0F9D58" d="M18.4 8 6 29.3l6.1 10.7L24.5 18.7 18.4 8Z" />
      <path fill="#4285F4" d="M24.5 18.7 12.1 40h23.8l6.1-10.7H24.5Z" />
      <path fill="#F4B400" d="M18.4 8h12.3L42 29.3H29.8L18.4 8Z" />
    </svg>
  )
}

function InstagramBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F58529" />
          <stop offset="0.35" stopColor="#FEDA77" />
          <stop offset="0.55" stopColor="#DD2A7B" />
          <stop offset="0.75" stopColor="#8134AF" />
          <stop offset="1" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="11" fill="url(#ig-grad)" />
      <rect x="12.5" y="12.5" width="23" height="23" rx="7" fill="none" stroke="#fff" strokeWidth="3.5" />
      <circle cx="24" cy="24" r="5.7" fill="none" stroke="#fff" strokeWidth="3.5" />
      <circle cx="33.2" cy="14.8" r="2.3" fill="#fff" />
    </svg>
  )
}

function StripeBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="6" y="6" width="36" height="36" rx="6" fill="#635BFF" />
      <path fill="#fff" d="M26.7 18.6c-2.1 0-3.4 1.1-3.4 2.8 0 3.6 5.3 3 5.3 5 0 .7-.6 1.1-1.8 1.1-1.3 0-2.9-.4-4.2-1.1v3.5c1.2.5 2.6.8 4.3.8 2.8 0 4.6-1.4 4.6-3.6 0-3.8-5.3-3.1-5.3-5 0-.6.5-1 1.5-1 1.1 0 2.4.3 3.7.9v-3.4a11.4 11.4 0 0 0-3.7-.6ZM18.1 16.2c-1.4 0-2.4.4-3 .8v13.4h4V26c.5.2 1.1.3 1.8.3 2.3 0 4.4-1.9 4.4-5.4 0-3-1.8-4.7-4.2-4.7Zm.9 6.9c-.4 0-.7 0-.9-.2v-3.5c.2-.2.6-.3 1-.3 1 0 1.8 1.1 1.8 2.2 0 1.2-.8 1.8-1.9 1.8Z" />
    </svg>
  )
}

function VercelBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#000" d="M24 9 8.5 36h31L24 9Z" />
    </svg>
  )
}

function MetaBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#1877F2" d="M8 28.5c0-8 5.7-14 10.8-14 4 0 6.2 3.1 9 8.3 2-4 3.9-6.4 6.6-6.4 3.6 0 5.6 3.8 5.6 8.4 0 4.5-2 8.7-5.7 8.7-2.8 0-4.6-2.4-7.5-7.4-2.7 5.3-5.2 8.5-8.5 8.5C12.3 34.6 8 32.5 8 28.5Zm6 0c0 1.8 1.3 2.8 2.7 2.8 2.1 0 4.3-2.5 7-7.6-2.5-4.4-4-6.1-5.8-6.1-2 0-3.9 2.7-3.9 6.9Zm17.2-2.2c2 3.7 3.4 5 4.7 5 1.3 0 2.3-1.1 2.3-3.2 0-3.3-1.1-6.1-2.7-6.1-1.3 0-2.5 1.4-4.3 4.3Z" />
    </svg>
  )
}

function OutlookMailBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#0A5CBD" d="M20 10h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H20V10Z" />
      <path fill="#1B88F4" d="M9 14.3 20 12v24L9 33.7V14.3Z" />
      <path fill="#50B0FF" d="M20 18h23v2.2L31.8 27 20 18Z" />
      <path fill="#0F6CBD" d="M20 18v20h20a3 3 0 0 0 3-3V20.2L31.8 27 20 18Z" />
      <circle cx="14.5" cy="24" r="5.1" fill="#fff" />
      <circle cx="14.5" cy="24" r="2.6" fill="#0A5CBD" />
    </svg>
  )
}

function OutlookCalendarBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="7" y="9" width="34" height="30" rx="6" fill="#0078D4" />
      <rect x="7" y="16" width="34" height="23" rx="0" fill="#36A3FF" />
      <rect x="12" y="21" width="6" height="6" rx="1.5" fill="#fff" opacity=".9" />
      <rect x="21" y="21" width="6" height="6" rx="1.5" fill="#fff" opacity=".9" />
      <rect x="30" y="21" width="6" height="6" rx="1.5" fill="#fff" opacity=".9" />
      <rect x="12" y="30" width="6" height="6" rx="1.5" fill="#fff" opacity=".9" />
      <rect x="21" y="30" width="6" height="6" rx="1.5" fill="#fff" opacity=".9" />
      <rect x="30" y="30" width="6" height="6" rx="1.5" fill="#fff" opacity=".9" />
    </svg>
  )
}

const appDefinitions: AppDefinition[] = [
  {
    key: "github",
    title: "GitHub",
    type: "github",
    description: "Manage repositories, track code changes, and collaborate on team projects",
    mode: "toggle",
    icon: GithubBrandIcon,
    config: { scopes: ["repo", "read:user", "read:org"] },
  },
  {
    key: "gmail",
    title: "Gmail",
    type: "gmail",
    description: "Draft replies, search your inbox, and summarize email threads instantly",
    mode: "toggle",
    icon: GmailBrandIcon,
    config: { scopes: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"] },
  },
  {
    key: "google-drive",
    title: "Google Drive",
    type: "google_drive",
    description: "Access your files, search instantly, and let Forge help you manage documents",
    mode: "toggle",
    icon: GoogleDriveBrandIcon,
    config: {
      scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/documents.readonly",
      ],
    },
  },
]

const customApis: ApiDefinition[] = []

function PillToggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-[42px] w-[82px] rounded-full transition-colors ${checked ? "bg-[#0a84ff]" : "bg-[#c8c8c8]"}`}
    >
      <span
        className={`absolute top-[3px] h-9 w-9 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] transition-all ${checked ? "left-[40px]" : "left-[3px]"}`}
      />
    </button>
  )
}

function BetaBadge() {
  return (
    <span className="rounded-full border border-[#d4d1cb] px-3 py-1 text-[14px] leading-none text-[#969089]">
      Beta
    </span>
  )
}

function AppIconTile({ icon: Icon }: { icon: any }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-transparent text-[#2f2b27]">
      <Icon className="h-6 w-6" />
    </div>
  )
}

function StackedConnectorIcons() {
  return (
    <div className="flex items-center">
      <div className="-mr-2 flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e0d9] bg-[#f7f6f3]"><OutlookMailBrandIcon className="h-7 w-7" /></div>
      <div className="-mr-2 flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e0d9] bg-[#f7f6f3]"><div className="flex h-7 w-7 items-center justify-center rounded-sm border border-[#1a1a1a] text-[10px] font-bold text-[#111]">N</div></div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e4e0d9] bg-[#f7f6f3] text-[20px] text-[#8c867f]">+67</div>
    </div>
  )
}

function Row({
  app,
  connected,
  onToggle,
  onConnect,
}: {
  app: AppDefinition
  connected: boolean
  onToggle: () => void
  onConnect: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <AppIconTile icon={app.icon} />
        <div className="min-w-0 flex items-center gap-2 text-[18px] font-medium tracking-[-0.02em] text-[#2f2b27]">
          <span className="truncate">{app.title}</span>
          {app.beta ? <BetaBadge /> : null}
        </div>
      </div>
      {app.mode === "toggle" ? (
        <PillToggle checked={connected} onClick={onToggle} />
      ) : (
        <button type="button" onClick={onConnect} className="text-[18px] font-normal text-[#857f78]">
          Connect
        </button>
      )}
    </div>
  )
}

export default function Connectors() {
  const [location, setLocation] = useLocation()
  const { data: connectors, refetch } = trpc.connectors.list.useQuery()
  const [githubToken, setGithubToken] = useState("")
  const [githubTokenLoading, setGithubTokenLoading] = useState(false)

  const [screen, setScreen] = useState<Screen>("main")
  const [tab, setTab] = useState<Tab>("apps")
  const [githubModalOpen, setGithubModalOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "")
    if (params.get("connector") === "github") {
      setGithubModalOpen(true)
    }
  }, [location])

  const connectorsByType = useMemo(() => {
    const map = new Map<string, any>()
    ;(connectors || []).forEach((connector: any) => {
      if (!map.has(connector.type)) map.set(connector.type, connector)
    })
    return map
  }, [connectors])

  const isConnected = (type: string) => connectorsByType.has(type)

  const connectGithubToken = async () => {
    const token = githubToken.trim()
    if (!token) {
      toast.error("Paste a GitHub token first")
      return
    }

    try {
      setGithubTokenLoading(true)
      const response = await fetch("/api/connectors/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to save GitHub token")
      }
      await refetch()
      setGithubToken("")
      toast.success("GitHub token connected")
    } catch (error) {
      console.error("[Connectors] GitHub token connection failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to connect GitHub token")
    } finally {
      setGithubTokenLoading(false)
    }
  }

  const connectGithubOAuth = async () => {
    const response = await fetch("/api/connectors/github/auth", { credentials: "include" })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error || "Failed to initiate GitHub authentication")
    }

    const data = await response.json()
    await startConnectorAuth(data.authUrl, "github")
    await refetch()
    toast.success("GitHub connected")
  }

  const disconnectGithub = async () => {
    try {
      const response = await fetch("/api/connectors/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ service: "github" }),
      })
      if (!response.ok) throw new Error("Failed to disconnect GitHub")
      await refetch()
      toast.success("GitHub disconnected")
    } catch (error) {
      console.error("[Connectors] GitHub disconnect failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to disconnect GitHub")
    }
  }

  const handleAuth = async (app: AppDefinition) => {
    if (app.type === "github") {
      setGithubModalOpen(true)
      return
    }
    const alreadyConnected = isConnected(app.type)
    if (alreadyConnected) {
      try {
        const response = await fetch("/api/connectors/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ service: app.type }),
        })
        if (!response.ok) throw new Error("Failed to disconnect")
        await refetch()
        toast.success(`${app.title} disconnected`)
        return
      } catch (error) {
        console.error("[Connectors] Disconnect failed:", error)
        toast.error(`Failed to disconnect ${app.title}`)
        return
      }
    }

    try {
      let authEndpoint = ""
      authEndpoint = `/api/connectors/google/auth?service=${app.type === "google_drive" ? "drive" : "gmail"}`

      const response = await fetch(authEndpoint, { credentials: "include" })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to initiate authentication")
      }

      const data = await response.json()
      await startConnectorAuth(data.authUrl, app.key)
      await refetch()
      toast.success(`${app.title} connected`)
    } catch (error) {
      console.error("[Connectors] Connection failed:", error)
      toast.error(`Failed to connect ${app.title}`)
    }
  }

  const toggleApp = (app: AppDefinition) => void handleAuth(app)

  const closeOverlay = () => setLocation("/")

  const mainToggleApps: AppDefinition[] = appDefinitions
  const mainConnectApps: AppDefinition[] = []

  const MainSheet = (
    <div className="mx-auto w-full max-w-[860px] rounded-t-[34px] bg-[#f7f6f3] pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:rounded-[34px]">
      <div className="mx-auto mb-5 h-2 w-[102px] rounded-full bg-[#d3d1cb] md:hidden" />
      <div className="px-6 pb-4 text-[28px] font-semibold tracking-[-0.03em] text-[#3b3632]">Connectors</div>

      <div className="mx-4 overflow-hidden rounded-[28px] border border-[#ece8e1] bg-[#f7f6f3]">
        <div className="border-b border-[#e8e4dc] px-5 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-[#8a847c]">GitHub access</div>
              <div className="space-y-1">
                <div className="text-[18px] font-semibold tracking-[-0.02em] text-[#2f2b27]">Add your own GitHub token</div>
                <p className="max-w-2xl text-[13px] leading-6 text-[#746e66]">
                  Paste a personal access token if you want Forge to read repositories immediately, or use the authorize button below.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGithubModalOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#111111] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1f1f1f]"
            >
              <GithubBrandIcon className="h-4 w-4" />
              {isConnected("github") ? "Manage GitHub" : "Authorize GitHub"}
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              type="password"
              value={githubToken}
              onChange={(event) => setGithubToken(event.target.value)}
              placeholder="ghp_..."
              className="h-11 flex-1 rounded-full border border-[#ddd8cf] bg-white px-4 text-[14px] text-[#2f2b27] outline-none transition-colors placeholder:text-[#a09a91] focus:border-[#c9c2b8]"
            />
            <button
              type="button"
            onClick={() => void connectGithubToken()}
            disabled={githubTokenLoading}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#f3f0ea] px-5 text-[13px] font-medium text-[#3b3632] transition-colors hover:bg-[#ebe7df] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {githubTokenLoading ? "Saving..." : "Connect token"}
            </button>
          </div>
          <div className="mt-3 text-[12px] leading-6 text-[#7a746c]">
            Forge validates the token first, then saves it for repo access inside tasks.
          </div>
        </div>
        <div className="max-h-[460px] overflow-y-auto">
          {mainToggleApps.map((app, index) => (
            <div key={app.key} className={index === mainToggleApps.length - 1 && mainConnectApps.length === 0 ? "" : "border-b border-[#e8e4dc]"}>
              <Row app={app} connected={isConnected(app.type)} onToggle={() => toggleApp(app)} onConnect={() => toggleApp(app)} />
            </div>
          ))}
          {mainConnectApps.map((app, index) => (
            <div key={app.key} className={index === mainConnectApps.length - 1 ? "" : "border-b border-[#e8e4dc]"}>
              <Row app={app} connected={false} onToggle={() => toggleApp(app)} onConnect={() => toggleApp(app)} />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 mt-3 overflow-hidden rounded-[24px] border border-[#ece8e1] bg-[#f7f6f3]">
        <button
          type="button"
          onClick={() => {
            setScreen("add")
            setTab("apps")
          }}
          className="flex w-full items-center justify-between px-6 py-5 text-left"
        >
          <div className="flex items-center gap-4 text-[20px] tracking-[-0.02em] text-[#2f2b27]">
            <Plus className="h-6 w-6" />
            <span>Add connectors</span>
          </div>
          <div className="flex items-center gap-5">
            <StackedConnectorIcons />
            <ChevronRight className="h-8 w-8 text-[#8a847c]" />
          </div>
        </button>
        <div className="h-px bg-[#e8e4dc]" />
        <button
          type="button"
          onClick={() => setScreen("manage")}
          className="flex w-full items-center justify-between px-6 py-5 text-left"
        >
          <div className="flex items-center gap-4 text-[20px] tracking-[-0.02em] text-[#2f2b27]">
            <SlidersHorizontal className="h-6 w-6" />
            <span>Manage connectors</span>
          </div>
          <ChevronRight className="h-6 w-6 text-[#8a847c]" />
        </button>
      </div>

      <GithubConnectorModal
        open={githubModalOpen}
        connected={isConnected("github")}
        onOpenChange={setGithubModalOpen}
        onConnect={connectGithubOAuth}
        onDisconnect={disconnectGithub}
        onConnected={async () => {
          await refetch();
        }}
      />
    </div>
  )

  const AddAppsView = (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-3 pb-3">
        {appDefinitions.map((app) => {
          const connected = isConnected(app.type)
          return (
            <button
              key={app.key}
              type="button"
              onClick={() => void handleAuth(app)}
              className="flex w-full items-center gap-4 rounded-[22px] bg-[#f4f3f0] px-4 py-4 text-left transition-colors hover:bg-[#efede8]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#e4e0d9] bg-white">
                <app.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[16px] font-semibold leading-6 text-[#2f2b27]">
                  <span>{app.title}</span>
                  {app.beta ? <BetaBadge /> : null}
                </div>
                <div className="mt-1 text-[13px] leading-6 text-[#7a746c]">{app.description}</div>
              </div>
              <div className="pt-2 text-[#5cb95c]">{connected ? <Check className="h-7 w-7" /> : null}</div>
            </button>
          )
        })}
      </div>
    </div>
  )

  const AddApiView = (
    <div className="max-h-[70vh] overflow-y-auto pr-1">
      <div className="space-y-3 pb-3">
        <div className="flex items-start gap-3 rounded-[18px] bg-[#efeeeb] px-4 py-4 text-[14px] leading-6 text-[#69635c]">
          <KeyRound className="mt-1 h-5 w-5 shrink-0 text-[#7b756e]" />
          <span>Connect Manus to any third-party service using your own API keys.</span>
        </div>
        {customApis.map((item) => (
          <button key={item.key} type="button" onClick={() => toast.message(`${item.title} custom API UI added`)} className="flex w-full items-start gap-4 rounded-[22px] bg-[#f4f3f0] px-4 py-4 text-left transition-colors hover:bg-[#efede8]">
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#e4e0d9] bg-white"><item.icon className="h-5 w-5 text-[#2f2b27]" /></div>
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold leading-6 text-[#2f2b27]">{item.title}</div>
              <div className="mt-1 text-[13px] leading-6 text-[#7a746c]">{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )

  const AddMcpView = (
      <div className="flex min-h-[42vh] flex-col items-center justify-center px-4 text-center">
        <PlugZap className="h-10 w-10 text-[#9a948d]" />
        <div className="mt-6 text-[18px] font-semibold text-[#6a645d]">Not supported on mobile</div>
        <div className="mt-2 max-w-[260px] text-[14px] leading-6 text-[#9a948d]">Add a custom MCP on the desktop version.</div>
      </div>
  )

  const AddSheet = (
    <div className="mx-auto w-full max-w-[860px] rounded-t-[34px] bg-[#f7f6f3] px-4 pb-4 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:rounded-[34px] md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setScreen("main")} className="flex h-11 w-11 items-center justify-center rounded-full text-[#3b3632] hover:bg-[#efede8]"><X className="h-7 w-7" /></button>
        <div className="text-[18px] font-semibold text-[#3b3632]">Add connectors</div>
        <div className="h-11 w-11" />
      </div>
      <div className="mb-5 flex gap-3">
        {[{ key: "apps", label: "Apps" }, { key: "api", label: "Custom API" }, { key: "mcp", label: "Custom MCP" }].map((item) => (
          <button key={item.key} type="button" onClick={() => setTab(item.key as Tab)} className={`rounded-full border px-5 py-2.5 text-[15px] font-semibold transition-colors ${tab === item.key ? "border-black bg-black text-white" : "border-[#ddd8cf] bg-transparent text-[#99938b]"}`}>{item.label}</button>
        ))}
      </div>
      {tab === "apps" ? AddAppsView : null}
      {tab === "api" ? AddApiView : null}
      {tab === "mcp" ? AddMcpView : null}
    </div>
  )

  const ManageSheet = (
    <div className="mx-auto w-full max-w-[860px] rounded-t-[34px] bg-[#f7f6f3] px-4 pb-4 pt-5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] md:rounded-[34px] md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setScreen("main")} className="flex h-11 w-11 items-center justify-center rounded-full text-[#3b3632] hover:bg-[#efede8]"><X className="h-7 w-7" /></button>
        <div className="text-[18px] font-semibold text-[#3b3632]">Connectors</div>
        <button type="button" onClick={() => { setScreen("add"); setTab("apps") }} className="flex h-11 w-11 items-center justify-center rounded-full text-[#3b3632] hover:bg-[#efede8]"><Plus className="h-7 w-7" /></button>
      </div>
      <div className="max-h-[72vh] overflow-y-auto pr-1">
        <div className="space-y-4 pb-4">
          {appDefinitions.map((app) => (
            <button key={app.key} type="button" onClick={() => handleAuth(app)} className="flex w-full items-center gap-4 rounded-[22px] bg-[#f4f3f0] px-4 py-4 text-left transition-colors hover:bg-[#efede8]">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#e4e0d9] bg-white"><app.icon className="h-6 w-6" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[16px] font-semibold leading-6 text-[#2f2b27]"><span>{app.title}</span>{app.beta ? <BetaBadge /> : null}</div>
                <div className="mt-1 text-[13px] leading-6 text-[#7a746c]">{app.description}</div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#8a847c]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[1px]" onClick={closeOverlay}>
      <div className="flex h-full items-end justify-center px-0 pb-0 md:items-center md:px-6 md:pb-6">
        <div className="w-full max-w-[1100px]" onClick={(e) => e.stopPropagation()}>
          {screen === "main" ? MainSheet : null}
          {screen === "add" ? AddSheet : null}
          {screen === "manage" ? ManageSheet : null}
        </div>
      </div>
    </div>
  )
}
