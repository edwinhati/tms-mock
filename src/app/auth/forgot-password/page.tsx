import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage(): React.ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <ForgotPasswordForm />
    </div>
  );
}
