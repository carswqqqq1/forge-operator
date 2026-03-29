import type { ComponentType } from "react"
import { AudioLines, Bot, Database, Globe, Search, Sparkles } from "lucide-react"

export type AppDefinition = {
  key: string
  title: string
  type: string
  description: string
  mode: "toggle" | "connect"
  beta?: boolean
  icon: ComponentType<{ className?: string }>
  config?: Record<string, unknown>
}

export type ApiDefinition = {
  key: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}

export function GithubBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" className={className} aria-hidden="true">
      <circle cx="128" cy="128" r="128" fill="#111111" />
      <path
        fill="#ffffff"
        d="M128 40c-48.6 0-88 39.4-88 88 0 38.9 25.2 71.9 60.2 83.6 4.4.8 6-1.9 6-4.3 0-2.1-.1-9.1-.1-16.4-24.5 5.3-29.7-10.4-29.7-10.4-4-10.2-9.8-12.9-9.8-12.9-8-5.5.6-5.4.6-5.4 8.9.6 13.5 9.1 13.5 9.1 7.9 13.5 20.7 9.6 25.8 7.4.8-5.7 3.1-9.6 5.6-11.8-19.6-2.2-40.2-9.8-40.2-43.7 0-9.6 3.4-17.5 9.1-23.7-.9-2.2-3.9-11.2.9-23.3 0 0 7.4-2.4 24.2 9.1a84.5 84.5 0 0 1 44 0c16.8-11.4 24.2-9.1 24.2-9.1 4.8 12.1 1.8 21.1.9 23.3 5.7 6.2 9.1 14.1 9.1 23.7 0 34-20.6 41.5-40.4 43.7 3.2 2.7 6 8 6 16.2 0 11.7-.1 21.2-.1 24.1 0 2.4 1.6 5.2 6.1 4.3A88.02 88.02 0 0 0 216 128c0-48.6-39.4-88-88-88Z"
      />
    </svg>
  )
}

export function ChromeBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M24 4c7.7 0 14.7 4.1 18.5 10.8H24c-3.6 0-6.8 2-8.5 5.1L9.2 9.1A20 20 0 0 1 24 4Z" />
      <path fill="#FBBC05" d="M42.5 14.8A20 20 0 0 1 24 44l9.3-16.1c1.8-3.1 1.8-7.1 0-10.2l-4.1-7h13.3Z" />
      <path fill="#34A853" d="M24 44A20 20 0 0 1 9.2 9.1l9.3 16.1c1.8 3.1 5.1 5.1 8.7 5.1h8.1L24 44Z" />
      <circle cx="24" cy="24" r="8.7" fill="#4285F4" />
      <circle cx="24" cy="24" r="4.2" fill="#D2E3FC" />
    </svg>
  )
}

export function GmailBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="3" y="6" width="42" height="36" rx="4" fill="#ffffff" />
      <path fill="#EA4335" d="M8 37V13.8l16 12.1 16-12.1V37a3 3 0 0 1-3 3h-4.5V22.1L24 28.4l-8.5-6.3V40H11a3 3 0 0 1-3-3Z" />
      <path fill="#4285F4" d="M8 13.8V37a3 3 0 0 0 3 3h2.5V19.8L8 13.8Z" />
      <path fill="#34A853" d="M34.5 40H37a3 3 0 0 0 3-3V13.8l-5.5 6V40Z" />
      <path fill="#FBBC04" d="M40 13.8V11a3.9 3.9 0 0 0-6.1-3.2L24 15.2 14.1 7.8A3.9 3.9 0 0 0 8 11v2.8l16 12.1 16-12.1Z" />
    </svg>
  )
}

export function GoogleCalendarBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="6" y="8" width="36" height="34" rx="4" fill="#fff" />
      <path fill="#1A73E8" d="M38 8H10a4 4 0 0 0-4 4v6h36v-6a4 4 0 0 0-4-4Z" />
      <path fill="#34A853" d="M6 18h36v20a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V18Z" />
      <path fill="#FBBC04" d="M36 18h6v20a4 4 0 0 1-4 4h-2V18Z" />
      <path fill="#EA4335" d="M6 18h6v24h-2a4 4 0 0 1-4-4V18Z" />
      <rect x="13" y="18" width="23" height="21" fill="#fff" />
      <text x="24.5" y="33.5" textAnchor="middle" fontSize="18" fontWeight="700" fill="#4285F4" fontFamily="Arial, sans-serif">31</text>
    </svg>
  )
}

export function GoogleDriveBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#0F9D58" d="M18.4 8 6 29.3l6.1 10.7L24.5 18.7 18.4 8Z" />
      <path fill="#4285F4" d="M24.5 18.7 12.1 40h23.8l6.1-10.7H24.5Z" />
      <path fill="#F4B400" d="M18.4 8h12.3L42 29.3H29.8L18.4 8Z" />
    </svg>
  )
}

export const appDefinitions: AppDefinition[] = [
  {
    key: "github",
    title: "GitHub",
    type: "github",
    description: "Manage repositories, track code changes, and collaborate on team projects",
    mode: "connect",
    icon: GithubBrandIcon,
    config: { scopes: ["repo", "read:user", "read:org"] },
  },
  {
    key: "gmail",
    title: "Gmail",
    type: "gmail",
    description: "Draft replies, search your inbox, and summarize email threads instantly",
    mode: "connect",
    icon: GmailBrandIcon,
    config: { scopes: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"] },
  },
  {
    key: "google-drive",
    title: "Google Drive",
    type: "google_drive",
    description: "Access your files, search instantly, and let Forge help you manage documents",
    mode: "connect",
    icon: GoogleDriveBrandIcon,
    config: {
      scopes: [
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/documents.readonly",
      ],
    },
  },
]

export const customApis: ApiDefinition[] = [
  { key: "openai", title: "OpenAI", description: "Leverage GPT model series for intelligent text generation and processing", icon: Sparkles },
  { key: "anthropic", title: "Anthropic", description: "Access reliable AI assistant services with safe and intelligent conversations", icon: Bot },
  { key: "gemini", title: "Google Gemini", description: "Process multimodal content including text, images, and code seamlessly", icon: Sparkles },
  { key: "perplexity", title: "Perplexity", description: "Search real-time information and get accurate answers with reliable citations", icon: Search },
  { key: "cohere", title: "Cohere", description: "Build enterprise AI applications and optimize text processing workflows", icon: Database },
  { key: "elevenlabs", title: "ElevenLabs", description: "Generate realistic voices, clone speech, and create custom audio content", icon: AudioLines },
  { key: "grok", title: "Grok", description: "Access real-time information and engage in intelligent conversations", icon: Bot },
  { key: "openrouter", title: "OpenRouter", description: "Access multiple AI models and manage API routing from one place", icon: Globe },
]
