"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

const signInSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSuccess?: () => void;
}

export function SignInForm({ onSuccess }: SignInFormProps): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get("redirectTo") || "/";
  const showExpiredBanner = searchParams.get("expired") === "true";

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInFormData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message ?? "An error occurred");
      } else {
        onSuccess?.();

        // Fetch session to determine role and redirect
        const session = await authClient.getSession();
        const role = (session?.data?.user as any)?.role;

        if (redirectTo !== "/") {
          router.push(redirectTo);
        } else if (role === "driver") {
          router.push("/driver/shipments");
        } else {
          router.push("/dashboard");
        }

        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm bg-card/90 backdrop-blur-sm border-border/50 shadow-xl shadow-primary/5 rounded-xl">
      <CardHeader className="space-y-1 text-center pb-6">
        <CardTitle className="text-2xl font-semibold text-foreground">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to access your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {showExpiredBanner && (
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300/30 dark:border-amber-700/30 p-3 text-sm text-amber-800 dark:text-amber-200">
              Your session has expired. Please sign in again.
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-2 group">
            <Label
              htmlFor="email"
              className="text-sm text-muted-foreground ml-1"
            >
              Email or Username
            </Label>
            <div className="relative group/input">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors duration-300" />
              <Input
                id="email"
                type="text"
                placeholder="name@example.com"
                {...form.register("email")}
                disabled={isLoading}
                autoComplete="email"
                aria-invalid={!!form.formState.errors.email}
                className="pl-10 bg-background/60 border-border/40 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 rounded-lg"
              />
              <div className="absolute inset-0 rounded-lg -z-10 opacity-0 group-focus-within/input:opacity-100 bg-primary/5 blur-md transition-opacity duration-300" />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-destructive ml-1" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2 group">
            <Label
              htmlFor="password"
              className="text-sm text-muted-foreground ml-1"
            >
              Password
            </Label>
            <div className="relative group/input">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors duration-300" />
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                disabled={isLoading}
                autoComplete="current-password"
                aria-invalid={!!form.formState.errors.password}
                className="pl-10 bg-background/60 border-border/40 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300 rounded-lg"
              />
              <div className="absolute inset-0 rounded-lg -z-10 opacity-0 group-focus-within/input:opacity-100 bg-primary/5 blur-md transition-opacity duration-300" />
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive ml-1" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div />
            <a
              href="/auth/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors duration-200"
            >
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 rounded-lg relative overflow-hidden"
            disabled={isLoading}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/button:animate-shimmer" />
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center pb-6">
        <p className="text-sm text-muted-foreground">
          Need access?{" "}
          <a
            href="/contact"
            className="text-primary hover:text-primary/80 transition-colors duration-200"
          >
            Contact administrator
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
