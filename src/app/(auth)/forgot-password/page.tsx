import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your dashboard access"
      description="Request a new temporary password for your WebSerbisyo RSVP dashboard account."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
