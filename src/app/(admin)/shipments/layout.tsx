import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipments | TMS",
  description:
    "Manage and track all shipments. View shipment details, update status, and assign drivers.",
};

export default function ShipmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
