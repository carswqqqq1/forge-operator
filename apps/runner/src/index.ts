import { createClient } from "@supabase/supabase-js";
import { toolRegistry } from "@forge/agent";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const appUrl = process.env.FORGE_APP_URL || "http://localhost:3000";
const heartbeatIntervalMs = Number(process.env.FORGE_RUNNER_HEARTBEAT_MS || 15000);

async function postJson(path: string, body: Record<string, string>) {
  const response = await fetch(`${appUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed.`);
  }

  return response.json();
}

async function main() {
  const machineName = process.env.FORGE_RUNNER_NAME || "local-runner";

  if (!supabaseUrl || !supabaseKey) {
    console.log("[forge-runner] Missing Supabase environment. Runner is in standby.");
    console.log(`[forge-runner] Supported tools: ${toolRegistry.map((tool) => tool.name).join(", ")}`);
    return;
  }

  const client = createClient(supabaseUrl, supabaseKey);
  const registration = (await postJson("/api/runner/register", {
    name: machineName,
    machineId: machineName,
  })) as { runner: { id: string } };

  console.log(`[forge-runner] ${machineName} connected.`);
  console.log(`[forge-runner] Registered as ${registration.runner.id}.`);
  console.log(`[forge-runner] Supported tools: ${toolRegistry.map((tool) => tool.name).join(", ")}`);
  console.log("[forge-runner] Local browser/operator execution skeleton is ready.");

  await client.channel("runner-heartbeat").subscribe();

  setInterval(() => {
    void postJson("/api/runner/heartbeat", {
      runnerId: registration.runner.id,
    }).catch((error) => {
      console.error("[forge-runner] heartbeat failed", error);
    });
  }, heartbeatIntervalMs);
}

main().catch((error) => {
  console.error("[forge-runner] fatal", error);
  process.exit(1);
});
