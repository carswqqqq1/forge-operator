/**
 * Connector Routes
 * Handles OAuth flows and connector operations for Google Drive, Gmail, etc.
 */

import type { Express, Request, Response } from "express";
import * as db from "../db";
import { ConnectorManager } from "../connectors/manager";
import { authenticateRequest } from "../_core/middleware";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

let connectorManager: ConnectorManager | null = null;

function getConnectorManager(): ConnectorManager {
  if (!connectorManager) {
    connectorManager = new ConnectorManager({
      googleClientId: GOOGLE_CLIENT_ID,
      googleClientSecret: GOOGLE_CLIENT_SECRET,
      githubClientId: GITHUB_CLIENT_ID,
      githubClientSecret: GITHUB_CLIENT_SECRET,
      appUrl: APP_URL,
    });
  }
  return connectorManager;
}

function connectorAuthResponseHtml(payload: { connector: string; status: "connected" | "error"; error?: string }) {
  const safeJson = JSON.stringify(payload).replace(/</g, "\\u003c");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Forge connector auth</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f6f5f2;
        color: #1f1c18;
        font-family: Inter, system-ui, -apple-system, sans-serif;
      }
      .card {
        display: grid;
        gap: 8px;
        padding: 24px 28px;
        border: 1px solid #e5e0d7;
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 18px 50px rgba(42, 37, 30, 0.08);
        text-align: center;
      }
      .title { font-size: 18px; font-weight: 600; letter-spacing: -0.03em; }
      .sub { font-size: 13px; color: #7a746c; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="title">Returning to Forge...</div>
      <div class="sub">You can close this window if it does not close automatically.</div>
    </div>
    <script>
      (function () {
        const payload = ${safeJson};
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: "forge:connector-auth", ...payload }, window.location.origin);
          }
        } catch (error) {
          console.error(error);
        }
        setTimeout(() => window.close(), 250);
      })();
    </script>
  </body>
