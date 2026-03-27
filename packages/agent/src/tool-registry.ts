import type { ApprovalType, ToolDefinition, ToolName } from "@forge/shared";

export const toolRegistry: ToolDefinition[] = [
  { name: "browser_open", description: "Open a browser page inside the local runner." },
  { name: "browser_click", approvalType: "browser", description: "Click a target element in the browser." },
  { name: "browser_type", description: "Type text into a browser field." },
  { name: "browser_extract", description: "Extract structured data from a page." },
  { name: "browser_screenshot", description: "Capture the current browser viewport." },
  { name: "shell_exec_local", approvalType: "filesystem", description: "Run a local shell command in the runner workspace." },
  { name: "file_read_local", description: "Read a file from the workspace." },
  { name: "file_write_local", approvalType: "filesystem", description: "Write a file inside the workspace boundary." },
  { name: "file_search_local", description: "Search local files inside the workspace." },
  { name: "http_fetch", description: "Fetch a deterministic HTTP resource." },
  { name: "python_exec_local", approvalType: "filesystem", description: "Execute Python locally in the runner workspace." },
  { name: "node_exec_local", approvalType: "filesystem", description: "Execute Node locally in the runner workspace." },
  { name: "memory_read", description: "Read project memory entries." },
  { name: "memory_write", description: "Persist a new project memory entry." },
  { name: "artifact_save", description: "Store a new artifact for replay or delivery." },
  { name: "complete_run", description: "Mark the run as completed with a verified output." },
];

export function getToolDefinition(toolName: ToolName) {
  return toolRegistry.find((tool) => tool.name === toolName);
}

export function requiresApproval(toolName: ToolName): ApprovalType | null {
  return getToolDefinition(toolName)?.approvalType || null;
}
