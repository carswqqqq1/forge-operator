export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Forge",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  defaultProvider:
    (process.env.NEXT_PUBLIC_DEFAULT_MODEL_PROVIDER as "nvidia_free" | "ollama_local" | undefined) ||
    "nvidia_free",
};

export const billingCatalog = [
  {
    id: "pro-monthly",
    name: "Forge Pro",
    description: "Monthly access, bigger credit pool, and premium execution controls.",
    price: "$29",
    cadence: "/month",
    lookupEnv: "STRIPE_PRICE_PRO_MONTHLY",
    checkoutKind: "subscription" as const,
    highlights: ["1,200 monthly credits", "Run replay", "Approvals", "Priority model routing"],
  },
  {
    id: "credits-small",
    name: "Boost Pack",
    description: "Top up extra credits for deep runs and heavier browser workflows.",
    price: "$15",
    cadence: "one-time",
    lookupEnv: "STRIPE_PRICE_CREDITS_SMALL",
    checkoutKind: "credits_small" as const,
    highlights: ["600 extra credits", "No expiration", "Immediate top-up", "Usage-first billing"],
  },
  {
    id: "credits-large",
    name: "Launch Pack",
    description: "Larger credit purchase for agencies, founders, or launch-week workloads.",
    price: "$49",
    cadence: "one-time",
    lookupEnv: "STRIPE_PRICE_CREDITS_LARGE",
    checkoutKind: "credits_large" as const,
    highlights: ["2,400 extra credits", "Best value", "No expiration", "Ideal for onboarding"],
  },
];
