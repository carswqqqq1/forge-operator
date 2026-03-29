
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Plus, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const categories = ["preference", "fact", "context", "format"];

export default function Memory() {
  const { data: memories, refetch } = trpc.memory.list.useQuery();
  const storeMemory = trpc.memory.store.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Memory stored"); } });
  const deleteMemory = trpc.memory.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Memory deleted"); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "fact", key: "", value: "" });
  const [search, setSearch] = useState("");

  const filtered = memories?.filter(m =>
    !search || m.key.toLowerCase().includes(search.toLowerCase()) || m.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full bg-[#f6f5f2] p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Memory</h1>
            <p className="text-[14px] text-[#7a746c] mt-1">The agent learns and remembers facts, preferences, and context over time.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-white bg-[#1a1816] hover:bg-opacity-90 transition-colors">
                <Plus className="h-4 w-4" />
                Store Memory
              </button>
            </DialogTrigger>
            <DialogContent className="bg-white border-[#e8e4dc] rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="font-serif text-[24px] font-semibold tracking-[-0.03em] text-[#1a1816]">Store New Memory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-[13px] font-medium text-[#36322d] mb-1.5 block">Category</label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e8e4dc] rounded-xl">
                      {categories.map(c => <SelectItem key={c} value={c} className="text-[13px]">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#36322d] mb-1.5 block">Key</label>
                  <input value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="e.g., user_name" className="w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2 text-[13px] placeholder:text-[#7a746c] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#36322d] mb-1.5 block">Value</label>
                  <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="e.g., The user prefers dark mode" className="w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2 text-[13px] placeholder:text-[#7a746c] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
                </div>
                <button onClick={() => { if (!form.key || !form.value) { toast.error("Key and value are required"); return; } storeMemory.mutate(form); }} disabled={storeMemory.isPending} className="w-full rounded-xl bg-[#1a1816] py-2.5 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50 transition-colors">
                  Store
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a746c]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories..." className="w-full rounded-xl border border-[#e8e4dc] bg-white py-2.5 pl-10 pr-4 text-[13px] placeholder:text-[#7a746c] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
        </div>

        <div className="space-y-2">
          {filtered?.length ? filtered.map(mem => (
            <div key={mem.id} className="bg-white border border-[#e8e4dc] rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="rounded-md bg-[#efede8] px-2 py-0.5 text-[11px] font-medium text-[#7a746c] shrink-0 capitalize">{mem.category}</span>
                  <span className="text-[13px] font-medium text-[#36322d] shrink-0">{mem.key}</span>
                  <span className="text-[13px] text-[#7a746c] truncate">{mem.value}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[#7a746c]">{mem.source}</span>
                  <button className="group" onClick={() => deleteMemory.mutate({ id: mem.id })}>
                    <Trash2 className="h-4 w-4 text-[#7a746c] group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8e4dc] py-20 text-[#7a746c] bg-white/50">
              <Brain className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-[14px] font-medium text-[#36322d]">{search ? "No Matching Memories" : "No Memories Stored"}</p>
              <p className="text-[13px] mt-1">Store facts, preferences, and context to give the agent long-term memory.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

