import * as db from "../db";

type ResearchSource = {
  title: string;
  url: string;
  excerpt: string;
  relevance: number;
};

type ResearchFinding = {
  query: string;
  sources: ResearchSource[];
  synthesis: string;
  keyPoints: string[];
};

export async function performResearch(
  userId: number,
  query: string,
  sessionId?: number
): Promise<ResearchFinding> {
  const finding: ResearchFinding = {
    query,
    sources: [],
    synthesis: "",
    keyPoints: [],
  };

  try {
    // Create or update research session
    let session;
    if (sessionId) {
      session = await db.getResearchSession(sessionId);
      if (!session || session.userId !== userId) {
        throw new Error("Unauthorized access to research session");
      }
    } else {
      const result = await db.createResearchSession(userId, {
        userId,
        query,
        status: "running",
        sourcesCount: 0,
      });
      sessionId = result.id;
    }

    // Placeholder: In production, integrate with real research APIs
    // - Tavily API for web search
    // - Academic databases (arXiv, PubMed, etc.)
    // - News APIs
    // - Industry reports

    finding.sources = [
      {
        title: "Research Source 1",
        url: "https://example.com/1",
        excerpt: "Placeholder research result",
        relevance: 0.9,
      },
    ];

    finding.keyPoints = [
      "Key finding 1",
      "Key finding 2",
      "Key finding 3",
    ];

    finding.synthesis = "Research synthesis placeholder";

    // Update session
    if (sessionId) {
      await db.updateResearchSession(sessionId, {
        status: "completed",
        sourcesCount: finding.sources.length,
        findings: JSON.stringify(finding),
      });
    }

    return finding;
  } catch (error) {
    if (sessionId) {
      await db.updateResearchSession(sessionId, {
        status: "failed",
        findings: JSON.stringify({ error: (error as any).message }),
      });
    }
    throw error;
  }
}

export async function getResearchSession(userId: number, sessionId: number) {
  const session = await db.getResearchSession(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("Unauthorized");
  }
  return session;
}
