
import { trpc } from "@/lib/trpc";
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
    const containerClasses = "w-8 h-8 rounded-xl bg-[#f3f0ea] flex items-center justify-center";
    if (status === "completed") return <div className={containerClasses}><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>;
    if (status === "failed") return <div className={containerClasses}><XCircle className="h-4 w-4 text-red-600" /></div>;
    return <div className={containerClasses}><Loader2 className="h-4 w-4 text-[#36322d] animate-spin" /></div>;
  };

  return (
    <ScrollArea className="h-full bg-[#f6f5f2]">
      <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Wide Research</h1>
          <p className="text-[14px] text-[#7a746c] mt-1">Dispatch parallel agents to collect data from multiple sources.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); if (!query.trim()) return; createSession.mutate({ query: query.trim() }); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a746c]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter a research topic to dispatch agents..."
              className="w-full h-10 rounded-xl pl-10 pr-4 text-[13px] bg-white border border-[#e8e4dc] placeholder:text-[#7a746c] focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#f6f5f2] focus:ring-[#1a1816] focus:outline-none"
            />
          </div>
          <button type="submit" disabled={createSession.isPending || !query.trim()} className="h-10 px-4 flex items-center gap-2 bg-[#1a1816] text-white rounded-xl text-[13px] font-medium disabled:opacity-50 transition-opacity">
            {createSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Research
          </button>
        </form>

        <div className="grid gap-4">
          {sessions?.length ? sessions.map(session => (
            <div key={session.id} className="bg-white border border-[#e8e4dc] rounded-2xl p-4">
              <div className="flex items-start gap-4">
                {statusIcon(session.status)}
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-[#1a1816] text-[14px]">{session.query}</h3>
                  <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                    <div className="rounded-md bg-[#efede8] px-2 py-0.5 text-[11px] font-medium text-[#7a746c] capitalize">{session.status}</div>
                    {session.sourcesCount > 0 && <span className="text-[12px] text-[#7a746c]">{session.sourcesCount} sources</span>}
                    <span className="text-[12px] text-[#7a746c]">{new Date(session.createdAt).toLocaleString()}</span>
                  </div>
                  {session.findings && (
                    <pre className="text-xs font-mono text-[#7a746c] mt-3 bg-[#f6f5f2] rounded-lg p-3 max-h-40 overflow-auto whitespace-pre-wrap scrollbar-thin">{session.findings}</pre>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <Search className="h-10 w-10 mb-3 text-[#7a746c]/40" />
              <p className="text-[14px] text-[#36322d] font-medium">No Research Sessions</p>
              <p className="text-[13px] text-[#7a746c] mt-1">Start a new research session to begin collecting information.</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

