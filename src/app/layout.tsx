import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    template: "%s | TMS",
    default: "Transport Management System",
  },
  description:
    "A comprehensive Transport Management System for managing multi-modal shipments, tracking, and logistics operations.",
  keywords: ["transport", "logistics", "shipments", "tracking", "TMS"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={cn("font-sans antialiased text-[17px] tracking-apple-body")}
      >
        <TooltipProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
