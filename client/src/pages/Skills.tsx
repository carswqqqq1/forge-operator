import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Zap, Plus, Pencil, Trash2, Terminal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Skills() {
  const { data: skills, refetch } = trpc.skills.list.useQuery();
  const createSkill = trpc.skills.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Skill created"); } });
  const deleteSkill = trpc.skills.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Skill deleted"); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", category: "", instructions: "", triggerCommand: "" });

  const handleCreate = () => {
    if (!form.name || !form.slug || !form.instructions) { toast.error("Name, slug, and instructions are required"); return; }
    createSkill.mutate(form);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Skills</h1>
            <p className="text-sm text-muted-foreground mt-1">Reusable workflows triggered by slash commands</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />New Skill</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader><DialogTitle>Create Skill</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="My Skill" className="bg-background" /></div>
                  <div><Label className="text-xs">Slug</Label><Input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="my-skill" className="bg-background" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Category</Label><Input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="automation" className="bg-background" /></div>
                  <div><Label className="text-xs">Trigger Command</Label><Input value={form.triggerCommand} onChange={e => setForm(p => ({ ...p, triggerCommand: e.target.value }))} placeholder="/my-skill" className="bg-background" /></div>
                </div>
                <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What this skill does" className="bg-background" /></div>
                <div><Label className="text-xs">Instructions</Label><Textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Step-by-step instructions..." rows={6} className="bg-background font-mono text-xs" /></div>
                <Button onClick={handleCreate} disabled={createSkill.isPending} className="w-full">Create Skill</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3">
          {skills?.length ? skills.map(skill => (
            <Card key={skill.id} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{skill.name}</h3>
                        {skill.triggerCommand && <Badge variant="outline" className="text-[10px] h-5 font-mono">{skill.triggerCommand}</Badge>}
                        {skill.category && <Badge variant="secondary" className="text-[10px] h-5">{skill.category}</Badge>}
                        <Badge variant={skill.isActive ? "default" : "secondary"} className="text-[10px] h-5">{skill.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      {skill.description && <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>}
                      <pre className="text-[11px] font-mono text-muted-foreground mt-2 bg-accent/30 rounded p-2 max-h-20 overflow-hidden">{skill.instructions.slice(0, 200)}{skill.instructions.length > 200 ? "..." : ""}</pre>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteSkill.mutate({ id: skill.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Zap className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No skills created yet</p>
              <p className="text-xs mt-1">Create reusable workflows to automate common tasks</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
