export type RunStatus =
  | "draft"
  | "preview_ready"
  | "queued"
  | "planning"
  | "waiting_runner"
  | "running"
  | "waiting_approval"
  | "paused_quota"
  | "completed"
  | "failed"
  | "cancelled";

export type RunEventType =
  | "status_changed"
  | "tool_started"
  | "tool_completed"
  | "artifact_created"
  | "approval_requested"
  | "runner_heartbeat";

export type RunStepStatus = "pending" | "running" | "completed" | "failed";
export type ApprovalType = "browser" | "filesystem" | "network" | "git" | "purchase";
export type ArtifactType = "screenshot" | "document" | "json" | "text" | "bundle";
export type ModelProvider = "nvidia_free" | "ollama_local";
export type QuotaState = "available" | "degraded" | "exhausted";
export type RunnerStatus = "online" | "offline" | "busy";
export type RiskLevel = "low" | "medium" | "high";
export type PlanTier = "free" | "pro";
export type CreditTransactionType = "grant" | "purchase" | "usage" | "refund";
export type SubscriptionStatus = "inactive" | "trialing" | "active" | "past_due" | "canceled";
export type ToolName =
  | "browser_open"
  | "browser_click"
  | "browser_type"
  | "browser_extract"
  | "browser_screenshot"
  | "shell_exec_local"
  | "file_read_local"
  | "file_write_local"
  | "file_search_local"
  | "http_fetch"
  | "python_exec_local"
  | "node_exec_local"
  | "memory_read"
  | "memory_write"
  | "artifact_save"
  | "complete_run";

export interface CostPreview {
  estimatedCredits: number;
  riskLevel: RiskLevel;
  provider: ModelProvider;
  note: string;
}

export interface ToolDefinition {
  name: ToolName;
  approvalType?: ApprovalType;
  description: string;
}
