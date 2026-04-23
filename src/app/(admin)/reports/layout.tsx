import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports | TMS",
  description:
    "View shipment reports, analytics, and performance metrics. Export data to CSV or Excel.",
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
