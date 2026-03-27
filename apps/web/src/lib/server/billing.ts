import Stripe from "stripe";
import { appConfig } from "@/lib/config";
import { getPriceIdForProduct, getStripe } from "@/lib/stripe";

export function getSuccessUrl() {
  return `${appConfig.appUrl}/success`;
}

export function getCancelUrl() {
  return `${appConfig.appUrl}/cancel`;
}

export function assertStripeConfigured() {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY and the product price IDs.");
  }

  return stripe;
}

export async function createCheckoutSession({
  productId,
  customerEmail,
}: {
  productId: string;
  customerEmail?: string;
}) {
  const stripe = assertStripeConfigured();
  const { priceId } = getPriceIdForProduct(productId);

  if (!priceId) {
    throw new Error(`Missing Stripe price ID for ${productId}.`);
  }

  const mode = productId === "pro-monthly" ? "subscription" : "payment";

  return stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: customerEmail,
    success_url: getSuccessUrl(),
    cancel_url: getCancelUrl(),
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    metadata: {
      productId,
      source: "forge-web",
    },
  });
}

export async function createBillingPortalSession(customerId: string) {
  const stripe = assertStripeConfigured();

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appConfig.appUrl}/billing`,
    configuration: process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID || undefined,
  });
}

export function getWebhookClient() {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  return stripe;
}

export function getWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
  }

  return webhookSecret;
}

export function summarizeStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      return "Checkout completed and ready for entitlement sync.";
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return "Subscription change received and ready for billing state sync.";
    case "invoice.paid":
      return "Invoice payment received.";
    default:
      return `Received ${event.type}.`;
  }
}
