
import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  Cpu,
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
    <ScrollArea className="h-full bg-[#f6f5f2]">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Dashboard</h1>
          <p className="text-[14px] text-[#7a746c] mt-1">System overview and performance metrics</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#7a746c]">Ollama Status</p>
              <p className="text-2xl font-semibold text-[#1a1816] mt-1">
                {health?.ok ? "Online" : "Offline"}
              </p>
              <p className="text-[11px] text-[#7a746c] mt-1">
                {health?.ok ? `v${health.version}` : "Not connected"}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${health?.ok ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <Activity className={`h-6 w-6 ${health?.ok ? "text-emerald-500" : "text-red-500"}`} />
            </div>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#7a746c]">Models Loaded</p>
              <p className="text-2xl font-semibold text-[#1a1816] mt-1">{models?.length || 0}</p>
              <p className="text-[11px] text-[#7a746c] mt-1">
                {formatSize(totalModelSize)} total
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#f3f0ea] flex items-center justify-center">
              <Cpu className="h-6 w-6 text-[#36322d]" />
            </div>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#7a746c]">Tool Executions</p>
              <p className="text-2xl font-semibold text-[#1a1816] mt-1">{stats?.total || 0}</p>
              <p className="text-[11px] text-[#7a746c] mt-1">
                {stats?.avgDuration || 0}ms avg
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#f3f0ea] flex items-center justify-center">
              <Zap className="h-6 w-6 text-[#36322d]" />
            </div>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#7a746c]">Conversations</p>
              <p className="text-2xl font-semibold text-[#1a1816] mt-1">{conversations?.length || 0}</p>
              <p className="text-[11px] text-[#7a746c] mt-1">active sessions</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-[#f3f0ea] flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-[#36322d]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Models */}
          <div className="bg-white border border-[#e8e4dc] rounded-2xl">
            <div className="p-5 border-b border-[#e8e4dc]">
              <h2 className="text-[15px] font-semibold text-[#1a1816] flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-[#7a746c]" />
                Available Models
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {models?.length ? models.map((m) => (
                <div key={m.name} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e8e4dc]">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[#36322d] truncate">{m.name}</p>
                    <p className="text-[11px] text-[#7a746c] mt-0.5">
                      {m.details?.parameter_size || "Unknown"} · {m.details?.quantization_level || ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-mono text-[#7a746c]">{formatSize(m.size)}</p>
                    </div>
                    <div className="h-1.5 w-16 bg-[#efede8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a1816] rounded-full"
                        style={{ width: `${Math.min((m.size / 1e10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-[13px] text-[#7a746c] text-center py-8">
                  {health?.ok ? "No models installed" : "Ollama is offline"}
                </p>
              )}
            </div>
          </div>

          {/* Tool Stats */}
          <div className="bg-white border border-[#e8e4dc] rounded-2xl">
            <div className="p-5 border-b border-[#e8e4dc]">
              <h2 className="text-[15px] font-semibold text-[#1a1816] flex items-center gap-2.5">
                <Terminal className="h-4 w-4 text-[#7a746c]" />
                Tool Performance
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {stats?.byTool?.length ? stats.byTool.map((t: any) => (
                <div key={t.toolName} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#e8e4dc]">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="h-4 w-4 text-[#7a746c]" />
                    <span className="text-[14px] font-mono text-[#36322d]">{t.toolName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#7a746c]">{t.count} calls</span>
                    <span className="text-[11px] text-[#7a746c]">{Math.round(t.avgDuration)}ms</span>
                    <span className="rounded-md bg-[#efede8] px-2 py-0.5 text-[11px] text-[#7a746c] font-medium">
                      {t.successRate}%
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-[13px] text-[#7a746c] text-center py-8">No tool executions yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Executions */}
        <div className="bg-white border border-[#e8e4dc] rounded-2xl">
          <div className="p-5 border-b border-[#e8e4dc]">
            <h2 className="text-[15px] font-semibold text-[#1a1816] flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-[#7a746c]" />
              Recent Tool Executions
            </h2>
          </div>
          <div className="p-3">
            <div className="space-y-1">
              {recentExecs?.length ? recentExecs.map((exec) => (
                <div key={exec.id} className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-[#f6f5f2] transition-colors">
                  {exec.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : exec.status === "error" ? (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-500 shrink-0 animate-spin" />
                  )}
                  <span className="text-[13px] font-mono text-[#7a746c] w-28 shrink-0">{exec.toolName}</span>
                  <span className="text-[13px] text-[#36322d] truncate flex-1">
                    {exec.toolInput.slice(0, 100)}
                  </span>
                  <span className="text-[11px] text-[#7a746c] shrink-0">
                    {exec.durationMs ? `${exec.durationMs}ms` : "..."}
                  </span>
                </div>
              )) : (
                <p className="text-[13px] text-[#7a746c] text-center py-8">No executions yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

