/**
 * Connector Manager
 * Manages lifecycle of external service connectors (Google Drive, Gmail, etc.)
 */

import * as db from "../db";
import { GoogleDriveConnector, type GoogleDriveConnectorState } from "./google-drive";
import { GmailConnector, type GmailConnectorState } from "./gmail";

export type ConnectorType = "google_drive" | "gmail";
export type ConnectorState = GoogleDriveConnectorState | GmailConnectorState;

export interface ConnectorConfig {
  googleClientId: string;
  googleClientSecret: string;
  appUrl: string;
}

class ConnectorManager {
  private config: ConnectorConfig;
  private driveConnectors: Map<string, GoogleDriveConnector> = new Map();
  private gmailConnectors: Map<string, GmailConnector> = new Map();

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  /**
   * Get or create a Google Drive connector for a user
   */
  async getGoogleDriveConnector(userId: number): Promise<GoogleDriveConnector> {
    const cacheKey = `drive_${userId}`;

    if (this.driveConnectors.has(cacheKey)) {
      return this.driveConnectors.get(cacheKey)!;
    }

    const connector = new GoogleDriveConnector({
      clientId: this.config.googleClientId,
      clientSecret: this.config.googleClientSecret,
      redirectUri: `${this.config.appUrl}/api/connectors/google/callback`,
    });

    // Load stored credentials if available
    try {
      const state = await db.getConnectorState(userId, "google_drive");
      if (state) {
        connector.setCredentials(state as GoogleDriveConnectorState);
      }
    } catch (error) {
      console.warn("[ConnectorManager] Failed to load Google Drive credentials:", error);
    }

    this.driveConnectors.set(cacheKey, connector);
    return connector;
  }

  /**
   * Get or create a Gmail connector for a user
   */
  async getGmailConnector(userId: number): Promise<GmailConnector> {
    const cacheKey = `gmail_${userId}`;

    if (this.gmailConnectors.has(cacheKey)) {
      return this.gmailConnectors.get(cacheKey)!;
    }

    const connector = new GmailConnector({
      clientId: this.config.googleClientId,
      clientSecret: this.config.googleClientSecret,
      redirectUri: `${this.config.appUrl}/api/connectors/google/callback`,
    });

    // Load stored credentials if available
    try {
      const state = await db.getConnectorState(userId, "gmail");
      if (state) {
        connector.setCredentials(state as GmailConnectorState);
      }
    } catch (error) {
      console.warn("[ConnectorManager] Failed to load Gmail credentials:", error);
    }

    this.gmailConnectors.set(cacheKey, connector);
    return connector;
  }

  /**
   * Save connector state to database
   */
  async saveConnectorState(
    userId: number,
    connectorType: ConnectorType,
    state: ConnectorState
  ): Promise<void> {
    try {
      await db.saveConnectorState(userId, connectorType, state);
      console.log(`[ConnectorManager] Saved ${connectorType} state for user ${userId}`);
    } catch (error) {
      console.error(`[ConnectorManager] Failed to save ${connectorType} state:`, error);
      throw error;
    }
  }

  /**
   * Get connector state from database
   */
  async getConnectorState(
    userId: number,
    connectorType: ConnectorType
  ): Promise<ConnectorState | null> {
    try {
      return await db.getConnectorState(userId, connectorType);
    } catch (error) {
      console.error(`[ConnectorManager] Failed to get ${connectorType} state:`, error);
      return null;
    }
  }

  /**
   * Revoke connector access
   */
  async revokeConnectorAccess(
    userId: number,
    connectorType: ConnectorType
  ): Promise<void> {
    try {
      // Remove from cache
      const cacheKey = `${connectorType.split("_")[0]}_${userId}`;
      this.driveConnectors.delete(cacheKey);
      this.gmailConnectors.delete(cacheKey);

      // Remove from database
      await db.deleteConnectorState(userId, connectorType);
      console.log(`[ConnectorManager] Revoked ${connectorType} access for user ${userId}`);
    } catch (error) {
      console.error(`[ConnectorManager] Failed to revoke ${connectorType} access:`, error);
      throw error;
    }
  }

  /**
   * List all connected services for a user
   */
  async listConnectedServices(userId: number): Promise<ConnectorType[]> {
    try {
      const states = await db.listConnectorStates(userId);
      return states as ConnectorType[];
    } catch (error) {
      console.error("[ConnectorManager] Failed to list connected services:", error);
      return [];
    }
  }

  /**
   * Clear all cached connectors (useful for testing or logout)
   */
  clearCache(): void {
    this.driveConnectors.clear();
    this.gmailConnectors.clear();
  }
}

export { ConnectorManager };
