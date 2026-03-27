import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "preference": return "bg-chart-4/10 text-chart-4";
      case "fact": return "bg-primary/10 text-primary";
      case "context": return "bg-chart-2/10 text-chart-2";
      case "format": return "bg-chart-3/10 text-chart-3";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Memory</h1>
            <p className="text-sm text-muted-foreground mt-1">Agent long-term memory for personalization and context</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Store Memory</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader><DialogTitle>Store Memory</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Key</Label><Input value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} placeholder="user_name" className="bg-background" /></div>
                <div><Label className="text-xs">Value</Label><Input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} placeholder="The user prefers dark mode" className="bg-background" /></div>
                <Button onClick={() => { if (!form.key || !form.value) { toast.error("Key and value required"); return; } storeMemory.mutate(form); }} disabled={storeMemory.isPending} className="w-full">Store</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories..." className="pl-9 bg-card border-border/50" />
        </div>

        <div className="grid gap-2">
          {filtered?.length ? filtered.map(mem => (
            <Card key={mem.id} className="bg-card border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge className={`text-[10px] h-5 shrink-0 ${categoryColor(mem.category)}`}>{mem.category}</Badge>
                    <span className="text-xs font-medium shrink-0">{mem.key}</span>
                    <span className="text-xs text-muted-foreground truncate">{mem.value}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{mem.source}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => deleteMemory.mutate({ id: mem.id })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Brain className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">{search ? "No matching memories" : "No memories stored"}</p>
              <p className="text-xs mt-1">The agent learns and remembers over time</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
