import * as db from "../db";

export type ConnectorType = "github" | "slack" | "google_drive" | "notion" | "zapier";

type ConnectorConfig = {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  webhookUrl?: string;
  workspaceId?: string;
  userId?: string;
  [key: string]: unknown;
};

export async function validateConnector(type: ConnectorType, config: ConnectorConfig): Promise<boolean> {
  try {
    switch (type) {
      case "github":
        return await validateGitHub(config);
      case "slack":
        return await validateSlack(config);
      case "google_drive":
        return await validateGoogleDrive(config);
      case "notion":
        return await validateNotion(config);
      case "zapier":
        return await validateZapier(config);
      default:
        return false;
    }
  } catch (error) {
    console.error(`[Connectors] Validation failed for ${type}:`, error);
    return false;
  }
}

async function validateGitHub(config: ConnectorConfig): Promise<boolean> {
  if (!config.accessToken) return false;
  try {
    const response = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${config.accessToken}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateSlack(config: ConnectorConfig): Promise<boolean> {
  if (!config.accessToken) return false;
  try {
    const response = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });
    const data = (await response.json()) as any;
    return data.ok === true;
  } catch {
    return false;
  }
}

async function validateGoogleDrive(config: ConnectorConfig): Promise<boolean> {
  if (!config.accessToken) return false;
  try {
    const response = await fetch("https://www.googleapis.com/drive/v3/about?fields=user", {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateNotion(config: ConnectorConfig): Promise<boolean> {
  if (!config.accessToken) return false;
  try {
    const response = await fetch("https://api.notion.com/v1/users/me", {
      headers: { Authorization: `Bearer ${config.accessToken}`, "Notion-Version": "2022-06-28" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateZapier(config: ConnectorConfig): Promise<boolean> {
  if (!config.webhookUrl) return false;
  try {
    const response = await fetch(config.webhookUrl, {
      method: "POST",
      body: JSON.stringify({ test: true }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function syncConnectorData(userId: number, connectorId: number) {
  // Placeholder for real sync logic
  console.log(`[Connectors] Syncing connector ${connectorId} for user ${userId}`);
}

export async function getConnectorStatus(userId: number, connectorId: number) {
  const connector = await db.getConnector(connectorId);
  if (!connector || connector.userId !== userId) {
    throw new Error("Unauthorized");
  }
  return {
    id: connector.id,
    name: connector.name,
    type: connector.type,
    status: connector.status,
    lastSyncAt: connector.lastSyncAt,
  };
}
