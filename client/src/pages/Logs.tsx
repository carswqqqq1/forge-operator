
import { trpc } from "@/lib/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, ScrollText, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function Logs() {
  const { data: executions } = trpc.tools.executions.useQuery({ limit: 100 });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const statusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "error") return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
  };

  return (
    <div className="h-full bg-[#f6f5f2]">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <div>
            <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Execution Logs</h1>
            <p className="text-[14px] text-[#7a746c] mt-1">Detailed history of all tool executions performed by the agent.</p>
          </div>

          <div className="bg-white border border-[#e8e4dc] rounded-2xl">
            {executions?.length ? (
              <div className="divide-y divide-[#e8e4dc]">
                {executions.map((exec) => (
                  <div key={exec.id}>
                    <button
                      onClick={() => toggle(exec.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-[#f6f5f2]/50 transition-colors text-left"
                    >
                      <div className="p-1.5 bg-[#f3f0ea] rounded-xl">
                        {expanded.has(exec.id) ? (
                          <ChevronDown className="h-4 w-4 text-[#7a746c] shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#7a746c] shrink-0" />
                        )}
                      </div>
                      <div className="p-1.5 bg-[#f3f0ea] rounded-xl">{statusIcon(exec.status)}</div>
                      <span className="text-[13px] font-mono w-32 shrink-0 text-[#36322d]">{exec.toolName}</span>
                      <span className="text-[13px] text-[#7a746c] truncate flex-1">
                        {(() => {
                          try { return JSON.stringify(JSON.parse(exec.toolInput)).slice(0, 150); }
                          catch { return exec.toolInput.slice(0, 150); }
                        })()}
                      </span>
                      <div className="rounded-md bg-[#efede8] px-2 py-0.5 text-[11px] text-[#7a746c] h-5 shrink-0">
                        {exec.durationMs ? `${exec.durationMs}ms` : "..."}
                      </div>
                      <span className="text-[12px] text-[#7a746c] shrink-0 w-36 text-right">
                        {new Date(exec.createdAt).toLocaleString()}
                      </span>
                    </button>
                    {expanded.has(exec.id) && (
                      <div className="px-6 pb-4 space-y-4 border-t border-[#e8e4dc] bg-[#fbfaf8]">
                        <div className="pt-4">
                          <p className="text-[11px] uppercase font-medium tracking-wider text-[#7a746c] mb-2">Input</p>
                          <pre className="text-[12px] font-mono bg-[#f3f0ea] rounded-xl p-3 overflow-x-auto text-[#36322d] whitespace-pre-wrap">
                            {(() => {
                              try { return JSON.stringify(JSON.parse(exec.toolInput), null, 2); }
                              catch { return exec.toolInput; }
                            })()}
                          </pre>
                        </div>
                        {exec.toolOutput && (
                          <div>
                            <p className="text-[11px] uppercase font-medium tracking-wider text-[#7a746c] mb-2">Output</p>
                            <pre className="text-[12px] font-mono bg-[#f3f0ea] rounded-xl p-3 text-[#36322d] whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                              {exec.toolOutput}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-[#7a746c]">
                <div className="p-3 bg-[#f3f0ea] rounded-2xl mb-4">
                  <ScrollText className="h-8 w-8 text-[#7a746c]" />
                </div>
                <p className="text-[14px] font-medium text-[#36322d]">No execution logs</p>
                <p className="text-[13px] text-[#7a746c]">When the agent runs tools, the logs will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

