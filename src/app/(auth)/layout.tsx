import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | TMS",
  description: "Sign in to the Transport Management System.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
