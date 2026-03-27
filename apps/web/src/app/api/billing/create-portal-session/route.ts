import { createBillingPortalSession } from "@/lib/server/billing";
import { fail, ok, readJson } from "@/lib/server/route-utils";

export const runtime = "nodejs";

type PortalBody = {
  customerId?: string;
};

export async function POST(request: Request) {
  const body = await readJson<PortalBody>(request);

  if (!body?.customerId) {
    return fail("A Stripe customer ID is required to open the billing portal.");
  }

  try {
    const session = await createBillingPortalSession(body.customerId);
    return ok({ url: session.url });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Unable to create billing portal session.";
    return fail(message, 500);
  }
}
