import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon, Cpu, HardDrive, RefreshCw,
  Globe, Key, Monitor, Unplug, Zap, Shield, Chrome, Cookie,
  Eye, EyeOff, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

  const [sessionKey, setSessionKey] = useState("");
  const [orgId, setOrgId] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [chromePath, setChromePath] = useState("");
  const [userDataDir, setUserDataDir] = useState("");
  const [headless, setHeadless] = useState(false);
  const [nvidiaKey, setNvidiaKey] = useState("");
  const [showNvidiaKey, setShowNvidiaKey] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
    return `${bytes} B`;
  };

  const isClaudeConnected = claudeStatus?.connected;
  const claudeMode = claudeStatus?.mode || "none";

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure inference providers and system preferences</p>
        </div>



          <Card className="bg-card border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Claude</p>
                    <p className="text-[10px] text-muted-foreground">
                      {claudeMode === "cookie" ? "Cookie relay" : claudeMode === "browser" ? "Browser automation" : "Not configured"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isClaudeConnected ? (
                    <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 text-[10px] h-5">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">
                      Not connected
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        {/* ─── Claude Subscription Integration ─── */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-violet-500" />
                Claude Subscription
                <Badge variant="outline" className="text-[10px] h-5 ml-1">No API key needed</Badge>
              </CardTitle>
              {isClaudeConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => disconnectClaude.mutate()}
                >
                  <Unplug className="h-3 w-3 mr-1" /> Disconnect
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Use your existing Claude subscription directly — no API costs. Choose between cookie relay (faster, headless) or browser automation (visual, interactive).
            </p>

            {/* Claude Model Selector */}
            <div className="space-y-2">
              <Label className="text-xs">Claude Model</Label>
              <Select
                value={claudeStatus?.model || "claude-sonnet-4-20250514"}
                onValueChange={(v) => setClaudeModel.mutate({ model: v })}
              >
                <SelectTrigger className="h-8 text-xs bg-accent/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {claudeModels?.map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      <span className="flex items-center gap-2">
                        {m.name}
                        <Badge variant="outline" className="text-[9px] h-4 ml-1">
                          {m.tier}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="opacity-30" />

            <Tabs defaultValue="cookie" className="w-full">
              <TabsList className="w-full h-8 bg-accent/30">
                <TabsTrigger value="cookie" className="text-xs flex-1 h-6 gap-1.5">
                  <Cookie className="h-3 w-3" /> Cookie Relay
                </TabsTrigger>
                <TabsTrigger value="browser" className="text-xs flex-1 h-6 gap-1.5">
                  <Chrome className="h-3 w-3" /> Browser Automation
                </TabsTrigger>
              </TabsList>

              {/* Cookie Mode */}
              <TabsContent value="cookie" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">How to get your session key:</p>
                      <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                        <li>Log into <strong>claude.ai</strong> in your browser</li>
                        <li>Open DevTools → Application → Cookies → claude.ai</li>
                        <li>Copy the value of the <code className="bg-accent/50 px-1 rounded">sessionKey</code> cookie</li>
                        <li>Paste it below and click Connect</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Session Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKey ? "text" : "password"}
                        placeholder="sk-ant-..."
                        value={sessionKey}
                        onChange={(e) => setSessionKey(e.target.value)}
                        className="h-8 text-xs font-mono bg-accent/30 pr-8"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-8 w-8"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Organization ID <span className="text-muted-foreground">(optional, auto-detected)</span></Label>
                  <Input
                    placeholder="Auto-detected from session"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="h-8 text-xs font-mono bg-accent/30"
                  />
                </div>

                <Button
                  className="w-full h-8 text-xs"
                  disabled={!sessionKey || configureCookie.isPending}
                  onClick={() => configureCookie.mutate({ sessionKey, orgId: orgId || undefined })}
                >
                  {configureCookie.isPending ? (
                    <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Connecting...</>
                  ) : (
                    <><Key className="h-3 w-3 mr-1.5" /> Connect with Cookie</>
                  )}
                </Button>

                {claudeMode === "cookie" && isClaudeConnected && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs text-emerald-500 font-medium">Cookie relay active</span>
                    {claudeStatus?.orgId && (
                      <Badge variant="outline" className="text-[9px] h-4 ml-auto">
                        Org: {claudeStatus.orgId.slice(0, 8)}...
                      </Badge>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Browser Mode */}
              <TabsContent value="browser" className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-accent/20 border border-border/30 space-y-3">
                  <div className="flex items-start gap-2">
                    <Monitor className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">Browser automation mode</p>
                      <p className="text-[11px]">
                        Launches Chrome with your existing profile so you stay logged in to claude.ai.
                        The agent types messages and reads responses directly from the page.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Chrome Path <span className="text-muted-foreground">(auto-detected on macOS)</span></Label>
                  <Input
                    placeholder="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
                    value={chromePath}
                    onChange={(e) => setChromePath(e.target.value)}
                    className="h-8 text-xs font-mono bg-accent/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">User Data Directory <span className="text-muted-foreground">(for persistent login)</span></Label>
                  <Input
                    placeholder="Uses default Chrome profile"
                    value={userDataDir}
                    onChange={(e) => setUserDataDir(e.target.value)}
                    className="h-8 text-xs font-mono bg-accent/30"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headless}
                      onChange={(e) => setHeadless(e.target.checked)}
                      className="rounded border-border"
                    />
                    Run headless (no visible window)
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-8 text-xs"
                    disabled={launchBrowser.isPending || (claudeMode === "browser" && isClaudeConnected)}
                    onClick={() => launchBrowser.mutate({
                      chromePath: chromePath || undefined,
                      userDataDir: userDataDir || undefined,
                      headless,
                    })}
                  >
                    {launchBrowser.isPending ? (
                      <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Launching...</>
                    ) : (
                      <><Chrome className="h-3 w-3 mr-1.5" /> Launch Browser</>
                    )}
                  </Button>
                  {claudeMode === "browser" && (
                    <Button
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => closeBrowser.mutate()}
                    >
                      Close Browser
                    </Button>
                  )}
                </div>

                {claudeMode === "browser" && (
                  <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                    isClaudeConnected
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  }`}>
                    {isClaudeConnected ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs text-emerald-500 font-medium">Browser connected & logged in</span>
                      </>
                    ) : (
                      <>
                        <Monitor className="h-4 w-4 text-amber-500" />
                        <span className="text-xs text-amber-500 font-medium">Browser open — please log in to claude.ai</span>
                      </>
                    )}
                    {claudeStatus?.browserPid && (
                      <Badge variant="outline" className="text-[9px] h-4 ml-auto">
                        PID: {claudeStatus.browserPid}
                      </Badge>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>





        {/* ─── System Recommendations ─── */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              System Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>Optimized for <strong className="text-foreground">Mac mini with Apple Silicon, 16GB RAM</strong>:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong className="text-foreground">Llama 3.1 8B Instruct</strong> — Good balance of speed and quality</li>
                <li><strong className="text-foreground">Mistral 7B Instruct v0.3</strong> — Fast, fits in 16GB RAM</li>
                <li><strong className="text-foreground">Mixtral 8x7B Instruct</strong> — More capable, may use more resources</li>
                <li><strong className="text-foreground">Nemotron 4 340B Instruct</strong> — NVIDIA's most capable model</li>
              </ul>
              <Separator className="opacity-30 my-3" />
              <p>For <strong className="text-foreground">Claude subscription</strong> (cloud fallback):</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong className="text-foreground">Sonnet 4</strong> — Best balance of speed and quality (free tier)</li>
                <li><strong className="text-foreground">Opus 4</strong> — Maximum capability (Pro subscription)</li>
                <li><strong className="text-foreground">Haiku 3.5</strong> — Fastest responses for simple tasks</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
