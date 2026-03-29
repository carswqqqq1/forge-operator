import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BookOpen, Plus, Trash2, Star, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Prompts() {
  const { data: prompts, refetch } = trpc.prompts.list.useQuery();
  const createPrompt = trpc.prompts.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Prompt created"); } });
  const deletePrompt = trpc.prompts.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Prompt deleted"); } });
  const updatePrompt = trpc.prompts.update.useMutation({ onSuccess: () => { refetch(); toast.success("Prompt updated"); } });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", content: "" });

  const startEdit = (p: any) => {
    setForm({ name: p.name, description: p.description || "", content: p.content });
    setEditing(p.id);
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.content) { toast.error("Name and content required"); return; }
    if (editing) {
      updatePrompt.mutate({ id: editing, ...form });
      setEditing(null);
      setOpen(false);
    } else {
      createPrompt.mutate(form);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">System Prompts</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage agent personalities and behavior presets</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5" onClick={() => { setForm({ name: "", description: "", content: "" }); setEditing(null); }}><Plus className="h-3.5 w-3.5" />New Prompt</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-2xl">
              <DialogHeader><DialogTitle>{editing ? "Edit Prompt" : "Create Prompt"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Agent Name" className="bg-background" /></div>
                <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" className="bg-background" /></div>
                <div><Label className="text-xs">System Prompt</Label><Textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="You are..." rows={10} className="bg-background font-mono text-xs leading-relaxed" /></div>
                <Button onClick={handleSave} disabled={createPrompt.isPending || updatePrompt.isPending} className="w-full">{editing ? "Update" : "Create"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3">
          {prompts?.length ? prompts.map(prompt => (
            <Card key={prompt.id} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium">{prompt.name}</h3>
                      {prompt.isDefault && <Badge className="text-[10px] h-5 bg-chart-4/10 text-chart-4"><Star className="h-2.5 w-2.5 mr-0.5" />Default</Badge>}
                    </div>
                    {prompt.description && <p className="text-xs text-muted-foreground mt-1">{prompt.description}</p>}
                    <pre className="text-[11px] font-mono text-muted-foreground mt-2 bg-accent/30 rounded p-3 max-h-24 overflow-hidden leading-relaxed whitespace-pre-wrap">{prompt.content.slice(0, 300)}{prompt.content.length > 300 ? "..." : ""}</pre>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => startEdit(prompt)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!prompt.isDefault && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deletePrompt.mutate({ id: prompt.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookOpen className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No system prompts</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
