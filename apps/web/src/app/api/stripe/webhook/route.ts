import { getWebhookClient, getWebhookSecret, summarizeStripeEvent } from "@/lib/server/billing";
import { fail, ok } from "@/lib/server/route-utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const stripe = getWebhookClient();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return fail("Missing stripe-signature header.");
    }

    const payload = await request.text();
    const event = stripe.webhooks.constructEvent(payload, signature, getWebhookSecret());

    return ok({
      received: true,
      type: event.type,
      summary: summarizeStripeEvent(event),
      note: "Persist the subscription, checkout, and credit updates into Supabase in your production hookup.",
    });
  } catch (caughtError) {
    const message = caughtError instanceof Error ? caughtError.message : "Webhook verification failed.";
    return fail(message, 400);
  }
}
