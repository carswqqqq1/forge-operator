import { ok, readJson } from "@/lib/server/route-utils";

type RegisterRunnerBody = {
  name?: string;
  machineId?: string;
};

export async function POST(request: Request) {
  const body = await readJson<RegisterRunnerBody>(request);
  const now = new Date().toISOString();

  return ok({
    runner: {
      id: body?.machineId || `runner_${Date.now()}`,
      name: body?.name || "Local Forge Runner",
      status: "online",
      lastHeartbeatAt: now,
    },
  });
}
