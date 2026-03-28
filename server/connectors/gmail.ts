/**
 * Gmail Connector
 * Provides OAuth2 authentication and email operations for Gmail
 */

import { google, gmail_v1 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[] | null;
  snippet: string;
  internalDate: string;
  headers?: Record<string, string>;
  from?: string | null;
  to?: string | null;
  subject?: string | null;
  body?: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  messageCount?: number | null;
  messageListVisibility?: string | null;
  labelListVisibility?: string | null;
}

export interface GmailConnectorState {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
}

class GmailConnector {
  private oauth2Client: OAuth2Client | null = null;
  private gmailClient: gmail_v1.Gmail | null = null;
  private config: GmailConfig;

  constructor(config: GmailConfig) {
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
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.labels",
      ],
      state,
      prompt: "consent",
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GmailConnectorState> {
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
      console.error("[Gmail] Token exchange failed:", error);
      throw new Error("Failed to exchange authorization code for token");
    }
  }

  /**
   * Set credentials from stored state
   */
  setCredentials(state: GmailConnectorState): void {
    const oauth2Client = this.initializeOAuth2Client();

    oauth2Client.setCredentials({
      access_token: state.accessToken,
      refresh_token: state.refreshToken,
      expiry_date: state.expiresAt,
    });
  }

  /**
   * Get Gmail API client
   */
  private getGmailClient(): gmail_v1.Gmail {
    if (this.gmailClient) return this.gmailClient;

    const oauth2Client = this.initializeOAuth2Client();
    this.gmailClient = google.gmail({ version: "v1", auth: oauth2Client });

    return this.gmailClient;
  }

  /**
   * List labels
   */
  async listLabels(): Promise<GmailLabel[]> {
    try {
      const gmail = this.getGmailClient();

      const result = await gmail.users.labels.list({
        userId: "me",
      });

      return (result.data.labels || []).map((label) => ({
        id: label.id || "",
        name: label.name || "Untitled",
        messageCount: label.messagesTotal,
        messageListVisibility: label.messageListVisibility,
        labelListVisibility: label.labelListVisibility,
      }));
    } catch (error) {
      console.error("[Gmail] Failed to list labels:", error);
      throw new Error("Failed to list labels from Gmail");
    }
  }

  /**
   * List messages in a label or search query
   */
  async listMessages(
    query?: string,
    labelId?: string,
    pageSize: number = 10,
    pageToken?: string
  ): Promise<{
    messages: GmailMessage[];
    nextPageToken?: string;
  }> {
    try {
      const gmail = this.getGmailClient();

      const q = [query, labelId ? `label:${labelId}` : ""].filter(Boolean).join(" ");

      const result = await gmail.users.messages.list({
        userId: "me",
        q: q || undefined,
        maxResults: pageSize,
        pageToken,
      });

      const messageIds = (result.data.messages || []).map((m) => m.id || "");

      // Fetch full message details
      const messages: GmailMessage[] = [];
      for (const messageId of messageIds) {
        try {
          const message = await this.getMessageDetails(messageId);
          messages.push(message);
        } catch (error) {
          console.warn(`[Gmail] Failed to fetch message ${messageId}:`, error);
        }
      }

      return {
        messages,
        nextPageToken: result.data.nextPageToken || undefined,
      };
    } catch (error) {
      console.error("[Gmail] Failed to list messages:", error);
      throw new Error("Failed to list messages from Gmail");
    }
  }

  /**
   * Get message details
   */
  async getMessageDetails(messageId: string): Promise<GmailMessage> {
    try {
      const gmail = this.getGmailClient();

      const result = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const message = result.data;
      const headers = message.payload?.headers || [];
      const headerMap: Record<string, string> = {};

      headers.forEach((header) => {
        if (header.name && header.value) {
          headerMap[header.name.toLowerCase()] = header.value;
        }
      });

      let body = "";
      if (message.payload?.parts) {
        // Multipart message
        const textPart = message.payload.parts.find(
          (part) => part.mimeType === "text/plain"
        );
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        }
      } else if (message.payload?.body?.data) {
        // Simple message
        body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
      }

      return {
        id: message.id || "",
        threadId: message.threadId || "",
        labelIds: message.labelIds,
        snippet: message.snippet || "",
        internalDate: message.internalDate || "",
        headers: headerMap,
        from: headerMap["from"],
        to: headerMap["to"],
        subject: headerMap["subject"],
        body,
      };
    } catch (error) {
      console.error("[Gmail] Failed to get message details:", error);
      throw new Error("Failed to get message details from Gmail");
    }
  }

  /**
   * Search messages
   */
  async searchMessages(
    query: string,
    pageSize: number = 10
  ): Promise<{
    messages: GmailMessage[];
  }> {
    try {
      const gmail = this.getGmailClient();

      const result = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: pageSize,
      });

      const messageIds = (result.data.messages || []).map((m) => m.id || "");

      // Fetch full message details
      const messages: GmailMessage[] = [];
      for (const messageId of messageIds) {
        try {
          const message = await this.getMessageDetails(messageId);
          messages.push(message);
        } catch (error) {
          console.warn(`[Gmail] Failed to fetch message ${messageId}:`, error);
        }
      }

      return { messages };
    } catch (error) {
      console.error("[Gmail] Failed to search messages:", error);
      throw new Error("Failed to search messages in Gmail");
    }
  }

  /**
   * Get message thread
   */
  async getThread(threadId: string): Promise<GmailMessage[]> {
    try {
      const gmail = this.getGmailClient();

      const result = await gmail.users.threads.get({
        userId: "me",
        id: threadId,
        format: "full",
      });

      const messages: GmailMessage[] = [];

      for (const message of result.data.messages || []) {
        const headers = message.payload?.headers || [];
        const headerMap: Record<string, string> = {};

        headers.forEach((header) => {
          if (header.name && header.value) {
            headerMap[header.name.toLowerCase()] = header.value;
          }
        });

        let body = "";
        if (message.payload?.parts) {
          const textPart = message.payload.parts.find(
            (part) => part.mimeType === "text/plain"
          );
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
          }
        } else if (message.payload?.body?.data) {
          body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
        }

        messages.push({
          id: message.id || "",
          threadId: message.threadId || "",
          labelIds: message.labelIds,
          snippet: message.snippet || "",
          internalDate: message.internalDate || "",
          headers: headerMap,
          from: headerMap["from"],
          to: headerMap["to"],
          subject: headerMap["subject"],
          body,
        });
      }

      return messages;
    } catch (error) {
      console.error("[Gmail] Failed to get thread:", error);
      throw new Error("Failed to get thread from Gmail");
    }
  }
}

export { GmailConnector };
