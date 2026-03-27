import { createCheckoutSession } from "@/lib/server/billing";
import { fail, ok, readJson } from "@/lib/server/route-utils";

export const runtime = "nodejs";

type CheckoutBody = {
  productId?: string;
  customerEmail?: string;
};

export async function POST(request: Request) {
  const body = await readJson<CheckoutBody>(request);

  if (!body?.productId) {
    return fail("Product ID is required.");
  }

  try {
    const session = await createCheckoutSession({
      productId: body.productId,
      customerEmail: body.customerEmail,
    });

    if (!session.url) {
      return fail("Stripe checkout session did not return a redirect URL.", 502);
    }

    return ok({ url: session.url, id: session.id });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Unable to create checkout session.";
    return fail(message, 500);
  }
}
