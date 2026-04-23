import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Master Data | TMS",
  description:
    "Manage customers, vendors, warehouses, hubs, ports, vehicles, drivers, and other master data.",
};

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
