# Forge Operator - Available Skills

## UI Design / Frontend

**Status:** ✅ Production-Ready
**Location:** `./agents/ui-design-frontend`
**Model:** Claude Opus 4.6
**Deployment:** 21st SDK

### What It Does

Elite frontend UI systems builder for generating premium-quality SaaS interfaces.

- **Copy UIs 1:1** — Pixel-perfect React components from designs (Figma, screenshots)
- **Self-Validate** — Verify code matches design specifications exactly
- **Production-Ready** — TypeScript + Tailwind + shadcn/ui + Radix UI
- **Elite Accessibility** — W3C APG standards, full keyboard support
- **Visual Refinement** — Perfect spacing, hierarchy, contrast, and polish
- **Smooth Interactions** — Motion.dev animations for delightful UX

### When to Use

- Building new UI components or entire pages
- Designing from Figma mockups or screenshots
- Creating dashboards, landing pages, auth flows, forms
- Improving UI polish and visual hierarchy
- Need production-quality React components

### Tech Stack

- **Framework:** Next.js / React
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Accessibility:** Radix UI
- **Animation:** Motion.dev

### Reference Materials

Uses these sources intelligently:
1. shadcn/ui — component implementation
2. Radix UI — accessibility & behavior
3. Tailwind CSS — styling system
4. Motion.dev — animations
5. MDN/W3C — technical correctness
6. 21st.dev — pattern discovery
7. Refactoring UI — visual refinement

### Quality Standards

Every output will be:
- Intentional (purpose-driven)
- Modern (current patterns)
- Crisp (clean, professional)
- Well-spaced (breathing room)
- Trustworthy (premium quality)
- Usable (intuitive)
- Accessible (inclusive)
- Cohesive (consistent)

### Never Ships

- Generic AI-looking UIs
- Weak spacing (cramped layouts)
- Poor visual hierarchy
- Inaccessible interactions
- Outdated patterns
- Gratuitous animation
- One-off hacks

### How to Use

```bash
# Development mode
cd agents/ui-design-frontend
npm install
npm run build
npm start

# Deploy to 21st SDK
export API_KEY_21ST="your_api_key"
npm run deploy
```

### Agent Configuration

- **Max Turns:** 50
- **Attachments:** Enabled (upload designs, screenshots)
- **Permission Mode:** Default
- **Tools:** validateCode, compareDesign, generateComponent

---

**Last Updated:** 2026-03-31
**Version:** 1.0.0
