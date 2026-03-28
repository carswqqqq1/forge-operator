/**
 * Connectors Settings Component
 * Manage Google Drive and Gmail connections
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, FileText, CheckCircle2, XCircle, Loader2, Link2, Unplug 
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ConnectorStatus {
  type: "google_drive" | "gmail";
  connected: boolean;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export default function ConnectorsSettings() {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([
    {
      type: "google_drive",
      connected: false,
      name: "Google Drive",
      icon: <FileText className="h-5 w-5" />,
      description: "Access and manage files from your Google Drive",
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    {
      type: "gmail",
      connected: false,
      name: "Gmail",
      icon: <Mail className="h-5 w-5" />,
      description: "Access and search emails from your Gmail account",
      color: "bg-red-500/10 text-red-500 border-red-500/20",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  // Fetch connected services on mount
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

  const handleConnect = async (service: "google_drive" | "gmail") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/connectors/google/auth?service=${service === "google_drive" ? "drive" : "gmail"}`, {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to initiate authentication");

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast.error(`Failed to connect ${service === "google_drive" ? "Google Drive" : "Gmail"}`);
      console.error("[ConnectorsSettings] Connection failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (service: "google_drive" | "gmail") => {
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

      toast.success(`${service === "google_drive" ? "Google Drive" : "Gmail"} disconnected`);
    } catch (error) {
      toast.error(`Failed to disconnect ${service === "google_drive" ? "Google Drive" : "Gmail"}`);
      console.error("[ConnectorsSettings] Disconnection failed:", error);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Connected Services</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Google account to access Drive files and Gmail messages
        </p>
      </div>

      <div className="grid gap-4">
        {connectors.map((connector) => (
          <Card key={connector.type} className="bg-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`h-10 w-10 rounded-lg ${connector.color} flex items-center justify-center flex-shrink-0`}>
                    {connector.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium">{connector.name}</h3>
                      {connector.connected ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] h-5">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">
                          Not connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{connector.description}</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {connector.connected ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDisconnect(connector.type)}
                      disabled={disconnecting === connector.type}
                    >
                      {disconnecting === connector.type ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Unplug className="h-3 w-3 mr-1" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleConnect(connector.type)}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3 w-3 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            What can you do?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="text-xs font-medium mb-2">Google Drive</h4>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>List and browse your Drive files</li>
              <li>Search for specific files</li>
              <li>Download file contents</li>
              <li>Access file metadata</li>
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="text-xs font-medium mb-2">Gmail</h4>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>List and search emails</li>
              <li>View email threads</li>
              <li>Access email labels</li>
              <li>Read email content and metadata</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
