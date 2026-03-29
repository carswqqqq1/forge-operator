import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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
    if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "error") return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    return <Clock className="h-3.5 w-3.5 text-yellow-500 animate-spin" />;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Execution Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Detailed history of all tool executions</p>
        </div>

        <Card className="bg-card border-border/50">
          <CardContent className="p-0">
            {executions?.length ? (
              <div className="divide-y divide-border/30">
                {executions.map((exec) => (
                  <div key={exec.id}>
                    <button
                      onClick={() => toggle(exec.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left"
                    >
                      {expanded.has(exec.id) ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      {statusIcon(exec.status)}
                      <span className="text-xs font-mono w-28 shrink-0 text-foreground">{exec.toolName}</span>
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {(() => {
                          try { return JSON.stringify(JSON.parse(exec.toolInput)).slice(0, 100); }
                          catch { return exec.toolInput.slice(0, 100); }
                        })()}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5 shrink-0">
                        {exec.durationMs ? `${exec.durationMs}ms` : "..."}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0 w-32 text-right">
                        {new Date(exec.createdAt).toLocaleString()}
                      </span>
                    </button>
                    {expanded.has(exec.id) && (
                      <div className="px-4 pb-4 space-y-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Input</p>
                          <pre className="text-xs font-mono bg-[oklch(0.12_0.005_260)] rounded-lg p-3 overflow-x-auto text-muted-foreground whitespace-pre-wrap">
                            {(() => {
                              try { return JSON.stringify(JSON.parse(exec.toolInput), null, 2); }
                              catch { return exec.toolInput; }
                            })()}
                          </pre>
                        </div>
                        {exec.toolOutput && (
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Output</p>
                            <pre className="text-xs font-mono bg-[oklch(0.12_0.005_260)] rounded-lg p-3 overflow-x-auto text-muted-foreground whitespace-pre-wrap max-h-[300px] overflow-y-auto">
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
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ScrollText className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No execution logs yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
