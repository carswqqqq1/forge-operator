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
const APP_URL = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

let connectorManager: ConnectorManager | null = null;

function getConnectorManager(): ConnectorManager {
  if (!connectorManager) {
    connectorManager = new ConnectorManager({
      googleClientId: GOOGLE_CLIENT_ID,
      googleClientSecret: GOOGLE_CLIENT_SECRET,
      appUrl: APP_URL,
    });
  }
  return connectorManager;
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

      if (!code || !state) {
        return res.redirect("/login?error=missing_code_or_state");
      }

      let stateData;
      try {
        stateData = JSON.parse(Buffer.from(state, "base64").toString());
      } catch {
        return res.redirect("/login?error=invalid_state");
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

      res.redirect(`/?connector=${service}&status=connected`);
    } catch (error) {
      console.error("[Connectors] Callback failed:", error);
      res.redirect("/login?error=callback_failed");
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
