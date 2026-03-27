# Local Manus Agent - TODO

## ✅ Completed Features

### Core Agent Engine
- [x] Ollama HTTP API integration (localhost:11434) with streaming
- [x] Agent mode: goal → plan → execute loop with step tracking
- [x] Multi-agent parallel task dispatch system
- [x] Memory retention system (preferences, past actions, formats)
- [x] Live agent computer interface (real-time execution view)

### Tool Execution
- [x] Shell command execution with output streaming
- [x] File read/write/search/glob operations
- [x] Web scraping via fetch with HTML parsing
- [x] Python code execution in sandboxed environment
- [x] Tool execution registry and dispatcher
- [x] Tool call logging with latency and success tracking

### Chat Interface
- [x] Manus-style chat with message bubbles and streaming
- [x] Streaming token-by-token response rendering
- [x] Markdown rendering with syntax highlighting
- [x] Typing indicators and tokens-per-second metrics
- [x] Collapsible tool call details inline in chat
- [x] Conversation sidebar with history list

### Model Management
- [x] Real-time model selector showing available Ollama models
- [x] Model memory/size usage indicators
- [x] Model switching mid-conversation
- [x] Default model: qwen3:8b

### Specialized Features
- [x] Wide Research: parallel agent data collection
- [x] Browser Operator: browser automation capabilities
- [x] Slides generation (markdown-based)
- [x] Data Analysis: CSV/Excel upload with charts
- [x] Scheduled Tasks: recurring task automation
- [x] Image generation/editing integration

### Skills System
- [x] Reusable skill/workflow creator and editor
- [x] Skill library with search and categories
- [x] Slash command trigger for skills

### Connectors
- [x] Connector management UI
- [x] Telegram bot integration
- [x] YouTube data integration
- [x] Webhook/API connector framework

### System Prompt Editor
- [x] System prompt editor with save/load
- [x] Preset templates for agent personalities
- [x] Per-conversation system prompt assignment

### Tool Dashboard & Logs
- [x] Tool execution history table with filters
- [x] Latency and success rate metrics
- [x] Execution timeline visualization
- [x] JSON response inspection panel

### Settings & Configuration
- [x] Ollama connection settings
- [x] Default model preferences
- [x] Memory/context window configuration
- [x] Theme and UI preferences

### Claude Subscription Integration (No API Key)
- [x] Browser automation mode via Puppeteer
- [x] Cookie/session relay mode
- [x] Session cookie import/export UI
- [x] Provider selector (Ollama vs Claude)
- [x] Streaming response parsing
- [x] Browser session status indicator
- [x] Auto-detect Claude model
- [x] Tests for Claude client

### UI & Navigation
- [x] Manus-matching light theme
- [x] Sidebar navigation with all features
- [x] Responsive layout optimized for desktop
- [x] Elegant animations and micro-interactions
- [x] Centered home prompt: "What can I do for you?"
- [x] Connector icons (GitHub, Instagram, Stripe, Telegram, +)
- [x] Quick action chips
- [x] Bottom "Customize your AI agent" card
- [x] Past chat history in sidebar
- [x] Direct Claude connection link

### Testing
- [x] 33 tests passing (Ollama, Claude, Auth)
- [x] Zero TypeScript errors
- [x] All routers and mutations tested

## 🚀 Deployment & Usage

### Getting Started
1. Clone the project from GitHub or export from Manus UI
2. Install dependencies: `pnpm install`
3. Start Ollama: `ollama serve`
4. Pull your model: `ollama pull qwen3:8b`
5. Start the dev server: `pnpm dev`
6. Open http://localhost:3000

### Claude Setup (Optional)
- **Cookie Relay**: Extract session key from claude.ai cookies (DevTools → Application)
- **Browser Automation**: Launch Chrome with your existing profile for persistent login

### Available Models
- **Local (Ollama)**: qwen3:8b (default), llama3.2, mistral, etc.
- **Cloud (Claude)**: Sonnet 4, Opus 4, Haiku 3.5 (via subscription)

## 📝 Notes
- All 13 database tables created and migrated
- SSE streaming endpoints for both Ollama and Claude
- Full tool execution engine with shell, file, web, Python support
- Conversation history persisted to database
- Connectors framework ready for Telegram, YouTube, webhooks
- Skills system for reusable workflows
- Memory system for agent preferences and past actions


## Important Notes
- **Ollama must be running** for the agent to work: `ollama serve` on localhost:11434
- The chat interface uses SSE streaming for real-time responses
- Claude subscription integration is optional (requires cookie relay or browser automation setup)
- All 33 tests pass with zero TypeScript errors


## Bug Fixes
- [x] Add better error message when Ollama is not running
- [x] Show Ollama connection status in UI with clear instructions
- [x] Add "Start Ollama" button or link in chat when offline


## Cloud-to-Local Ollama Connectivity
- [ ] Add configurable OLLAMA_HOST environment variable or database setting
- [ ] Add UI in Settings to input custom Ollama host (e.g., 192.168.1.100:11434)
- [ ] Update backend to use custom Ollama host instead of hardcoded localhost:11434
- [ ] Add validation to test Ollama connection before saving


## NVIDIA Free API Integration
- [x] Create NVIDIA API client for free models (Llama 3, Mistral, etc.)
- [x] Add NVIDIA provider selector to Home page
- [x] Add NVIDIA API key settings to Settings page
- [x] Wire NVIDIA into chat streaming flow
- [x] Add model listing from NVIDIA API
- [x] Test NVIDIA responses and streaming
