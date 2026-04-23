"use client";

import { QueryProvider } from "@/lib/api/query-provider";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto">{children}</div>
    </QueryProvider>
  );
}
