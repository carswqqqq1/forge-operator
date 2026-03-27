import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Terminal,
} from "lucide-react";

export default function Dashboard() {
  const { data: health } = trpc.ollama.health.useQuery(undefined, { refetchInterval: 10000 });
  const { data: models } = trpc.ollama.models.useQuery();
  const { data: stats } = trpc.tools.stats.useQuery();
  const { data: conversations } = trpc.conversations.list.useQuery();
  const { data: recentExecs } = trpc.tools.executions.useQuery({ limit: 10 });

  const formatSize = (bytes: number) => {
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
    return `${bytes} B`;
  };

  const totalModelSize = models?.reduce((acc, m) => acc + m.size, 0) || 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">System overview and performance metrics</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ollama Status</p>
                  <p className="text-lg font-semibold mt-1">
                    {health?.ok ? "Online" : "Offline"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {health?.ok ? `v${health.version}` : "Not connected"}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${health?.ok ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <Activity className={`h-5 w-5 ${health?.ok ? "text-emerald-500" : "text-red-500"}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Models Loaded</p>
                  <p className="text-lg font-semibold mt-1">{models?.length || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatSize(totalModelSize)} total
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Tool Executions</p>
                  <p className="text-lg font-semibold mt-1">{stats?.total || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {stats?.avgDuration || 0}ms avg
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-chart-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Conversations</p>
                  <p className="text-lg font-semibold mt-1">{conversations?.length || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">active sessions</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-chart-3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Models */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                Available Models
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {models?.length ? models.map((m) => (
                <div key={m.name} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.details?.parameter_size || "Unknown"} · {m.details?.quantization_level || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-mono text-muted-foreground">{formatSize(m.size)}</p>
                    </div>
                    <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${Math.min((m.size / 1e10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {health?.ok ? "No models installed" : "Ollama is offline"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tool Stats */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                Tool Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.byTool?.length ? stats.byTool.map((t: any) => (
                <div key={t.toolName} className="flex items-center justify-between p-2.5 rounded-lg bg-accent/30 border border-border/30">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-mono">{t.toolName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground">{t.count} calls</span>
                    <span className="text-[10px] text-muted-foreground">{Math.round(t.avgDuration)}ms</span>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {t.successRate}%
                    </Badge>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No tool executions yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Executions */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Tool Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recentExecs?.length ? recentExecs.map((exec) => (
                <div key={exec.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
                  {exec.status === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : exec.status === "error" ? (
                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-yellow-500 shrink-0 animate-spin" />
                  )}
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{exec.toolName}</span>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {exec.toolInput.slice(0, 80)}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {exec.durationMs ? `${exec.durationMs}ms` : "..."}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No executions yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
