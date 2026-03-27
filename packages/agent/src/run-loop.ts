import type { ModelProvider, ToolName } from "@forge/shared";
import { buildCostPreview } from "./planner";
import { requiresApproval } from "./tool-registry";

export type LoopAction = {
  tool: ToolName;
  input: string;
};

export type PlannedLoopState = {
  prompt: string;
  provider: ModelProvider;
  preview: ReturnType<typeof buildCostPreview>;
  actions: Array<
    LoopAction & {
      approvalRequired: boolean;
    }
  >;
};

export function planRun(prompt: string, provider: ModelProvider = "nvidia_free"): PlannedLoopState {
  const preview = buildCostPreview(prompt, provider);
  const actions: LoopAction[] = [
    { tool: "browser_open", input: "Open the target workspace or webpage." },
    { tool: "browser_screenshot", input: "Capture the starting state for replay." },
    { tool: "browser_extract", input: "Pull the high-value fields or findings into memory." },
    { tool: "artifact_save", input: "Persist the primary artifact bundle." },
    { tool: "complete_run", input: "Finalize the run with a verified summary." },
  ];

  return {
    prompt,
    provider,
    preview,
    actions: actions.map((action) => ({
      ...action,
      approvalRequired: Boolean(requiresApproval(action.tool)),
    })),
  };
}
