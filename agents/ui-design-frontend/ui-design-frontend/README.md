# UI Design/Frontend Agent

An expert frontend UI designer agent powered by 21st SDK. This agent specializes in:

✨ **Copying UIs 1:1** — Generate pixel-perfect React components from designs
🔍 **Self-Validation** — Automatically verify code matches design specifications
⚡ **Production-Ready** — Generate TypeScript + Tailwind CSS components
🎯 **Fact-Checking** — Validate accessibility, types, and performance

## Setup

### Install Dependencies

```bash
npm install
npm install --save-dev @types/node typescript ts-node
```

### Configure API Key

Your 21st SDK API key is already set in `.env`:

```
21ST_API_KEY=an_sk_d7e62ff9c8e28758d06c56ffdea7460fb7ab7c5ab6b3590b46620a3fa7a1e438
```

### Build

```bash
npm run build
```

### Deploy

```bash
npm run deploy
```

## Usage

The agent is configured with three main tools:

1. **validateCode** — Validates React code against design specifications
2. **compareDesign** — Compares generated UI for pixel-perfect accuracy
3. **generateComponent** — Generates production-ready React components

## Example

Send a design description or Figma link to the agent, and it will:
1. Generate a React component
2. Validate the TypeScript and styling
3. Compare against the original design
4. Return production-ready code

## Features

- 🎨 Tailwind CSS styling
- 📘 Full TypeScript support
- ♿ Accessibility (ARIA labels, semantic HTML)
- 📱 Responsive design
- ✅ Self-validation checklist
- 🔄 Iterative refinement until design matches

## Agent Configuration

- **Model**: Claude Opus 4.6 (latest, most capable)
- **Max Turns**: 50
- **Attachments**: Enabled (for screenshots, Figma files)
- **Permission Mode**: Default (safe execution)
