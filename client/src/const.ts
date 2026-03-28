export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

type LoginProvider = "facebook" | "google" | "microsoft" | "apple" | "email";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = (options?: {
  provider?: LoginProvider;
  type?: "signIn" | "signUp";
  email?: string;
}) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  if (!oauthPortalUrl || !appId) {
    const url = new URL("/login", window.location.origin);
    if (options?.provider) url.searchParams.set("provider", options.provider);
    if (options?.type) url.searchParams.set("type", options.type);
    if (options?.email) url.searchParams.set("email", options.email);
    return url.toString();
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", options?.type || "signIn");
  if (options?.provider) {
    url.searchParams.set("provider", options.provider);
  }
  if (options?.email) {
    url.searchParams.set("email", options.email);
  }

  return url.toString();
};
