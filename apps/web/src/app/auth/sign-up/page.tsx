import { AuthCard } from "@/components/auth-card";

export default function SignUpPage() {
  return (
    <AuthCard
      variant="sign-up"
      title="Create account"
      subtitle="Start Forge with a local runner, Stripe-backed billing, and a product shell built for execution."
      alternateLabel="Already have an account?"
      alternateHref="/auth/sign-in"
    />
  );
}
