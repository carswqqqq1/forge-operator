import { uiDesignAgentConfig } from "./agent.js";

// Export the agent configuration for deployment and usage
export { uiDesignAgentConfig };

// Example usage with the agent
console.log("UI Design/Frontend Agent initialized");
console.log("Agent name:", uiDesignAgentConfig.name);
console.log("Agent description:", uiDesignAgentConfig.description);
console.log(
  "Available tools:",
  Object.keys(uiDesignAgentConfig.tools).join(", ")
);
