import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Link2, Plus, Trash2, MessageCircle, Youtube, Mail, Globe, Webhook } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const connectorTypes = [
  { value: "telegram", label: "Telegram", icon: MessageCircle },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "email", label: "Email", icon: Mail },
  { value: "webhook", label: "Webhook", icon: Webhook },
  { value: "api", label: "Custom API", icon: Globe },
];

export default function Connectors() {
  const { data: connectors, refetch } = trpc.connectors.list.useQuery();
  const createConnector = trpc.connectors.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Connector created"); } });
  const deleteConnector = trpc.connectors.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Connector deleted"); } });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "telegram", config: "" });

  const getIcon = (type: string) => {
    const ct = connectorTypes.find(c => c.value === type);
    return ct ? <ct.icon className="h-4 w-4" /> : <Globe className="h-4 w-4" />;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Connectors</h1>
            <p className="text-sm text-muted-foreground mt-1">Integrate with external services and platforms</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Connector</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader><DialogTitle>Add Connector</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="My Telegram Bot" className="bg-background" /></div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {connectorTypes.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>
                          <div className="flex items-center gap-2"><ct.icon className="h-3.5 w-3.5" />{ct.label}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Configuration (JSON)</Label><Textarea value={form.config} onChange={e => setForm(p => ({ ...p, config: e.target.value }))} placeholder='{"token": "...", "chat_id": "..."}' rows={5} className="bg-background font-mono text-xs" /></div>
                <Button onClick={() => { if (!form.name) { toast.error("Name required"); return; } createConnector.mutate(form); }} disabled={createConnector.isPending} className="w-full">Add Connector</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3">
          {connectors?.length ? connectors.map(conn => (
            <Card key={conn.id} className="bg-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getIcon(conn.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium">{conn.name}</h3>
                        <Badge variant="outline" className="text-[10px] h-5">{conn.type}</Badge>
                        <Badge variant={conn.status === "active" ? "default" : conn.status === "error" ? "destructive" : "secondary"} className="text-[10px] h-5">{conn.status}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Created {new Date(conn.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteConnector.mutate({ id: conn.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Link2 className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No connectors configured</p>
              <p className="text-xs mt-1">Connect Telegram, YouTube, email, and more</p>
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
