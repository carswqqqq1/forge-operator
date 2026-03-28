import { useState } from "react";
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface APIKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  createdAt: Date;
  lastUsed?: Date;
  status: "active" | "revoked";
}

interface APIKeyManagementProps {
  keys?: APIKey[];
  onCreateKey?: (name: string) => void;
  onRevokeKey?: (keyId: string) => void;
  onRegenerateKey?: (keyId: string) => void;
}

export default function APIKeyManagement({
  keys = [
    {
      id: "1",
      name: "Production API Key",
      key: "sk_prod_1234567890abcdefghijklmnopqrst",
      maskedKey: "sk_prod_...qrst",
      createdAt: new Date("2025-01-15"),
      lastUsed: new Date(Date.now() - 2 * 60000),
      status: "active",
    },
  ],
  onCreateKey = () => {},
  onRevokeKey = () => {},
  onRegenerateKey = () => {},
}: APIKeyManagementProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreateKey = () => {
    if (keyName) {
      onCreateKey(keyName);
      setKeyName("");
      setCreateOpen(false);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) =>
      prev.includes(keyId) ? prev.filter((id) => id !== keyId) : [...prev, keyId]
    );
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Key className="w-4 h-4" />
          <span className="hidden sm:inline">API Keys</span>
          <span className="sm:hidden">API</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Key */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2 bg-primary text-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Create API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key-name" className="text-sm font-medium mb-2 block">
                    Key Name
                  </Label>
                  <Input
                    id="key-name"
                    placeholder="e.g., Production, Development, Testing"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateKey}
                  disabled={!keyName}
                  className="w-full bg-primary text-foreground hover:bg-primary/90"
                >
                  Create Key
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Keys List */}
          <div className="space-y-3">
            {keys.map((apiKey) => (
              <Card
                key={apiKey.id}
                className="p-4 border-2 border-dashed border-primary/20"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{apiKey.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {apiKey.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        apiKey.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {apiKey.status === "active" ? "Active" : "Revoked"}
                    </span>
                  </div>

                  {/* Key Display */}
                  <div className="flex gap-2 items-center">
                    <Input
                      type={visibleKeys.includes(apiKey.id) ? "text" : "password"}
                      value={apiKey.key}
                      readOnly
                      className="text-xs font-mono bg-muted"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="flex-shrink-0"
                    >
                      {visibleKeys.includes(apiKey.id) ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyKey(apiKey.key)}
                      className="flex-shrink-0 gap-1"
                    >
                      {copied === apiKey.key ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="hidden sm:inline">Copy</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Last Used */}
                  {apiKey.lastUsed && (
                    <p className="text-xs text-muted-foreground">
                      Last used {apiKey.lastUsed.toLocaleString()}
                    </p>
                  )}

                  {/* Actions */}
                  {apiKey.status === "active" && (
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                        onClick={() => onRegenerateKey(apiKey.id)}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => onRevokeKey(apiKey.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Revoke
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Documentation */}
          <Card className="p-4 bg-accent/5 border border-accent/20">
            <h4 className="font-medium text-sm mb-2">API Documentation</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                <strong>Base URL:</strong> https://api.forge-operator.com/v1
              </p>
              <p>
                <strong>Authentication:</strong> Include your API key in the Authorization header
              </p>
              <code className="block bg-muted p-2 rounded mt-2">
                Authorization: Bearer sk_prod_...
              </code>
              <p className="mt-2">
                <a href="#" className="text-primary hover:text-accent transition-colors">
                  View full API documentation →
                </a>
              </p>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
