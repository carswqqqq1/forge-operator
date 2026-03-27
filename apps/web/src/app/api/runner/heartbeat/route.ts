import { ok, readJson } from "@/lib/server/route-utils";

type RunnerHeartbeatBody = {
  runnerId?: string;
};

export async function POST(request: Request) {
  const body = await readJson<RunnerHeartbeatBody>(request);

  return ok({
    runnerId: body?.runnerId || "local-runner",
    status: "online",
    timestamp: new Date().toISOString(),
  });
}
