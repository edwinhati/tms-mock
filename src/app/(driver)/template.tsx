import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | TMS Driver",
    default: "TMS Driver App",
  },
  description: "Mobile app for drivers to manage shipments and deliveries.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function DriverRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
