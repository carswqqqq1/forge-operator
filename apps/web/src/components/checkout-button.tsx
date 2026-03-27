"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  productId: string;
  label: string;
  customerEmail?: string;
  className?: string;
};

export function CheckoutButton({ productId, label, customerEmail, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, customerEmail }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to start checkout.");
      }

      window.location.assign(payload.url);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to start checkout.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        className={className}
        disabled={loading}
      >
        {loading ? "Redirecting..." : label}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-200/85">{error}</p> : null}
    </div>
  );
}
