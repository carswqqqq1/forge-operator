import type { CostPreview, RunStatus } from "@forge/shared";
import { buildCostPreview } from "@forge/agent";

export const suggestedPrompts = [
  "Research a competitor and write a launch brief",
  "Plan a Stripe onboarding flow and generate the docs",
  "Browse a site and capture the highest-friction signup issues",
  "Analyze a repo and explain the architecture to me",
  "Draft a product spec from my rough notes",
];

export const recentRuns: Array<{
  id: string;
  title: string;
  status: RunStatus;
  updatedAt: string;
}> = [
  { id: "run_01", title: "Comprehensive research on Manus", status: "completed", updatedAt: "2m ago" },
  { id: "run_02", title: "Checkout flow UX audit", status: "running", updatedAt: "Live now" },
  { id: "run_03", title: "Generate pricing and billing docs", status: "waiting_approval", updatedAt: "6m ago" },
  { id: "run_04", title: "Replay browser task and extract forms", status: "paused_quota", updatedAt: "13m ago" },
];

export const timelineEvents = [
  {
    label: "Planner generated the run checklist",
    body: "Forge split the objective into five explicit steps and marked the risky browser actions for approval.",
    type: "status_changed",
    at: "11:02 AM",
  },
  {
    label: "Browser operator opened the target page",
    body: "The runner loaded the site locally and captured the first screenshot artifact.",
    type: "tool_started",
    at: "11:03 AM",
  },
  {
    label: "Artifact saved",
    body: "The extracted findings were stored in the artifact workspace and attached to the run.",
    type: "artifact_created",
    at: "11:05 AM",
  },
  {
    label: "Approval required",
    body: "Forge is ready to submit the live form and is waiting for confirmation before proceeding.",
    type: "approval_requested",
    at: "11:07 AM",
  },
];

export const previewExample: CostPreview = buildCostPreview(
  "Research the landing page, inspect the pricing flow, and build a conversion memo.",
);

export const artifacts = [
  { name: "Landing page screenshot.png", kind: "screenshot", detail: "1440px browser capture" },
  { name: "conversion-memo.md", kind: "document", detail: "Executive summary + key actions" },
  { name: "pricing-analysis.json", kind: "json", detail: "Structured takeaways for replay" },
];

export const settingsSections = [
  {
    title: "Model routing",
    items: ["Primary provider: NVIDIA free endpoints", "Fallback provider: local Ollama", "Default mode: auto"],
  },
  {
    title: "Runner",
    items: ["Status: connected", "Machine: Carson’s MacBook Pro", "Last heartbeat: a few seconds ago"],
  },
  {
    title: "Billing",
    items: ["Plan: Forge Pro", "Credits remaining: 851", "Portal access: enabled"],
  },
];
