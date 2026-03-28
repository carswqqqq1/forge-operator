# Forge Operator API Documentation

## Overview

The Forge Operator API provides endpoints for autonomous task execution, research, scheduling, and external integrations. All endpoints require authentication except for public system endpoints.

---

## Authentication

All protected endpoints require a valid user session. Authentication is handled via OAuth (Manus OAuth) with automatic session management.

### Headers
```
Authorization: Bearer <session_token>
```

### Auth Endpoints

#### `GET /api/trpc/auth.me`
Get current authenticated user
```json
{
  "id": 1,
  "openId": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2026-03-27T00:00:00Z"
}
```

#### `POST /api/trpc/auth.logout`
Logout current user
```json
{ "success": true }
```

---

## Conversations API

### `GET /api/trpc/conversations.list`
List all conversations for current user
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Project Planning",
    "model": "llama3",
    "isArchived": false,
    "createdAt": "2026-03-27T00:00:00Z",
    "updatedAt": "2026-03-27T10:00:00Z"
  }
]
```

### `GET /api/trpc/conversations.get`
Get specific conversation
```json
{
  "id": 1,
  "userId": 1,
  "title": "Project Planning",
  "model": "llama3",
  "systemPrompt": "You are a helpful assistant",
  "isArchived": false,
  "createdAt": "2026-03-27T00:00:00Z",
  "updatedAt": "2026-03-27T10:00:00Z"
}
```

### `POST /api/trpc/conversations.create`
Create new conversation
```json
{
  "title": "New Project",
  "model": "llama3",
  "systemPrompt": "Optional system prompt"
}
```

Response:
```json
{ "id": 2 }
```

### `PUT /api/trpc/conversations.update`
Update conversation
```json
{
  "id": 1,
  "title": "Updated Title",
  "model": "llama3"
}
```

### `DELETE /api/trpc/conversations.delete`
Delete conversation
```json
{ "id": 1 }
```

---

## Messages API

### `GET /api/trpc/messages.list`
List messages in conversation
```json
{
  "conversationId": 1
}
```

Response:
```json
[
  {
    "id": 1,
    "userId": 1,
    "conversationId": 1,
    "role": "user",
    "content": "Hello, can you help me?",
    "model": null,
    "tokenCount": null,
    "createdAt": "2026-03-27T10:00:00Z"
  },
  {
    "id": 2,
    "userId": 1,
    "conversationId": 1,
    "role": "assistant",
    "content": "Of course! How can I help?",
    "model": "llama3",
    "tokenCount": 45,
    "createdAt": "2026-03-27T10:00:05Z"
  }
]
```

### `POST /api/trpc/messages.create`
Create message
```json
{
  "conversationId": 1,
  "content": "Hello, can you help me?",
  "model": "llama3"
}
```

---

## Agent/Task API

### `POST /api/trpc/agent.executeTask`
Execute autonomous task
```json
{
  "goal": "Research best practices for Node.js performance optimization",
  "conversationId": 1,
  "model": "llama3"
}
```

Response:
```json
{
  "taskId": 5,
  "status": "completed",
  "result": "Task completed with findings...",
  "plan": {
    "goal": "Research best practices...",
    "reasoning": "Breaking down into research and synthesis steps",
    "steps": [
      {
        "index": 1,
        "title": "Research Current Practices",
        "description": "Find best practices for Node.js performance",
        "tool": "web_search",
        "expectedOutput": "List of optimization techniques"
      }
    ]
  }
}
```

### `GET /api/trpc/agent.getTaskStatus`
Get task status
```json
{
  "taskId": 5
}
```

Response:
```json
{
  "task": {
    "id": 5,
    "userId": 1,
    "goal": "Research best practices...",
    "status": "completed",
    "currentStep": 3,
    "totalSteps": 3,
    "result": "..."
  },
  "steps": [
    {
      "id": 1,
      "stepIndex": 1,
      "title": "Research Current Practices",
      "status": "completed",
      "toolOutput": "Found 5 key optimization techniques"
    }
  ]
}
```

---

## Research API

### `GET /api/trpc/research.list`
List research sessions
```json
[
  {
    "id": 1,
    "userId": 1,
    "query": "Best practices for Node.js",
    "status": "completed",
    "sourcesCount": 5,
    "findings": "{...}",
    "createdAt": "2026-03-27T10:00:00Z"
  }
]
```

### `POST /api/trpc/research.create`
Create research session
```json
{
  "query": "Best practices for Node.js performance optimization"
}
```

Response:
```json
{ "id": 2 }
```

---

## Scheduled Tasks API

### `GET /api/trpc/scheduled.list`
List scheduled tasks
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "Daily Report",
    "description": "Generate daily performance report",
    "cronExpression": "0 9 * * *",
    "prompt": "Generate a performance report for today",
    "model": "llama3",
    "isActive": true,
    "lastRunAt": "2026-03-27T09:00:00Z",
    "nextRunAt": "2026-03-28T09:00:00Z"
  }
]
```

