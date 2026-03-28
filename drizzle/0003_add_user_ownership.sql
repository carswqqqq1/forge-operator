-- Add userId to conversations
ALTER TABLE conversations ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to messages
ALTER TABLE messages ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to tool_executions
ALTER TABLE tool_executions ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to memories
ALTER TABLE memories ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to agent_tasks
ALTER TABLE agent_tasks ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to agent_steps
ALTER TABLE agent_steps ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to connectors
ALTER TABLE connectors ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to scheduled_tasks
ALTER TABLE scheduled_tasks ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to research_sessions
ALTER TABLE research_sessions ADD COLUMN userId INT NOT NULL DEFAULT 1;

-- Add userId to system_prompts (optional)
ALTER TABLE system_prompts ADD COLUMN userId INT;

-- Add userId to skills (optional)
ALTER TABLE skills ADD COLUMN userId INT;

-- Add userId to app_settings (optional)
ALTER TABLE app_settings ADD COLUMN userId INT;

-- Create usage_events table
CREATE TABLE IF NOT EXISTS usage_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  tier ENUM('lite', 'core', 'max') NOT NULL,
  model VARCHAR(128) NOT NULL,
  tokenCount INT NOT NULL,
  creditCost INT NOT NULL,
  conversationId INT,
  note TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_conversations_userId ON conversations(userId);
CREATE INDEX idx_messages_userId ON messages(userId);
CREATE INDEX idx_tool_executions_userId ON tool_executions(userId);
CREATE INDEX idx_memories_userId ON memories(userId);
CREATE INDEX idx_agent_tasks_userId ON agent_tasks(userId);
CREATE INDEX idx_agent_steps_userId ON agent_steps(userId);
CREATE INDEX idx_connectors_userId ON connectors(userId);
CREATE INDEX idx_scheduled_tasks_userId ON scheduled_tasks(userId);
CREATE INDEX idx_research_sessions_userId ON research_sessions(userId);
CREATE INDEX idx_usage_events_userId ON usage_events(userId);
