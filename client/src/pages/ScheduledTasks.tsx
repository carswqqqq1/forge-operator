import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Clock, Plus, Trash2, Play, Pause } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ScheduledTasks() {
  const { data: tasks, refetch } = trpc.scheduled.list.useQuery();
  const createTask = trpc.scheduled.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Task scheduled"); } });
  const deleteTask = trpc.scheduled.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Task deleted"); } });
  const updateTask = trpc.scheduled.update.useMutation({ onSuccess: () => { refetch(); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", cronExpression: "", prompt: "", model: "" });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Scheduled Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">Automate recurring agent tasks with cron scheduling</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />New Task</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader><DialogTitle>Schedule Task</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Daily Report" className="bg-background" /></div>
                <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What this task does" className="bg-background" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Cron Expression</Label><Input value={form.cronExpression} onChange={e => setForm(p => ({ ...p, cronExpression: e.target.value }))} placeholder="0 9 * * *" className="bg-background font-mono" /></div>
                  <div><Label className="text-xs">Model (optional)</Label><Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="llama3" className="bg-background" /></div>
                </div>
                <div><Label className="text-xs">Prompt</Label><Textarea value={form.prompt} onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))} placeholder="Generate a summary of..." rows={4} className="bg-background" /></div>
                <Button onClick={() => { if (!form.name || !form.prompt) { toast.error("Name and prompt required"); return; } createTask.mutate(form); }} disabled={createTask.isPending} className="w-full">Schedule Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3">
          {tasks?.length ? tasks.map(task => (
            <Card key={task.id} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{task.name}</h3>
                        {task.cronExpression && <Badge variant="outline" className="text-[10px] h-5 font-mono">{task.cronExpression}</Badge>}
                        <Badge variant={task.isActive ? "default" : "secondary"} className="text-[10px] h-5">{task.isActive ? "Active" : "Paused"}</Badge>
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{task.prompt.slice(0, 100)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateTask.mutate({ id: task.id, isActive: !task.isActive })}>
                      {task.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTask.mutate({ id: task.id })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No scheduled tasks</p>
              <p className="text-xs mt-1">Automate recurring tasks with cron expressions</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
