import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Research() {
  const { data: sessions, refetch } = trpc.research.list.useQuery();
  const createSession = trpc.research.create.useMutation({
    onSuccess: () => { refetch(); setQuery(""); toast.success("Research session started"); },
  });

  const [query, setQuery] = useState("");

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Wide Research</h1>
          <p className="text-sm text-muted-foreground mt-1">Dispatch parallel agents to collect data from multiple sources</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (!query.trim()) return; createSession.mutate({ query: query.trim() }); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter research topic..." className="pl-9 bg-card border-border/50" />
          </div>
          <Button type="submit" disabled={createSession.isPending || !query.trim()} className="gap-1.5">
            {createSession.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Research
          </Button>
        </form>

        <div className="grid gap-3">
          {sessions?.length ? sessions.map(session => (
            <Card key={session.id} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    {statusIcon(session.status)}
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium">{session.query}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5">{session.status}</Badge>
                        {session.sourcesCount > 0 && <span className="text-[10px] text-muted-foreground">{session.sourcesCount} sources</span>}
                        <span className="text-[10px] text-muted-foreground">{new Date(session.createdAt).toLocaleString()}</span>
                      </div>
                      {session.findings && (
                        <pre className="text-[11px] font-mono text-muted-foreground mt-2 bg-accent/30 rounded p-2 max-h-32 overflow-hidden whitespace-pre-wrap">{session.findings.slice(0, 500)}</pre>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No research sessions</p>
              <p className="text-xs mt-1">Start a research session to collect data from multiple sources</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
