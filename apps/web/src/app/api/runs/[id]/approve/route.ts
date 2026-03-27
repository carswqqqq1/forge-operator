import { ok } from "@/lib/server/route-utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;

  return ok({
    runId: id,
    status: "running",
    message: "Approval accepted. Forge can continue the next protected action.",
  });
}
