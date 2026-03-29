import { trpc } from "@/lib/trpc";
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
    <div className="h-full overflow-y-auto bg-[#f6f5f2]">
      <div className="mx-auto max-w-[680px] px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Scheduled tasks</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl bg-[#1a1816] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:opacity-90">
                <Plus className="h-4 w-4" /> New Task
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl border-[#e8e4dc] bg-white p-6">
              <DialogHeader><DialogTitle className="font-serif text-[20px] font-semibold text-[#1a1816]">Schedule Task</DialogTitle></DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-[12px] text-[#7a746c]">Name</Label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Daily Report" className="mt-1 w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 text-[14px] text-[#1a1816] outline-none placeholder:text-[#9e9890] focus:border-[#7a746c]" />
                </div>
                <div>
                  <Label className="text-[12px] text-[#7a746c]">Description</Label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What this task does" className="mt-1 w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 text-[14px] text-[#1a1816] outline-none placeholder:text-[#9e9890] focus:border-[#7a746c]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[12px] text-[#7a746c]">Cron Expression</Label>
                    <input value={form.cronExpression} onChange={e => setForm(p => ({ ...p, cronExpression: e.target.value }))} placeholder="0 9 * * *" className="mt-1 w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 font-mono text-[14px] text-[#1a1816] outline-none placeholder:text-[#9e9890] focus:border-[#7a746c]" />
                  </div>
                  <div>
                    <Label className="text-[12px] text-[#7a746c]">Model (optional)</Label>
                    <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="llama3" className="mt-1 w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 text-[14px] text-[#1a1816] outline-none placeholder:text-[#9e9890] focus:border-[#7a746c]" />
                  </div>
                </div>
                <div>
                  <Label className="text-[12px] text-[#7a746c]">Prompt</Label>
                  <textarea value={form.prompt} onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))} placeholder="Generate a summary of..." rows={4} className="mt-1 w-full resize-none rounded-xl border border-[#e8e4dc] bg-white px-4 py-2.5 text-[14px] text-[#1a1816] outline-none placeholder:text-[#9e9890] focus:border-[#7a746c]" />
                </div>
                <button onClick={() => { if (!form.name || !form.prompt) { toast.error("Name and prompt required"); return; } createTask.mutate(form); }} disabled={createTask.isPending} className="w-full rounded-xl bg-[#1a1816] py-2.5 text-[14px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#ece9e3] disabled:text-[#b8b3ab]">
                  Schedule Task
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 space-y-3">
          {tasks?.length ? tasks.map(task => (
            <div key={task.id} className="rounded-2xl border border-[#e8e4dc] bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f0ea]">
                    <Clock className="h-5 w-5 text-[#7a746c]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-[#1a1816]">{task.name}</h3>
                      {task.cronExpression && <span className="rounded-md bg-[#efede8] px-2 py-0.5 font-mono text-[11px] text-[#7a746c]">{task.cronExpression}</span>}
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${task.isActive ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#efede8] text-[#7a746c]"}`}>
                        {task.isActive ? "Active" : "Paused"}
                      </span>
                    </div>
                    {task.description && <p className="mt-0.5 text-[12px] text-[#7a746c]">{task.description}</p>}
                    <p className="mt-1 truncate text-[11px] text-[#9e9890]">{task.prompt.slice(0, 100)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateTask.mutate({ id: task.id, isActive: !task.isActive })} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7a746c] transition-colors hover:bg-[#efede8]">
                    {task.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button onClick={() => deleteTask.mutate({ id: task.id })} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7a746c] transition-colors hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8e4dc] py-16">
              <Clock className="h-8 w-8 text-[#d9d4cc]" />
              <p className="mt-2 text-[14px] text-[#7a746c]">No scheduled tasks</p>
              <p className="mt-1 text-[12px] text-[#9e9890]">Automate recurring tasks with cron expressions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
