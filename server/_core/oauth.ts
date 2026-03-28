import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function completeLocalLogin(req: Request, res: Response, input: {
  provider?: string;
  email?: string;
  name?: string;
}) {
  const provider = (input.provider || "email").toLowerCase();
  const email =
    input.email?.trim() ||
    `demo-${provider}@forge.local`;
  const name =
    input.name?.trim() ||
    `${provider.charAt(0).toUpperCase()}${provider.slice(1)} User`;
  const openId = `forge-local:${provider}:${email.toLowerCase()}`;

  await db.upsertUser({
    openId,
    name,
    email,
    loginMethod: provider,
    lastSignedIn: new Date(),
  });

  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });

  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/dev-login", async (req: Request, res: Response) => {
    try {
      await completeLocalLogin(req, res, {
        provider: getQueryParam(req, "provider"),
        email: getQueryParam(req, "email"),
        name: getQueryParam(req, "name"),
      });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Dev login failed", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });

  app.post("/api/auth/dev-login", async (req: Request, res: Response) => {
    try {
      await completeLocalLogin(req, res, {
        provider: typeof req.body?.provider === "string" ? req.body.provider : undefined,
        email: typeof req.body?.email === "string" ? req.body.email : undefined,
        name: typeof req.body?.name === "string" ? req.body.name : undefined,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Dev login failed", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