</html>`;
}

export function registerConnectorRoutes(app: Express) {
  /**
   * Initiate Google OAuth flow for Drive and Gmail
   * GET /api/connectors/google/auth?service=drive|gmail
   */
  app.get("/api/connectors/google/auth", async (req: Request, res: Response) => {
    try {
      const service = (req.query.service as string) || "drive";
      const user = await authenticateRequest(req);

      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({ error: "Google OAuth not configured" });
      }

      const manager = getConnectorManager();
      let connector;

      if (service === "gmail") {
        connector = await manager.getGmailConnector(user.id);
      } else {
        connector = await manager.getGoogleDriveConnector(user.id);
      }

      const state = Buffer.from(
        JSON.stringify({ userId: user.id, service, timestamp: Date.now() })
      ).toString("base64");

      const authUrl = connector.getAuthorizationUrl(state);
      res.json({ authUrl });
    } catch (error) {
      console.error("[Connectors] Auth initiation failed:", error);
      res.status(500).json({ error: "Failed to initiate authentication" });
    }
  });

  /**
   * Handle OAuth callback from Google
   * GET /api/connectors/google/callback?code=...&state=...
   */
  app.get("/api/connectors/google/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      // Handle user denial
      if (error) {
        console.warn("[Connectors] Google OAuth denied:", error);
        return res.send(
          connectorAuthResponseHtml({
            connector: service || "google",
            status: "error",
            error,
          }),
        );
      }

      if (!code || !state) {
        return res.send(
          connectorAuthResponseHtml({
            connector: service || "google",
            status: "error",
            error: "missing_code_or_state",
          }),
        );
      }

      let stateData;
      try {
        stateData = JSON.parse(Buffer.from(state, "base64").toString());
      } catch (e) {
        console.error("[Connectors] Invalid state:", e);
        return res.redirect("/connectors?error=invalid_state");
      }

      const { userId, service } = stateData;
      const manager = getConnectorManager();
      let connector;

      if (service === "gmail") {
        connector = await manager.getGmailConnector(userId);
      } else {
        connector = await manager.getGoogleDriveConnector(userId);
      }

      const tokenState = await connector.exchangeCodeForToken(code);
      tokenState.userId = userId.toString();

      await manager.saveConnectorState(
        userId,
        service === "gmail" ? "gmail" : "google_drive",
        tokenState
      );

      console.log(`[Connectors] Successfully connected ${service}`);
      res.send(
        connectorAuthResponseHtml({
          connector: service,
          status: "connected",
        }),
      );
    } catch (error) {
      console.error("[Connectors] Google callback failed:", error);
      res.send(
        connectorAuthResponseHtml({
          connector: "google",
          status: "error",
          error: "callback_failed",
        }),
      );
    }
  });

  /**
   * Initiate GitHub OAuth flow
   * GET /api/connectors/github/auth
   */
  app.get("/api/connectors/github/auth", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);

      if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.status(400).json({ error: "GitHub OAuth not configured" });
      }

      const manager = getConnectorManager();
      const connector = await manager.getGitHubConnector(user.id);

      const state = Buffer.from(
        JSON.stringify({ userId: user.id, service: "github", timestamp: Date.now() })
      ).toString("base64");

      const authUrl = connector.getAuthorizationUrl(state);
      res.json({ authUrl });
    } catch (error) {
      console.error("[Connectors] GitHub auth initiation failed:", error);
      res.status(500).json({ error: "Failed to initiate GitHub authentication" });
    }
  });

  /**
   * Handle OAuth callback from GitHub
   * GET /api/connectors/github/callback?code=...&state=...
   */
  app.get("/api/connectors/github/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const state = req.query.state as string;
      const error = req.query.error as string;

      // Handle user denial
      if (error) {
        console.warn("[Connectors] GitHub OAuth denied:", error);
        return res.send(
          connectorAuthResponseHtml({
            connector: "github",
            status: "error",
            error,
          }),
        );
      }

      if (!code || !state) {
        return res.send(
          connectorAuthResponseHtml({
            connector: "github",
            status: "error",
            error: "missing_code_or_state",
          }),
        );
      }

      let stateData;
      try {
        stateData = JSON.parse(Buffer.from(state, "base64").toString());
      } catch (e) {
        console.error("[Connectors] Invalid state:", e);
        return res.redirect("/connectors?error=invalid_state");
      }

      const { userId } = stateData;
      const manager = getConnectorManager();
      const connector = await manager.getGitHubConnector(userId);

      const tokenState = await connector.exchangeCodeForToken(code);
      tokenState.userId = userId.toString();

      await manager.saveConnectorState(userId, "github", tokenState);

      console.log("[Connectors] Successfully connected GitHub");
      res.send(
        connectorAuthResponseHtml({
          connector: "github",
          status: "connected",
        }),
      );
    } catch (error) {
      console.error("[Connectors] GitHub callback failed:", error);
      res.send(
        connectorAuthResponseHtml({
          connector: "github",
          status: "error",
          error: "callback_failed",
        }),
      );
    }
  });

  /**
   * Save a personal access token for GitHub
   * POST /api/connectors/github/token
   * Body: { token: string }
   */
  app.post("/api/connectors/github/token", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";

      if (!token) {
        return res.status(400).json({ error: "GitHub token is required" });
      }

      const validationResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Forge",
        },
      });

      if (!validationResponse.ok) {
        const payload = await validationResponse.json().catch(() => null);
        const message = payload?.message || "Invalid GitHub token";
        return res.status(400).json({ error: message });
      }

      const manager = getConnectorManager();
      await manager.saveConnectorState(user.id, "github", {
        accessToken: token,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365 * 10,
        userId: String(user.id),
      });

      const userInfo = await validationResponse.json().catch(() => null);
      res.json({
        success: true,
        login: userInfo?.login || null,
        name: userInfo?.name || null,
      });
    } catch (error) {
      console.error("[Connectors] GitHub token save failed:", error);
      res.status(500).json({ error: "Failed to save GitHub token" });
    }
  });

  /**
   * Get connected GitHub repositories
   * GET /api/connectors/github/repos
   */
  app.get("/api/connectors/github/repos", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const manager = getConnectorManager();
      const connector = await manager.getGitHubConnector(user.id);
      const state = await manager.getConnectorState(user.id, "github");
      const repoState = state?.state ? JSON.parse(state.state) : {};
      const repositories = await connector.listRepositories(1, 100);
      res.json({
        repositories,
        selectedRepos: Array.isArray(repoState?.selectedRepos) ? repoState.selectedRepos : [],
        enabled: repoState?.enabled !== false,
      });
    } catch (error) {
      console.error("[Connectors] GitHub repo list failed:", error);
      res.status(500).json({ error: "Failed to list GitHub repositories" });
    }
  });

  /**
   * Save GitHub connector state
   * POST /api/connectors/github/state
   * Body: { selectedRepos?: string[], enabled?: boolean }
   */
  app.post("/api/connectors/github/state", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const selectedRepos = Array.isArray(req.body?.selectedRepos) ? req.body.selectedRepos.map(String) : [];
      const enabled = req.body?.enabled !== false;

      const manager = getConnectorManager();
      const existing = await manager.getConnectorState(user.id, "github");
      if (!existing) {
        return res.status(404).json({ error: "GitHub is not connected" });
      }

      await manager.saveConnectorState(user.id, "github", {
        accessToken: existing.accessToken,
        refreshToken: existing.refreshToken || undefined,
        expiresAt: existing.expiresAt,
        userId: existing.userId || String(user.id),
        state: JSON.stringify({ selectedRepos, enabled }),
      });

      res.json({ success: true, selectedRepos, enabled });
    } catch (error) {
      console.error("[Connectors] GitHub state save failed:", error);
      res.status(500).json({ error: "Failed to save GitHub state" });
    }
  });

  /**
   * List connected services for current user
   * GET /api/connectors/list
   */
  app.get("/api/connectors/list", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const manager = getConnectorManager();
      const connectedServices = await manager.listConnectedServices(user.id);

      res.json({ connectedServices });
    } catch (error) {
      console.error("[Connectors] List failed:", error);
      res.status(500).json({ error: "Failed to list connected services" });
    }
  });

  /**
   * Disconnect a service
   * POST /api/connectors/disconnect
   * Body: { service: "google_drive" | "gmail" }
   */
  app.post("/api/connectors/disconnect", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const { service } = req.body;

      if (!service) {
        return res.status(400).json({ error: "Service is required" });
      }

      const manager = getConnectorManager();
      await manager.revokeConnectorAccess(user.id, service);

      res.json({ success: true });
    } catch (error) {
      console.error("[Connectors] Disconnect failed:", error);
      res.status(500).json({ error: "Failed to disconnect service" });
    }
  });

  /**
   * List files from Google Drive
   * GET /api/connectors/google-drive/files?pageSize=10&pageToken=...
   */
  app.get("/api/connectors/google-drive/files", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const pageToken = req.query.pageToken as string;

      const manager = getConnectorManager();
      const connector = await manager.getGoogleDriveConnector(user.id);

      const result = await connector.listFiles(pageSize, pageToken);
      res.json(result);
    } catch (error) {
      console.error("[Connectors] List Drive files failed:", error);
      res.status(500).json({ error: "Failed to list Drive files" });
    }
  });

  /**
   * Get file metadata from Google Drive
   * GET /api/connectors/google-drive/files/:fileId
   */
  app.get("/api/connectors/google-drive/files/:fileId", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const { fileId } = req.params;

      const manager = getConnectorManager();
      const connector = await manager.getGoogleDriveConnector(user.id);

      const metadata = await connector.getFileMetadata(fileId);
      res.json(metadata);
    } catch (error) {
      console.error("[Connectors] Get Drive file metadata failed:", error);
      res.status(500).json({ error: "Failed to get file metadata" });
    }
  });

  /**
   * Search files in Google Drive
   * GET /api/connectors/google-drive/search?q=...&pageSize=10
   */
  app.get("/api/connectors/google-drive/search", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const query = req.query.q as string;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const manager = getConnectorManager();
      const connector = await manager.getGoogleDriveConnector(user.id);

      const result = await connector.searchFiles(query, pageSize);
      res.json(result);
    } catch (error) {
      console.error("[Connectors] Search Drive files failed:", error);
      res.status(500).json({ error: "Failed to search Drive files" });
    }
  });

  /**
   * Download file content from Google Drive
   * GET /api/connectors/google-drive/download/:fileId
   */
  app.get("/api/connectors/google-drive/download/:fileId", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const { fileId } = req.params;

      const manager = getConnectorManager();
      const connector = await manager.getGoogleDriveConnector(user.id);

      const buffer = await connector.downloadFile(fileId);
      res.setHeader("Content-Type", "application/octet-stream");
      res.send(buffer);
    } catch (error) {
      console.error("[Connectors] Download Drive file failed:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  /**
   * List Gmail labels
   * GET /api/connectors/gmail/labels
   */
  app.get("/api/connectors/gmail/labels", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);

      const manager = getConnectorManager();
      const connector = await manager.getGmailConnector(user.id);

      const labels = await connector.listLabels();
      res.json({ labels });
    } catch (error) {
      console.error("[Connectors] List Gmail labels failed:", error);
      res.status(500).json({ error: "Failed to list Gmail labels" });
    }
  });

  /**
   * List Gmail messages
   * GET /api/connectors/gmail/messages?query=...&labelId=...&pageSize=10&pageToken=...
   */
  app.get("/api/connectors/gmail/messages", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const query = req.query.query as string;
      const labelId = req.query.labelId as string;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const pageToken = req.query.pageToken as string;

      const manager = getConnectorManager();
      const connector = await manager.getGmailConnector(user.id);

      const result = await connector.listMessages(query, labelId, pageSize, pageToken);
      res.json(result);
    } catch (error) {
      console.error("[Connectors] List Gmail messages failed:", error);
      res.status(500).json({ error: "Failed to list Gmail messages" });
    }
  });

  /**
   * Get Gmail message details
   * GET /api/connectors/gmail/messages/:messageId
   */
  app.get("/api/connectors/gmail/messages/:messageId", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const { messageId } = req.params;

      const manager = getConnectorManager();
      const connector = await manager.getGmailConnector(user.id);

      const message = await connector.getMessageDetails(messageId);
      res.json(message);
    } catch (error) {
      console.error("[Connectors] Get Gmail message failed:", error);
      res.status(500).json({ error: "Failed to get message details" });
    }
  });

  /**
   * Search Gmail messages
   * GET /api/connectors/gmail/search?q=...&pageSize=10
   */
  app.get("/api/connectors/gmail/search", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const query = req.query.q as string;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const manager = getConnectorManager();
      const connector = await manager.getGmailConnector(user.id);

      const result = await connector.searchMessages(query, pageSize);
      res.json(result);
    } catch (error) {
      console.error("[Connectors] Search Gmail messages failed:", error);
      res.status(500).json({ error: "Failed to search Gmail messages" });
    }
  });

  /**
   * Get Gmail thread
   * GET /api/connectors/gmail/threads/:threadId
   */
  app.get("/api/connectors/gmail/threads/:threadId", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const { threadId } = req.params;

      const manager = getConnectorManager();
      const connector = await manager.getGmailConnector(user.id);

      const messages = await connector.getThread(threadId);
      res.json({ messages });
    } catch (error) {
      console.error("[Connectors] Get Gmail thread failed:", error);
      res.status(500).json({ error: "Failed to get thread" });
    }
  });
}
