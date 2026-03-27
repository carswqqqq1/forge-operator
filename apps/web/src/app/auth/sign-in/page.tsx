import { AuthCard } from "@/components/auth-card";

export default function SignInPage() {
  return (
    <AuthCard
      variant="sign-in"
      title="Sign in"
      subtitle="Get back to your runs, approvals, artifacts, and billing workspace."
      alternateLabel="Create an account"
      alternateHref="/auth/sign-up"
    />
  );
}
