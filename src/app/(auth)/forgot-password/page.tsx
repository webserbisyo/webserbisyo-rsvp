import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your dashboard password"
      description="Enter your dashboard email and we'll send a secure reset link if the account is active."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
