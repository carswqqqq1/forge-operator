import { AuthCard } from "@/components/auth-card";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      variant="forgot-password"
      title="Reset password"
      subtitle="Send yourself a secure recovery link and get back to your workspace."
      alternateLabel="Back to sign in"
      alternateHref="/auth/sign-in"
    />
  );
}
