"use client";

import type * as React from "react";

export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-apple-reveal">{children}</div>;
}
