/**
 * Connectors Settings Component
 * Manage Google Drive, Gmail, and GitHub connections - Ultra Compact
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, FileText, CheckCircle2, Loader2, Github, RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type ConnectorType = "google_drive" | "gmail" | "github";

interface ConnectorStatus {
  type: ConnectorType;
  connected: boolean;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export default function ConnectorsSettings() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([
    {
      type: "github",
      connected: false,
      name: "GitHub",
      icon: <Github className="h-4 w-4" />,
      description: "Access repositories, code, and repo summaries",
      color: "bg-zinc-900/10 text-zinc-900 border-zinc-900/20 dark:bg-white/10 dark:text-white dark:border-white/20",
    },
    {
      type: "gmail",
      connected: false,
      name: "Gmail",
      icon: <Mail className="h-4 w-4" />,
      description: "Inbox search, email drafting, and thread summaries",
      color: "bg-red-500/10 text-red-500 border-red-500/20",
    },
    {
      type: "google_drive",
      connected: false,
      name: "Google Drive",
      icon: <FileText className="h-4 w-4" />,
      description: "Docs, files, search, and repo summaries",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
  ]);

  const [loading, setLoading] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectorStatus();
  }, []);

  const fetchConnectorStatus = async () => {
    try {
      const response = await fetch("/api/connectors/list", {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch connector status");

      const data = await response.json();
      const connectedServices = data.connectedServices || [];

      setConnectors((prev) =>
        prev.map((connector) => ({
          ...connector,
          connected: connectedServices.includes(connector.type),
        }))
      );
    } catch (error) {
      console.error("[ConnectorsSettings] Failed to fetch status:", error);
    }
  };

  const handleConnect = async (service: ConnectorType) => {
    setLoading(service);
    try {
      let authEndpoint = "";
      if (service === "github") {
        authEndpoint = "/api/connectors/github/auth";
      } else {
        authEndpoint = `/api/connectors/google/auth?service=${service === "google_drive" ? "drive" : "gmail"}`;
      }

      const response = await fetch(authEndpoint, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate authentication");
      }

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast.error(`Failed to connect ${service.replace("_", " ")}`);
      console.error("[ConnectorsSettings] Connection failed:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (service: ConnectorType) => {
    setDisconnecting(service);
    try {
      const response = await fetch("/api/connectors/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ service }),
      });

      if (!response.ok) throw new Error("Failed to disconnect");

      setConnectors((prev) =>
        prev.map((connector) =>
          connector.type === service ? { ...connector, connected: false } : connector
        )
      );

      toast.success(`${service.replace("_", " ")} disconnected`);
    } catch (error) {
      toast.error(`Failed to disconnect ${service.replace("_", " ")}`);
      console.error("[ConnectorsSettings] Disconnection failed:", error);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-3 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Connected Services</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Connect your accounts to access files, emails, and code repositories
        </p>
      </div>

      <div className="grid gap-3">
        {connectors.map((connector) => (
          <Card key={connector.type} className="bg-card border-border/50 overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                {/* Left: Icon + Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-9 w-9 rounded-lg ${connector.color} flex items-center justify-center flex-shrink-0 border`}>
                    {connector.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{connector.name}</h3>
                      {connector.connected && (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] h-5 font-medium">
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{connector.description}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {connector.connected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs font-bold px-2"
                        onClick={() => fetchConnectorStatus()}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs font-bold px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDisconnect(connector.type)}
                        disabled={disconnecting === connector.type}
                      >
                        {disconnecting === connector.type ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs font-bold px-3 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                      onClick={() => handleConnect(connector.type)}
                      disabled={loading === connector.type}
                    >
                      {loading === connector.type ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      Authorize {connector.name}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
