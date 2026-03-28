/**
 * Google Drive Connector
 * Provides OAuth2 authentication and file operations for Google Drive
 */

import { google, drive_v3 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  createdTime?: string | null;
  modifiedTime?: string | null;
  webViewLink?: string | null;
}

export interface GoogleDriveConnectorState {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
}

class GoogleDriveConnector {
  private oauth2Client: OAuth2Client | null = null;
  private driveClient: drive_v3.Drive | null = null;
  private config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
  }

  /**
   * Initialize OAuth2 client
   */
  private initializeOAuth2Client(): OAuth2Client {
    if (this.oauth2Client) return this.oauth2Client;

    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );

    return this.oauth2Client;
  }

  /**
   * Get authorization URL for user consent
   */
  getAuthorizationUrl(state: string): string {
    const oauth2Client = this.initializeOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/drive.metadata.readonly",
      ],
      state,
      prompt: "consent",
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GoogleDriveConnectorState> {
    const oauth2Client = this.initializeOAuth2Client();

    try {
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error("No access token received from Google");
      }

      oauth2Client.setCredentials(tokens);

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: tokens.expiry_date || Date.now() + 3600000,
        userId: "", // Will be populated after fetching user info
      };
    } catch (error) {
      console.error("[GoogleDrive] Token exchange failed:", error);
      throw new Error("Failed to exchange authorization code for token");
    }
  }

  /**
   * Set credentials from stored state
   */
  setCredentials(state: GoogleDriveConnectorState): void {
    const oauth2Client = this.initializeOAuth2Client();

    oauth2Client.setCredentials({
      access_token: state.accessToken,
      refresh_token: state.refreshToken,
      expiry_date: state.expiresAt,
    });
  }

  /**
   * Get Drive API client
   */
  private getDriveClient(): drive_v3.Drive {
    if (this.driveClient) return this.driveClient;

    const oauth2Client = this.initializeOAuth2Client();
    this.driveClient = google.drive({ version: "v3", auth: oauth2Client });

    return this.driveClient;
  }

  /**
   * List files in Google Drive
   */
  async listFiles(pageSize: number = 10, pageToken?: string): Promise<{
    files: GoogleDriveFile[];
    nextPageToken?: string;
  }> {
    try {
      const drive = this.getDriveClient();

      const result = await drive.files.list({
        pageSize,
        pageToken,
        fields: "nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)",
        spaces: "drive",
        orderBy: "modifiedTime desc",
      });

      const files: GoogleDriveFile[] = (result.data.files || []).map((file) => ({
        id: file.id || "",
        name: file.name || "Untitled",
        mimeType: file.mimeType || "application/octet-stream",
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
      }));

      return {
        files,
        nextPageToken: result.data.nextPageToken || undefined,
      };
    } catch (error) {
      console.error("[GoogleDrive] Failed to list files:", error);
      throw new Error("Failed to list files from Google Drive");
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    try {
      const drive = this.getDriveClient();

      const result = await drive.files.get({
        fileId,
        fields: "id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents",
      });

      return {
        id: result.data.id || "",
        name: result.data.name || "Untitled",
        mimeType: result.data.mimeType || "application/octet-stream",
        size: result.data.size,
        createdTime: result.data.createdTime,
        modifiedTime: result.data.modifiedTime,
        webViewLink: result.data.webViewLink,
      };
    } catch (error) {
      console.error("[GoogleDrive] Failed to get file metadata:", error);
      throw new Error("Failed to get file metadata from Google Drive");
    }
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      const drive = this.getDriveClient();

      const result = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
      );

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        result.data.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        result.data.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        result.data.on("error", (error: Error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error("[GoogleDrive] Failed to download file:", error);
      throw new Error("Failed to download file from Google Drive");
    }
  }

  /**
   * Search files by query
   */
  async searchFiles(query: string, pageSize: number = 10): Promise<{
    files: GoogleDriveFile[];
  }> {
    try {
      const drive = this.getDriveClient();

      const result = await drive.files.list({
        q: query,
        pageSize,
        fields: "files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)",
        spaces: "drive",
      });

      const files: GoogleDriveFile[] = (result.data.files || []).map((file) => ({
        id: file.id || "",
        name: file.name || "Untitled",
        mimeType: file.mimeType || "application/octet-stream",
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
      }));

      return { files };
    } catch (error) {
      console.error("[GoogleDrive] Failed to search files:", error);
      throw new Error("Failed to search files in Google Drive");
    }
  }

  /**
   * Get file content as text (for text-based files)
   */
  async getFileContent(fileId: string): Promise<string> {
    try {
      const buffer = await this.downloadFile(fileId);
      return buffer.toString("utf-8");
    } catch (error) {
      console.error("[GoogleDrive] Failed to get file content:", error);
      throw new Error("Failed to get file content from Google Drive");
    }
  }
}

export { GoogleDriveConnector };
