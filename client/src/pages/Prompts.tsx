
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
    <div className="h-full bg-[#f6f5f2] overflow-y-auto">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] font-semibold tracking-[-0.03em] text-[#1a1816]">System Prompts</h1>
            <p className="text-[14px] text-[#7a746c] mt-1">Manage agent personalities and behavior presets</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <button 
                className="bg-[#1a1816] text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5 hover:bg-[#36322d] transition-colors"
                onClick={() => { setForm({ name: "", description: "", content: "" }); setEditing(null); }}
              >
                <Plus className="h-4 w-4" />
                New Prompt
              </button>
            </DialogTrigger>
            <DialogContent className="bg-white border border-[#e8e4dc] rounded-2xl max-w-2xl p-6">
              <h2 className="font-serif text-[24px] font-semibold tracking-[-0.03em] text-[#1a1816] mb-4">{editing ? "Edit Prompt" : "Create Prompt"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] text-[#36322d] mb-1.5 block font-medium">Name</label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
                    placeholder="Agent Name" 
                    className="w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2 text-[14px] text-[#36322d] placeholder:text-[#7a746c] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50 transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#36322d] mb-1.5 block font-medium">Description</label>
                  <input 
                    value={form.description} 
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                    placeholder="A brief summary of the prompt's purpose" 
                    className="w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2 text-[14px] text-[#36322d] placeholder:text-[#7a746c] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50 transition-shadow"
                  />
                </div>
                <div>
                  <label className="text-[13px] text-[#36322d] mb-1.5 block font-medium">System Prompt</label>
                  <textarea 
                    value={form.content} 
                    onChange={e => setForm(p => ({ ...p, content: e.target.value }))} 
                    placeholder="You are a helpful assistant..." 
                    rows={10} 
                    className="w-full rounded-xl border border-[#e8e4dc] bg-white px-3 py-2 text-[14px] text-[#36322d] placeholder:text-[#7a746c] focus:outline-none focus:ring-2 focus:ring-[#1a1816]/50 transition-shadow font-mono text-xs leading-relaxed"
                  />
                </div>
                <button 
                  onClick={handleSave} 
                  disabled={createPrompt.isPending || updatePrompt.isPending}
                  className="w-full bg-[#1a1816] text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#36322d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? "Update Prompt" : "Create Prompt"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {prompts?.length ? prompts.map(prompt => (
            <div key={prompt.id} className="bg-white border border-[#e8e4dc] rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-semibold text-[#36322d]">{prompt.name}</h3>
                    {prompt.isDefault && 
                      <span className="rounded-md bg-[#efede8] px-2 py-0.5 text-[11px] text-[#7a746c] font-medium flex items-center gap-1">
                        <Star className="h-3 w-3" />Default
                      </span>
                    }
                  </div>
                  {prompt.description && <p className="text-[13px] text-[#7a746c]">{prompt.description}</p>}
                  <pre className="text-[12px] font-mono text-[#7a746c] mt-3 bg-[#f6f5f2] rounded-lg p-3 max-h-24 overflow-hidden leading-relaxed whitespace-pre-wrap border border-[#e8e4dc]">{prompt.content.slice(0, 300)}{prompt.content.length > 300 ? "..." : ""}</pre>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#f3f0ea] text-[#36322d] hover:bg-[#e8e4dc] transition-colors" onClick={() => startEdit(prompt)}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!prompt.isDefault && (
                    <button className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#f3f0ea] text-[#36322d] hover:bg-[#e8e4dc] hover:text-red-600 transition-colors" onClick={() => deletePrompt.mutate({ id: prompt.id })}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#7a746c] bg-white/50 border border-[#e8e4dc] rounded-2xl">
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#f3f0ea] mb-3">
                <BookOpen className="h-6 w-6 text-[#7a746c]" />
              </div>
              <p className="text-[14px] font-medium text-[#36322d]">No System Prompts</p>
              <p className="text-[13px] text-[#7a746c]">Create a new prompt to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

