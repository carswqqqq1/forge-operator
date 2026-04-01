# Forge Operator (Enhanced with Claude Code Features)

A comprehensive local AI agent OS powered by **Ollama**, **NVIDIA NIM**, and your **Claude subscription**. This version has been upgraded with advanced architectural patterns from **Claude Code** to provide a more robust, scalable, and credit-efficient agent experience.

## 🚀 New Claude Code Integrations

### 🧠 Advanced Memory System (AutoDream)
- **Episodic vs. Durable Memory** — Distinguishes between task-specific context and long-term user preferences.
- **AutoDream Background Service** — Periodically synthesizes episodic memories into durable ones using a reflective "dream" pass (inspired by Claude Code's memory consolidation).
- **Metadata-First Retrieval** — Optimized memory recall with category filtering and semantic search.

### 🛠️ Enhanced Tool Contract
- **Advanced Tool Definitions** — Tools now include `isReadOnly`, `isDestructive`, and `category` metadata for better safety and planning.
- **Sub-Agent Spawning** — Agents can now spawn specialized sub-agents (Researcher, Coder, Reviewer) to handle complex sub-tasks in parallel.
- **Improved Shell & File Tools** — Robust execution with better error handling and output management.

### 🏗️ Bridge Architecture
- **Session & Capability Management** — Decouples the UI from the runtime, allowing for persistent sessions and capability negotiation (Streaming, MCP, Computer, Multi-Agent).
- **Background Task Persistence** — Tasks continue running even if the UI is detached.

### 📚 Metadata-First Skills
- **Discovery Support** — Search and discover reusable workflows without loading full instruction sets until needed.
- **Optimized Loading** — Faster UI performance by separating skill metadata from heavy instruction content.

## Core Features

### Agent Engine
- **Ollama Integration** — Local model inference (Llama 3, Mistral, Phi, etc.).
- **NVIDIA NIM Support** — High-performance cloud inference for complex reasoning.
- **Claude Subscription** — Use your existing Claude Pro subscription directly (Cookie relay or Browser automation).
- **Tool Execution** — Shell, File, Web Scrape, Python, Web Search, Memory, Sub-Agents.

### Chat & Interface
- **Dark Theme** — Professional Manus-inspired aesthetic.
- **Markdown & Syntax Highlighting** — Rich rendering for code and documents.
- **Collapsible Tool Details** — Clean chat flow with deep-dive capabilities.

## Quick Start

### Prerequisites
- **Node.js 18+** and **pnpm**
- **Ollama** installed and running (`brew install ollama && ollama serve`)
- **MySQL/TiDB** for persistent storage.

### Installation

```bash
# Clone the repository
git clone https://github.com/carswqqqq1/forge-operator.git
cd forge-operator

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

## Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, shadcn/ui, Wouter
- **Backend:** Express 4, tRPC 11, Drizzle ORM
- **Database:** MySQL/TiDB (Enhanced schema for tasks and memory)
- **Inference:** Ollama (Local) + NVIDIA NIM + Claude Subscription
- **Browser Automation:** Puppeteer-core

## License

MIT
