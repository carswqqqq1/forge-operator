import { AppShell } from "@/components/app-shell";
import { Panel } from "@/components/panel";
import { SettingsForm } from "@/components/settings-form";
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
                  <div key={item} className="rounded-[1.2rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-4 text-sm leading-6 text-[var(--forge-ink-soft)]">
                    {item}
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>

        <div className="grid gap-6">
          <Panel eyebrow="Provider keys" title="Bring your own compute">
            <SettingsForm />
          </Panel>

          <Panel eyebrow="Runner health" title="Local execution">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "Status: online",
                "Last heartbeat: moments ago",
                "Workspace boundary: ~/Forge Runner",
                "Browser automation: Playwright ready",
              ].map((item) => (
                <div key={item} className="rounded-[1.2rem] border border-[var(--forge-border)] bg-[var(--forge-bg-soft)] px-4 py-4 text-sm leading-6 text-[var(--forge-ink-soft)]">
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
