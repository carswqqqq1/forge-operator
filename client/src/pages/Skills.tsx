import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Zap, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Skills() {
  const { data: skills, refetch } = trpc.skills.list.useQuery();
  const createSkill = trpc.skills.create.useMutation({
    onSuccess: () => {
      refetch();
      setOpen(false);
      toast.success("Skill created");
    },
  });
  const deleteSkill = trpc.skills.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Skill deleted");
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", category: "", instructions: "", triggerCommand: "" });

  const handleCreate = () => {
    if (!form.name || !form.slug || !form.instructions) {
      toast.error("Name, slug, and instructions are required");
      return;
    }
    createSkill.mutate(form);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f6f5f2]">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">Skills</h1>
            <p className="text-[14px] text-[#7a746c] mt-1">Reusable workflows triggered by slash commands</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="px-3 py-1.5 text-sm font-medium bg-[#1a1816] text-white rounded-xl flex items-center gap-1.5 hover:bg-opacity-90 transition-colors">
                <Plus className="h-4 w-4" />
                New Skill
              </button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-[#e8e4dc] rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="font-serif text-[22px] font-semibold tracking-[-0.03em] text-[#1a1816]">Create Skill</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#7a746c] mb-1.5 block">Name</label>
                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="My Skill" className="w-full bg-white border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-[13px] text-[#36322d] placeholder:text-[#a8a29a] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a746c] mb-1.5 block">Slug</label>
                    <input type="text" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} placeholder="my-skill" className="w-full bg-white border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-[13px] text-[#36322d] placeholder:text-[#a8a29a] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#7a746c] mb-1.5 block">Category</label>
                    <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="automation" className="w-full bg-white border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-[13px] text-[#36322d] placeholder:text-[#a8a29a] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
                  </div>
                  <div>
                    <label className="text-xs text-[#7a746c] mb-1.5 block">Trigger Command</label>
                    <input type="text" value={form.triggerCommand} onChange={e => setForm(p => ({ ...p, triggerCommand: e.target.value }))} placeholder="/my-skill" className="w-full bg-white border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-[13px] text-[#36322d] placeholder:text-[#a8a29a] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#7a746c] mb-1.5 block">Description</label>
                  <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What this skill does" className="w-full bg-white border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-[13px] text-[#36322d] placeholder:text-[#a8a29a] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
                </div>
                <div>
                  <label className="text-xs text-[#7a746c] mb-1.5 block">Instructions</label>
                  <textarea value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))} placeholder="Step-by-step instructions..." rows={6} className="w-full bg-white border border-[#e8e4dc] rounded-lg px-3 py-1.5 text-[13px] text-[#36322d] placeholder:text-[#a8a29a] font-mono focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50" />
                </div>
                <button onClick={handleCreate} disabled={createSkill.isPending} className="w-full mt-2 px-4 py-2 text-sm font-medium bg-[#1a1816] text-white rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-colors disabled:opacity-50">
                  Create Skill
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {skills?.length ? (
            skills.map(skill => (
              <div key={skill.id} className="bg-white border border-[#e8e4dc] rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-[#f3f0ea] flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="h-5 w-5 text-[#36322d]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[14px] font-medium text-[#1a1816]">{skill.name}</h3>
                        {skill.triggerCommand && <span className="rounded-md bg-[#efede8] px-2 py-0.5 text-[11px] text-[#7a746c] font-mono">{skill.triggerCommand}</span>}
                        {skill.category && <span className="rounded-md bg-[#efede8] px-2 py-0.5 text-[11px] text-[#7a746c]">{skill.category}</span>}
                        <span className={`rounded-md px-2 py-0.5 text-[11px] ${skill.isActive ? "bg-green-100 text-green-800" : "bg-[#efede8] text-[#7a746c]"}`}>
                          {skill.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {skill.description && <p className="text-[13px] text-[#7a746c] mt-1.5">{skill.description}</p>}
                      {skill.instructions && (
                        <div className="text-[12px] font-mono text-[#7a746c] mt-3 bg-[#f6f5f2] rounded-lg p-3 max-h-24 overflow-hidden relative">
                          <pre className="whitespace-pre-wrap break-words">{skill.instructions}</pre>
                          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#f6f5f2] to-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="h-8 w-8 text-[#9d978f] hover:text-[#c42121] shrink-0 flex items-center justify-center" onClick={() => deleteSkill.mutate({ id: skill.id })}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#7a746c] border border-dashed border-[#e8e4dc] rounded-2xl">
              <Zap className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-[14px] font-medium text-[#36322d]">No skills created yet</p>
              <p className="text-[13px] mt-1 text-center">Create reusable workflows to automate common tasks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
