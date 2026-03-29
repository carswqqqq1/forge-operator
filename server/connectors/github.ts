/**
 * GitHub Connector
 * Provides OAuth2 authentication and repository operations for GitHub
 * Inspired by: https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt
 */

import axios from "axios";

export interface GitHubConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: string;
}

export interface GitHubConnectorState {
  accessToken: string;
  tokenType: string;
  scope: string;
  userId: string;
}

class GitHubConnector {
  private config: GitHubConfig;
  private accessToken: string | null = null;

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * Get authorization URL for user consent
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: "repo,read:user",
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<GitHubConnectorState> {
    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = response.data;

      if (data.error) {
        throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
      }

      this.accessToken = data.access_token;

      return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
        userId: "", // Will be populated after fetching user info
      };
    } catch (error) {
      console.error("[GitHub] Token exchange failed:", error);
      throw new Error("Failed to exchange authorization code for GitHub token");
    }
  }

  /**
   * Set credentials from stored state
   */
  setCredentials(state: GitHubConnectorState): void {
    this.accessToken = state.accessToken;
  }

  /**
   * List user repositories
   */
  async listRepositories(page: number = 1, perPage: number = 30): Promise<GitHubRepository[]> {
    if (!this.accessToken) throw new Error("GitHub connector not authenticated");

    try {
      const response = await axios.get("https://api.github.com/user/repos", {
        params: {
          sort: "updated",
          direction: "desc",
          page,
          per_page: perPage,
        },
        headers: {
          Authorization: `token ${this.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("[GitHub] Failed to list repositories:", error);
      throw new Error("Failed to list repositories from GitHub");
    }
  }

  /**
   * Get repository content
   */
  async getRepositoryContent(owner: string, repo: string, path: string = ""): Promise<GitHubFile | GitHubFile[]> {
    if (!this.accessToken) throw new Error("GitHub connector not authenticated");

    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${this.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("[GitHub] Failed to get repository content:", error);
      throw new Error(`Failed to get content from GitHub repository ${owner}/${repo}`);
    }
  }

  /**
   * Search code in repositories
   */
  async searchCode(query: string, owner?: string, repo?: string): Promise<any> {
    if (!this.accessToken) throw new Error("GitHub connector not authenticated");

    let q = query;
    if (owner && repo) {
      q += ` repo:${owner}/${repo}`;
    }

    try {
      const response = await axios.get("https://api.github.com/search/code", {
        params: { q },
        headers: {
          Authorization: `token ${this.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("[GitHub] Failed to search code:", error);
      throw new Error("Failed to search code on GitHub");
    }
  }
}

export { GitHubConnector };
