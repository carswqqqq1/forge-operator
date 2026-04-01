# Forge Operator x Claude Code Integration Plan

This plan outlines the integration of high-leverage patterns from Claude Code into the Forge Operator ecosystem. The goal is to transform Forge from a capable agent into a robust **Agent Operating System**.

## 1. Core Architectural Upgrades

### 1.1. Advanced Tool Contract (`Tool.ts`)
- **Objective**: Move beyond simple name/description/execute.
- **Implementation**: Update `server/tools.ts` to include:
    - `isReadOnly`: Safety flag for non-destructive operations.
    - `isDestructive`: Warning flag for critical changes.
    - `permissionProfile`: Integration with Forge's existing connector/auth system.
    - `renderSummary()`: For clean UI/transcript logging.
    - `category`: For better model discovery.

### 1.2. Robust Task System (`Task.ts`)
- **Objective**: Treat work as persistent processes, not just chat turns.
- **Implementation**: Enhance `server/_core/agent.ts` and `drizzle/schema.ts`:
    - Add `TaskType` (local_bash, local_agent, research, etc.).
    - Implement `outputFile` and `outputOffset` for streaming large logs without bloating DB/Memory.
    - Add `parentTaskId` for multi-agent hierarchy.
    - Implement `TaskStop` and `TaskResume` capabilities.

### 1.3. Multi-Agent Coordination
- **Objective**: Enable specialized sub-agents (Planner, Researcher, Builder, QA).
- **Implementation**: 
    - Create `server/_core/coordinator.ts`.
    - Implement `spawnSubAgent` tool.
    - Add `in_process_teammate` task type for shared transcripts.

## 2. Memory & Intelligence

### 2.1. Structured Memory (`memdir`)
- **Objective**: Move from flat key-value memories to a structured, scannable memory system.
- **Implementation**:
    - Create `server/_core/memory/`.
    - Implement `MEMORY.md` style indexing.
    - Add `autoDream` service for background memory consolidation.
    - Separate **Episodic** (task logs) from **Durable** (user preferences, project facts) memory.

### 2.2. Skill Discovery
- **Objective**: Dynamic loading of operational playbooks.
- **Implementation**:
    - Enhance `server/routers.ts` skills router.
    - Implement metadata-first loading (load full instructions only on demand).
    - Add `SkillDiscoveryTool` for the model to find relevant playbooks.

## 3. Platform & Connectivity

### 3.1. The Bridge Layer
- **Objective**: Decouple UI from Runtime for future scalability (Desktop, Web, IDE).
- **Implementation**:
    - Formalize `server/_core/bridge.ts` for session management.
    - Implement capability negotiation between client and server.

### 3.2. MCP Deep Integration
- **Objective**: Make MCP a first-class citizen.
- **Implementation**:
    - Enhance `server/_core/connectors.ts` to support full MCP lifecycle.
    - Add resource fetching and tool discovery for MCP servers.

## 4. Execution Strategy

1.  **Phase 1: Schema & Types**: Update Drizzle schema and core types.
2.  **Phase 2: Tool & Task Core**: Implement the new Tool and Task contracts.
3.  **Phase 3: Multi-Agent & Coordinator**: Build the sub-agent spawning logic.
4.  **Phase 4: Memory & Skills**: Implement the structured memory and discovery system.
5.  **Phase 5: UI & Integration**: Update the server routers and client-side hooks.

**Status**: 🟢 Planning Complete | ⚪ Implementation Pending
