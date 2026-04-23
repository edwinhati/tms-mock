import { AuthProvider } from "@/components/auth/auth-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return <AuthProvider>{children}</AuthProvider>;
}
