import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const AUTH_STORE_PATH = path.join(process.cwd(), ".forge-data", "auth-store.json");
type AuthStore = Record<string, { passwordHash: string }>;

async function readAuthStore(): Promise<AuthStore> {
  try {
    const raw = await fs.readFile(AUTH_STORE_PATH, "utf8");
    return JSON.parse(raw) as AuthStore;
  } catch {
    return {};
  }
}

async function writeAuthStore(store: AuthStore) {
  await fs.mkdir(path.dirname(AUTH_STORE_PATH), { recursive: true });
  await fs.writeFile(AUTH_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

async function getStoredPasswordHash(openId: string): Promise<string | null> {
  const store = await readAuthStore();
  return store[openId]?.passwordHash ?? null;
}

async function setStoredPasswordHash(openId: string, passwordHash: string): Promise<void> {
  const store = await readAuthStore();
  store[openId] = { passwordHash };
  await writeAuthStore(store);
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function verifyCloudflareTurnstile(token?: string, ip?: string): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;
  if (!secret || secret === "test_secret" || !token) return true;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data: any = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const inputHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(inputHash, "hex"));
}

async function createSession(req: Request, res: Response, openId: string, name: string) {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

async function completeLocalLogin(req: Request, res: Response, input: { provider?: string; email?: string; name?: string }) {
  const provider = (input.provider || "email").toLowerCase();
  const email = input.email?.trim() || `demo-${provider}@forge.local`;
  const name = input.name?.trim() || `${provider.charAt(0).toUpperCase()}${provider.slice(1)} User`;
  const openId = `forge-local:${provider}:${email.toLowerCase()}`;
  await db.upsertUser({ openId, name, email, loginMethod: provider, lastSignedIn: new Date() });
  await createSession(req, res, openId, name);
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

  app.get("/api/auth/google", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.redirect("/api/auth/dev-login?provider=google");
    const redirectUri = `${process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`}/api/auth/google/callback`;
    const state = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!code || !clientId || !clientSecret) return res.redirect("/login?error=google_config_missing");
    try {
      const redirectUri = `${process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`}/api/auth/google/callback`;
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokens: any = await tokenRes.json();
      if (!tokens.access_token) throw new Error("No access token from Google");
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo: any = await userRes.json();
      const openId = `google:${userInfo.id}`;
      const name = userInfo.name || userInfo.email || "Google User";
      const email = userInfo.email || null;
      await db.upsertUser({ openId, name, email, loginMethod: "google", lastSignedIn: new Date() });
      await createSession(req, res, openId, name);
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Google callback failed", error);
      res.redirect("/login?error=google_failed");
    }
  });

  app.get("/api/auth/apple", (req: Request, res: Response) => {
    const clientId = process.env.APPLE_CLIENT_ID;
    if (!clientId) return res.redirect("/api/auth/dev-login?provider=apple");
    const redirectUri = `${process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`}/api/auth/apple/callback`;
    const state = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "name email",
      response_mode: "form_post",
      state,
    });
    res.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
  });

  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    const code = req.body?.code;
    const user = req.body?.user ? JSON.parse(req.body.user) : null;
    if (!code) return res.redirect("/login?error=apple_failed");
    try {
      const name = user?.name ? `${user.name.firstName || ""} ${user.name.lastName || ""}`.trim() : "Apple User";
      const email = user?.email || null;
      const openId = `apple:${crypto.createHash("sha256").update(code).digest("hex").slice(0, 16)}`;
      await db.upsertUser({ openId, name, email, loginMethod: "apple", lastSignedIn: new Date() });
      await createSession(req, res, openId, name);
      res.redirect(302, "/");
    } catch (error) {
      console.error("[Auth] Apple callback failed", error);
      res.redirect("/login?error=apple_failed");
    }
  });

  app.post("/api/auth/email/login", async (req: Request, res: Response) => {
    const { email, password, cfToken } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const ip = req.headers["cf-connecting-ip"] as string || req.ip;
    const cfValid = await verifyCloudflareTurnstile(cfToken, ip);
    if (!cfValid) return res.status(400).json({ error: "Security check failed. Please try again." });
    try {
      const normalizedEmail = String(email).toLowerCase().trim();
      const openId = `email:${normalizedEmail}`;
      const existingUser = await db.getUserByOpenId(openId);
      if (!existingUser) return res.status(401).json({ error: "Invalid email or password" });
      const storedHash = await getStoredPasswordHash(openId);
      if (!storedHash || !verifyPassword(String(password), storedHash)) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      await db.upsertUser({ openId, lastSignedIn: new Date() });
      await createSession(req, res, openId, existingUser.name || normalizedEmail);
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Email login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/email/register", async (req: Request, res: Response) => {
    const { email, password, cfToken } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    if (String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    const ip = req.headers["cf-connecting-ip"] as string || req.ip;
    const cfValid = await verifyCloudflareTurnstile(cfToken, ip);
    if (!cfValid) return res.status(400).json({ error: "Security check failed. Please try again." });
    try {
      const normalizedEmail = String(email).toLowerCase().trim();
      const openId = `email:${normalizedEmail}`;
      const existingUser = await db.getUserByOpenId(openId);
      if (existingUser) return res.status(409).json({ error: "An account with this email already exists" });
      const passwordHash = hashPassword(String(password));
      const name = normalizedEmail.split("@")[0];
      await db.upsertUser({
        openId,
        name,
        email: normalizedEmail,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });
      await setStoredPasswordHash(openId, passwordHash);
      res.json({ success: true, message: "Account created. Please sign in." });
    } catch (error) {
      console.error("[Auth] Email register failed", error);
      res.status(500).json({ error: "Registration failed" });
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
      await createSession(req, res, userInfo.openId, userInfo.name || "");
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