### `POST /api/trpc/scheduled.create`
Create scheduled task
```json
{
  "name": "Daily Report",
  "description": "Generate daily performance report",
  "cronExpression": "0 9 * * *",
  "prompt": "Generate a performance report for today",
  "model": "llama3"
}
```

### `PUT /api/trpc/scheduled.update`
Update scheduled task
```json
{
  "id": 1,
  "isActive": false
}
```

### `DELETE /api/trpc/scheduled.delete`
Delete scheduled task
```json
{ "id": 1 }
```

---

## Connectors API

### `GET /api/trpc/connectors.list`
List connectors
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "GitHub Account",
    "type": "github",
    "status": "active",
    "lastSyncAt": "2026-03-27T10:00:00Z",
    "createdAt": "2026-03-27T00:00:00Z"
  }
]
```

### `POST /api/trpc/connectors.create`
Create connector
```json
{
  "name": "GitHub Account",
  "type": "github",
  "config": "{\"accessToken\": \"ghp_...\"}"
}
```

### `DELETE /api/trpc/connectors.delete`
Delete connector
```json
{ "id": 1 }
```

---

## Streaming Endpoints

### `POST /api/claude/stream`
Stream Claude response (requires auth)
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "conversationId": 1
}
```

Response: Server-Sent Events (SSE)
```
data: {"type":"text","content":"Hello! How can I help?"}
data: {"type":"done","tokenCount":10,"model":"claude-3"}
```

### `POST /api/ollama/stream`
Stream Ollama response (requires auth)
```json
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "model": "llama3",
  "conversationId": 1
}
```

Response: Server-Sent Events (SSE)
```
data: {"type":"text","content":"Hello! How can I help?"}
data: {"type":"done","tokenCount":10,"model":"llama3"}
```

---

## Usage/Billing API

### `GET /api/trpc/usage.state`
Get current usage state
```json
{
  "credits": 851,
  "selectedTier": "max"
}
```

### `POST /api/trpc/usage.setTier`
Set tier
```json
{
  "tier": "core"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "code": "UNAUTHORIZED",
  "message": "User not authenticated",
  "data": {}
}
```

### Common Error Codes
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input
- `INTERNAL_SERVER_ERROR` - Server error

---

## Rate Limiting

Rate limits depend on user tier:

| Tier | Limit | Window |
|------|-------|--------|
| Lite | 10 | per minute |
| Core | 60 | per minute |
| Max | 300 | per minute |

---

## Examples

### Example 1: Create and Execute Task
```bash
# Create conversation
curl -X POST http://localhost:3000/api/trpc/conversations.create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Research Task"}'

# Execute autonomous task
curl -X POST http://localhost:3000/api/trpc/agent.executeTask \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "goal":"Research Node.js best practices",
    "conversationId":1,
    "model":"llama3"
  }'
```

### Example 2: Schedule Daily Task
```bash
curl -X POST http://localhost:3000/api/trpc/scheduled.create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Daily Report",
    "cronExpression":"0 9 * * *",
    "prompt":"Generate today'\''s performance report",
    "model":"llama3"
  }'
```

### Example 3: Stream Response
```bash
curl -X POST http://localhost:3000/api/ollama/stream \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "messages":[{"role":"user","content":"Hello"}],
    "model":"llama3",
    "conversationId":1
  }'
```

---

## Webhook Events

Scheduled tasks and connectors can trigger webhooks:

```json
{
  "event": "task.completed",
  "taskId": 5,
  "userId": 1,
  "result": "...",
  "timestamp": "2026-03-27T10:00:00Z"
}
```

---

## SDK Usage

### TypeScript/Node.js
```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';

const trpc = createTRPCClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      async headers() {
        return {
          authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
});

// List conversations
const convs = await trpc.conversations.list.query();

// Create task
const task = await trpc.agent.executeTask.mutate({
  goal: 'Research Node.js',
  model: 'llama3',
});
```

---

## Changelog

### v1.0 (March 27, 2026)
- Initial API release
- Agent/task execution
- Research system
- Scheduling
- Connectors
- Billing/usage tracking
