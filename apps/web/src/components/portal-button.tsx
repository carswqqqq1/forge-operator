"use client";

import { useState } from "react";

type PortalButtonProps = {
  customerId?: string;
  className?: string;
};

export function PortalButton({ customerId, className }: PortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePortal() {
    if (!customerId) {
      setError("Store the user's Stripe customer ID after signup or checkout before opening the billing portal.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to open billing portal.");
      }

      window.location.assign(payload.url);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to open billing portal.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handlePortal} className={className} disabled={loading}>
        {loading ? "Opening..." : "Manage subscription"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-200/85">{error}</p> : null}
    </div>
  );
}
