import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { settingsSections } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Control providers, runner connectivity, billing defaults, and workspace policy.">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="grid gap-6">
          {settingsSections.map((section) => (
            <Panel key={section.title} eyebrow="Configuration" title={section.title}>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item} className="rounded-[1.4rem] border border-white/8 bg-black/18 px-4 py-4 text-sm leading-6 text-white/64">
                    {item}
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>

        <div className="grid gap-6">
          <Panel eyebrow="Provider keys" title="Bring your own compute">
            <div className="grid gap-3">
              {[
                "NVIDIA API key",
                "Ollama base URL",
                "GitHub personal access token",
                "Optional custom Stripe config overrides",
              ].map((field) => (
                <label key={field} className="block">
                  <div className="mb-2 text-xs uppercase tracking-[0.22em] text-white/34">{field}</div>
                  <input
                    className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-white/28"
                    placeholder={`Configure ${field.toLowerCase()}`}
                  />
                </label>
              ))}
            </div>
            <button className="mt-5 h-12 rounded-2xl bg-[var(--forge-lime)] px-5 text-sm font-medium text-black transition hover:bg-[#e5ff95]">
              Save settings
            </button>
          </Panel>

          <Panel eyebrow="Runner health" title="Local execution">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Status: online",
                "Last heartbeat: moments ago",
                "Workspace boundary: ~/Forge Runner",
                "Browser automation: Playwright ready",
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-white/8 bg-black/18 px-4 py-4 text-sm leading-6 text-white/64">
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
