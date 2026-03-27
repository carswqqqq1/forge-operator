import Stripe from "stripe";
import { appConfig, billingCatalog } from "./config";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    });
  }

  return stripeClient;
}

export function getPriceIdForProduct(productId: string) {
  const product = billingCatalog.find((entry) => entry.id === productId);
  if (!product) {
    throw new Error(`Unknown product: ${productId}`);
  }

  const priceId = process.env[product.lookupEnv];
  if (!priceId) {
    throw new Error(`Missing price configuration for ${product.lookupEnv}`);
  }

  return { product, priceId };
}

export function buildStripeUrls() {
  return {
    successUrl: `${appConfig.appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appConfig.appUrl}/cancel`,
  };
}
