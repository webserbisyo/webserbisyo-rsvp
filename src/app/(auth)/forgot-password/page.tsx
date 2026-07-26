import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your dashboard password"
      description="Request a secure link using the approved email connected to your dashboard."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
