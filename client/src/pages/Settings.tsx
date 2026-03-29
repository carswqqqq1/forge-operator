import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Settings as SettingsIcon, Cpu, HardDrive, RefreshCw,
  Globe, Key, Monitor, Unplug, Zap, Shield, Chrome, Cookie,
  Eye, EyeOff, CheckCircle2, XCircle, Loader2, Plug, ChevronRight,
  User, CreditCard, Calendar, Mail, Database, Palette, Puzzle, Link2, ExternalLink
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ConnectorsSettings from "./ConnectorsSettings";

type SettingsTab = "account" | "settings" | "usage" | "billing" | "scheduled" | "mail" | "data" | "browser" | "personalization" | "skills" | "connectors" | "integrations";

export default function Settings() {
  const { data: claudeStatus, refetch: refetchClaude } = trpc.claude.status.useQuery(undefined, { refetchInterval: 5000 });
  const { data: claudeModels } = trpc.claude.models.useQuery();

  const configureCookie = trpc.claude.configureCookie.useMutation({
    onSuccess: () => { refetchClaude(); toast.success("Claude session configured!"); },
    onError: (e) => toast.error(e.message),
  });
  const launchBrowser = trpc.claude.launchBrowser.useMutation({
    onSuccess: (data) => {
      refetchClaude();
      if (data.success && !data.error) toast.success("Browser launched and logged in!");
      else if (data.error) toast.info(data.error);
      else toast.error("Failed to launch browser");
    },
    onError: (e) => toast.error(e.message),
  });
  const closeBrowser = trpc.claude.closeBrowser.useMutation({
    onSuccess: () => { refetchClaude(); toast.success("Browser closed"); },
  });
  const setClaudeModel = trpc.claude.setModel.useMutation({
    onSuccess: () => { refetchClaude(); toast.success("Model updated"); },
  });
  const disconnectClaude = trpc.claude.disconnect.useMutation({
    onSuccess: () => { refetchClaude(); toast.success("Disconnected from Claude"); },
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("settings");
  const [sessionKey, setSessionKey] = useState("");
  const [orgId, setOrgId] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [chromePath, setChromePath] = useState("");
  const [userDataDir, setUserDataDir] = useState("");
  const [headless, setHeadless] = useState(false);
  const [inferenceTab, setInferenceTab] = useState<"cookie" | "browser">("cookie");

  const isClaudeConnected = claudeStatus?.connected;
  const claudeMode = claudeStatus?.mode || "none";

  const menuItems: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "settings", label: "Settings", icon: SettingsIcon },
    { id: "connectors", label: "Connectors", icon: Link2 },
    { id: "browser", label: "Cloud browser", icon: Chrome },
    { id: "personalization", label: "Personalization", icon: Palette },
    { id: "skills", label: "Skills", icon: Puzzle },
    { id: "integrations", label: "Integrations", icon: Plug },
  ];

  return (
    <div className="flex h-full bg-[#f6f5f2]">
      {/* Left sidebar menu */}
      <div className="w-[220px] shrink-0 border-r border-[#e8e4dc] bg-[#faf9f6] p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0ea5e9] text-sm font-semibold text-white">C</div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-[#1a1816]">Carson Wesolo...</div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-[#22c55e]" />
              <span className="text-[11px] text-[#7a746c]">Online</span>
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                activeTab === item.id
                  ? "bg-[#efede8] font-medium text-[#1a1816]"
                  : "text-[#7a746c] hover:bg-[#f0eeea] hover:text-[#36322d]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <a href="#" className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#7a746c] transition-colors hover:text-[#36322d]">
            Get help <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-[600px]">

          {/* Account tab */}
          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Profile</h2>
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#e8e4dc] bg-white p-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0ea5e9] text-2xl font-semibold text-white">C</div>
                <div className="w-full space-y-4">
                  <div>
                    <Label className="text-[12px] text-[#7a746c]">Name</Label>
                    <input defaultValue="Carson Wesolowski" className="mt-1 w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 text-[14px] text-[#1a1816] outline-none focus:border-[#7a746c]" />
                  </div>
                  <div>
                    <Label className="text-[12px] text-[#7a746c]">Email</Label>
                    <div className="mt-1 rounded-xl border border-[#e8e4dc] bg-[#faf9f6] px-4 py-2.5 text-[14px] text-[#7a746c]">contact@arroyomarketing.com</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-red-200 bg-white p-5">
                <h3 className="text-[14px] font-semibold text-red-600">Delete account</h3>
                <p className="mt-1 text-[13px] text-[#7a746c]">Permanently delete your account and all data.</p>
                <button className="mt-3 rounded-xl border border-red-300 px-4 py-2 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50">Delete account</button>
              </div>
            </div>
          )}

          {/* Settings tab - Inference */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Settings</h2>

              {/* Claude status */}
              <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f0ea]">
                      <Zap className="h-5 w-5 text-[#7a746c]" />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold text-[#1a1816]">Claude</div>
                      <div className="text-[12px] text-[#7a746c]">
                        {claudeMode === "cookie" ? "Cookie relay" : claudeMode === "browser" ? "Browser automation" : "Not configured"}
                      </div>
                    </div>
                  </div>
                  {isClaudeConnected ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-[#dcfce7] px-2.5 py-1 text-[12px] font-medium text-[#16a34a]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                    </span>
                  ) : (
                    <span className="rounded-lg bg-[#faf9f6] px-2.5 py-1 text-[12px] text-[#7a746c]">Not connected</span>
                  )}
                </div>
              </div>

              {/* Claude model selector */}
              <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[14px] font-semibold text-[#1a1816]">Claude Subscription</h3>
                  {isClaudeConnected && (
                    <button onClick={() => disconnectClaude.mutate()} className="text-[12px] text-red-500 hover:text-red-600 transition-colors">
                      Disconnect
                    </button>
                  )}
                </div>
                <p className="text-[13px] text-[#7a746c] mb-4">Use your existing Claude subscription directly — no API costs.</p>

                <div className="mb-4">
                  <Label className="text-[12px] text-[#7a746c]">Claude Model</Label>
                  <Select value={claudeStatus?.model || "claude-sonnet-4-20250514"} onValueChange={(v) => setClaudeModel.mutate({ model: v })}>
                    <SelectTrigger className="mt-1 h-10 rounded-xl border-[#e8e4dc] bg-white text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {claudeModels?.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-[13px]">
                          {m.name} <span className="ml-2 text-[11px] text-[#7a746c]">{m.tier}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Connection method tabs */}
                <div className="flex gap-1 rounded-xl bg-[#f0eeea] p-1 mb-4">
                  <button onClick={() => setInferenceTab("cookie")} className={`flex-1 rounded-lg py-2 text-[12px] font-medium transition-colors ${inferenceTab === "cookie" ? "bg-white text-[#1a1816] shadow-sm" : "text-[#7a746c]"}`}>
                    Cookie Relay
                  </button>
                  <button onClick={() => setInferenceTab("browser")} className={`flex-1 rounded-lg py-2 text-[12px] font-medium transition-colors ${inferenceTab === "browser" ? "bg-white text-[#1a1816] shadow-sm" : "text-[#7a746c]"}`}>
                    Browser Automation
                  </button>
                </div>

                {inferenceTab === "cookie" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-[#faf9f6] p-3">
                      <div className="flex items-start gap-2">
                        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div className="text-[12px] text-[#7a746c] space-y-1">
                          <p className="font-medium text-[#36322d]">How to get your session key:</p>
                          <ol className="list-decimal list-inside space-y-0.5">
                            <li>Log into claude.ai in your browser</li>
                            <li>Open DevTools &rarr; Application &rarr; Cookies</li>
                            <li>Copy the <code className="rounded bg-[#efede8] px-1">sessionKey</code> value</li>
                            <li>Paste below and click Connect</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[12px] text-[#7a746c]">Session Key</Label>
                      <div className="relative mt-1">
                        <input type={showKey ? "text" : "password"} placeholder="sk-ant-..." value={sessionKey} onChange={(e) => setSessionKey(e.target.value)} className="w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 pr-10 font-mono text-[13px] text-[#1a1816] outline-none focus:border-[#7a746c]" />
                        <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a746c]">
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[12px] text-[#7a746c]">Organization ID <span className="text-[#9e9890]">(optional)</span></Label>
                      <input placeholder="Auto-detected" value={orgId} onChange={(e) => setOrgId(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 font-mono text-[13px] text-[#1a1816] outline-none focus:border-[#7a746c]" />
                    </div>
                    <button disabled={!sessionKey || configureCookie.isPending} onClick={() => configureCookie.mutate({ sessionKey, orgId: orgId || undefined })} className="w-full rounded-xl bg-[#1a1816] py-2.5 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#ece9e3] disabled:text-[#b8b3ab]">
                      {configureCookie.isPending ? "Connecting..." : "Connect with Cookie"}
                    </button>
                    {claudeMode === "cookie" && isClaudeConnected && (
                      <div className="flex items-center gap-2 rounded-xl bg-[#dcfce7] px-4 py-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                        <span className="text-[13px] font-medium text-[#16a34a]">Cookie relay active</span>
                      </div>
                    )}
                  </div>
                )}

                {inferenceTab === "browser" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-[#faf9f6] p-3">
                      <div className="flex items-start gap-2">
                        <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                        <div className="text-[12px] text-[#7a746c]">
                          <p className="font-medium text-[#36322d]">Browser automation mode</p>
                          <p className="mt-1">Launches Chrome with your existing profile so you stay logged in to claude.ai.</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[12px] text-[#7a746c]">Chrome Path</Label>
                      <input placeholder="/Applications/Google Chrome.app/..." value={chromePath} onChange={(e) => setChromePath(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 font-mono text-[13px] text-[#1a1816] outline-none focus:border-[#7a746c]" />
                    </div>
                    <div>
                      <Label className="text-[12px] text-[#7a746c]">User Data Directory</Label>
                      <input placeholder="Uses default Chrome profile" value={userDataDir} onChange={(e) => setUserDataDir(e.target.value)} className="mt-1 w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 font-mono text-[13px] text-[#1a1816] outline-none focus:border-[#7a746c]" />
                    </div>
                    <label className="flex items-center gap-2 text-[13px] text-[#7a746c] cursor-pointer">
                      <input type="checkbox" checked={headless} onChange={(e) => setHeadless(e.target.checked)} className="rounded border-[#e8e4dc]" />
                      Run headless (no visible window)
                    </label>
                    <div className="flex gap-2">
                      <button disabled={launchBrowser.isPending || (claudeMode === "browser" && !!isClaudeConnected)} onClick={() => launchBrowser.mutate({ chromePath: chromePath || undefined, userDataDir: userDataDir || undefined, headless })} className="flex-1 rounded-xl bg-[#1a1816] py-2.5 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#ece9e3] disabled:text-[#b8b3ab]">
                        {launchBrowser.isPending ? "Launching..." : "Launch Browser"}
                      </button>
                      {claudeMode === "browser" && (
                        <button onClick={() => closeBrowser.mutate()} className="rounded-xl border border-[#e8e4dc] px-4 py-2.5 text-[13px] font-medium text-[#36322d] transition-colors hover:bg-[#faf9f6]">
                          Close
                        </button>
                      )}
                    </div>
                    {claudeMode === "browser" && isClaudeConnected && (
                      <div className="flex items-center gap-2 rounded-xl bg-[#dcfce7] px-4 py-2.5">
                        <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                        <span className="text-[13px] font-medium text-[#16a34a]">Browser connected &amp; logged in</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* System recommendations */}
              <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
                <h3 className="text-[14px] font-semibold text-[#1a1816]">System Recommendations</h3>
                <div className="mt-3 space-y-2 text-[13px] text-[#7a746c]">
                  <p>Optimized for <strong className="text-[#36322d]">Mac mini with Apple Silicon, 16GB RAM</strong>:</p>
                  <div className="space-y-1.5 pl-1">
                    {["Llama 3.1 8B Instruct — Good balance of speed and quality", "Mistral 7B Instruct v0.3 — Fast, fits in 16GB RAM", "Mixtral 8x7B Instruct — More capable, may use more resources", "Nemotron 4 340B Instruct — NVIDIA's most capable model"].map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b8b3ab]" />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connectors tab */}
          {activeTab === "connectors" && (
            <div className="space-y-6">
              <h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Connectors</h2>
              <ConnectorsSettings />
            </div>
          )}

          {/* Browser tab */}
          {activeTab === "browser" && (
            <div className="space-y-6">
              <h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Cloud browser</h2>
              <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
                <p className="text-[13px] text-[#7a746c]">Configure Claude browser automation settings for web interaction tasks.</p>
              </div>
            </div>
          )}

          {/* Personalization tab */}
          {activeTab === "personalization" && (
            <div className="space-y-6">
              <h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Personalization</h2>
              <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
                <p className="text-[13px] text-[#7a746c]">Tune preferences, memory, and behavior to match your workflow.</p>
              </div>
            </div>
          )}

          {/* Skills tab */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              <h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Skills</h2>
              <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
                <p className="text-[13px] text-[#7a746c]">Manage custom skills that automate your expertise into repeatable workflows.</p>
              </div>
            </div>
          )}

          {/* Integrations tab */}
          {activeTab === "integrations" && (
            <div className="space-y-6">
              <h2 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Integrations</h2>
              <div className="rounded-2xl border border-[#e8e4dc] bg-white p-5">
                <p className="text-[13px] text-[#7a746c]">Connect third-party services and APIs to extend Forge capabilities.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
