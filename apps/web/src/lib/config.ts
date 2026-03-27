export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Forge",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  defaultProvider:
    (process.env.NEXT_PUBLIC_DEFAULT_MODEL_PROVIDER as "nvidia_free" | "ollama_local" | undefined) ||
    "nvidia_free",
  nvidiaBaseUrl: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
  models: {
    default: process.env.NVIDIA_MODEL_DEFAULT || "meta/llama-3.1-70b-instruct",
    fast: process.env.NVIDIA_MODEL_FAST || "meta/llama-3.1-8b-instruct",
    code: process.env.NVIDIA_MODEL_CODE || "qwen/qwen2.5-coder-32b-instruct",
    reasoning: process.env.NVIDIA_MODEL_REASONING || "deepseek-ai/deepseek-v3.1",
  },
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
