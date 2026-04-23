import { Suspense } from "react";
import { AuthBackground } from "@/components/auth/auth-background";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage(): React.ReactNode {
  return (
    <>
      <AuthBackground />
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm animate-wave-appear">
          <Suspense
            fallback={
              <div className="h-96 bg-card/90 rounded-xl animate-pulse" />
            }
          >
            <SignInForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
