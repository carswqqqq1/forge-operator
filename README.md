# Local Manus Agent

A comprehensive local AI agent powered by **Ollama** and your **Claude subscription** — replicating the full Manus experience on your Mac mini. No API keys required for Claude; uses your existing subscription directly.

## Features

### Core Agent Engine
- **Ollama Integration** — Connects to localhost:11434 for local model inference (Llama 3, Mistral, Phi, etc.)
- **Claude Subscription** — Two modes: Cookie relay (fast, headless) or Browser automation (visual, interactive)
- **Streaming Responses** — Token-by-token streaming with live tok/s metrics
- **Tool Execution** — Shell commands, file operations, web scraping, Python execution, web search, memory

### Chat Interface
- Dark theme matching Manus aesthetic
- Message bubbles with markdown rendering and syntax highlighting
- Collapsible tool call details inline in chat
- Provider selector: switch between Ollama (local) and Claude (subscription)
- Conversation sidebar with history

### Specialized Features
- **Wide Research** — Parallel data collection from multiple sources
- **Skills System** — Reusable workflows with categories and search
- **Connectors** — Telegram, YouTube, Webhook, and API integrations
- **Scheduled Tasks** — Recurring automation with cron expressions
- **Memory** — Long-term preference and context retention
- **System Prompts** — Editor with preset templates for agent personalities

### Dashboard & Monitoring
- Tool execution history with filters
- Latency and success rate metrics
- JSON response inspection panel
- Model memory/size indicators

## Quick Start

### Prerequisites
- **Node.js 18+** and **pnpm**
- **Ollama** installed and running (`brew install ollama && ollama serve`)
- **qwen3:8b** model pulled (`ollama pull qwen3:8b`) — lightweight 8B local model, runs efficiently on 16GB RAM

### Installation

```bash
# Clone the repository
git clone https://github.com/carswqqqq1/README.git
cd README

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Using Claude (No API Key)

#### Cookie Relay Mode (Recommended)
1. Log into [claude.ai](https://claude.ai) in your browser
2. Open DevTools → Application → Cookies → claude.ai
3. Copy the `sessionKey` cookie value
4. Go to Settings → Claude → Cookie Relay → Paste and Connect

#### Browser Automation Mode
1. Go to Settings → Claude → Browser Automation
2. Set your Chrome path (auto-detected on macOS)
3. Click "Launch Browser" — it opens Chrome with your profile
4. The agent types messages directly into claude.ai

## Optimized For

| Hardware | Recommendation |
|----------|---------------|
| Mac mini M1/M2, 16GB RAM | **qwen3:8b** (8B local model) — Recommended default |
| 7B models | llama3.2, mistral — fast, fits in RAM |
| 13B models | Good balance, may use some swap |
| 3B models | Ultra-fast for simple tasks |
| 70B+ local models | Avoid on 16GB — extremely slow, too large |

## Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, shadcn/ui, Wouter
- **Backend:** Express 4, tRPC 11, Drizzle ORM
- **Database:** MySQL/TiDB (conversations, messages, tools, skills, connectors)
- **Inference:** Ollama (local) + Claude subscription (cloud)
- **Browser Automation:** Puppeteer-core

## Project Structure

```
client/src/
  pages/          — All feature pages (Chat, Dashboard, Logs, etc.)
  components/     — Reusable UI components + AppLayout
server/
  ollama.ts       — Ollama HTTP API client
  claude.ts       — Claude subscription client (cookie + browser)
  tools.ts        — Tool execution engine
  db.ts           — Database query helpers
  routers.ts      — tRPC procedures
drizzle/
  schema.ts       — Database schema (13 tables)
```

## License

MIT
