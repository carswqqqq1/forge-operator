/**
 * Connectors Settings Component
 * Manage Google Drive, Gmail, and GitHub connections
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, FileText, CheckCircle2, Loader2, Link2, Unplug, Github, RefreshCw, ExternalLink
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
  capabilities: string[];
  envVars: string[];
}

export default function ConnectorsSettings() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([
    {
      type: "github",
      connected: false,
      name: "GitHub",
      icon: <Github className="h-5 w-5" />,
      description: "Access your GitHub repositories directly in Forge to analyze, search, and cite code.",
      color: "bg-zinc-900/10 text-zinc-900 border-zinc-900/20 dark:bg-white/10 dark:text-white dark:border-white/20",
      capabilities: [
        "Access your GitHub repositories directly in ChatGPT to analyze, search, and cite code.",
        "Ask questions based on your own code.",
        "Pull live data from your repositories—code, README files, and other docs."
      ],
      envVars: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "APP_URL"]
    },
    {
      type: "gmail",
      connected: false,
      name: "Gmail",
      icon: <Mail className="h-5 w-5" />,
      description: "Inbox search, email drafting, and thread summaries",
      color: "bg-red-500/10 text-red-500 border-red-500/20",
      capabilities: [
        "Search inbox threads and summarize the highest-priority conversations",
        "Draft replies and follow-ups from task context",
        "Use email history as memory for campaigns and automations"
      ],
      envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "APP_URL"]
    },
    {
      type: "google_drive",
      connected: false,
      name: "Google Drive",
      icon: <FileText className="h-5 w-5" />,
      description: "Docs, files, search, and repo summaries",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      capabilities: [
        "List and browse your Drive files",
        "Search for specific files",
        "Download file contents",
        "Access file metadata"
      ],
      envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "APP_URL"]
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Connected Services</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your accounts to access files, emails, and code repositories
        </p>
      </div>

      <div className="grid gap-6">
        {connectors.map((connector) => (
          <Card key={connector.type} className="bg-card border-border/50 overflow-hidden">
            <CardContent className="p-0">
              {/* Header Section */}
              <div className="p-4 flex items-center justify-between border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${connector.color} flex items-center justify-center flex-shrink-0 border`}>
                    {connector.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold">{connector.name}</h3>
                      {connector.connected && (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] h-5 font-medium">
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">{connector.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {connector.connected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold"
                        onClick={() => fetchConnectorStatus()}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold"
                      >
                        Try in Forge <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                      onClick={() => handleConnect(connector.type)}
                      disabled={loading === connector.type}
                    >
                      {loading === connector.type ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : `Authorize ${connector.name}`}
                    </Button>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="grid md:grid-cols-2 divide-x divide-border/50">
                {/* Left: Capabilities */}
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">What Forge can do</h4>
                    <ul className="space-y-2">
                      {connector.capabilities.map((cap, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Required env / auth</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {connector.envVars.map((env) => (
                        <code key={env} className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border border-border/50">
                          {env}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Status/Action */}
                <div className="p-4 bg-muted/10 flex flex-col justify-center items-center text-center min-h-[160px]">
                  {connector.connected ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 text-green-500 mb-1">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-tight">{connector.name} account connected</h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                          Forge can access the connected {connector.name} account for this app and pull live context into tasks.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 w-full max-w-[280px]">
                      <div className="space-y-2">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-background text-left">
                            <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-md bg-muted text-[10px] font-bold border border-border/50">
                              {step}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground leading-tight">
                              {step === 1 && `Create a ${connector.name} OAuth App or add a token for local development.`}
                              {step === 2 && `Grant ${connector.type === 'github' ? 'repo' : 'account'} access for the resources you want Forge to inspect.`}
                              {step === 3 && `Store the token server-side so task runs can search and read resources.`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
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
