# Forge Operator - Setup Guide

## API Keys Configuration

### 1. 21st SDK API Key

Get your API key from [21st.dev/agents](https://21st.dev/agents):

```bash
# Copy .env.example to .env
cp .env.example .env

# Add your 21st SDK API key
export 21ST_API_KEY="an_sk_YOUR_KEY_HERE"
```

### 2. Claude API Key (Optional)

For direct Claude API usage:

```bash
export CLAUDE_API_KEY="sk-ant-YOUR_KEY_HERE"
```

### 3. Environment Setup

```bash
# Install dependencies
npm install

# For UI Design/Frontend agent
cd agents/ui-design-frontend/ui-design-frontend
npm install
npm run build

# Deploy agent
export API_KEY_21ST="your_key"
npm run deploy
```

## Security

- **NEVER** commit `.env` files with actual keys
- Use `.env.example` as a template
- `.env` is in `.gitignore` for safety
- Rotate keys regularly
- Use separate keys for dev/prod

## Running Skills

### UI Design / Frontend Skill

```bash
# Development
cd agents/ui-design-frontend/ui-design-frontend
npm run dev

# Deploy to 21st SDK
npm run deploy

# Use in Claude Code
# Type: /ui-design in Claude Code
```

## Documentation

- **SKILLS.md** - Available skills overview
- **skills/ui-design-frontend.md** - UI Design skill details
- **agents/ui-design-frontend/README.md** - Agent-specific docs

## Support

For issues or questions:
1. Check SKILLS.md for skill documentation
2. Review agent README.md
3. Check 21st SDK docs at https://21st.dev/agents
