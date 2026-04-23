import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page Not Found | TMS Driver",
  description: "The requested page could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-6">
          The page you are looking for does not exist.
        </p>
        <Button asChild className="w-full">
          <Link href="/driver/shipments">Back to Shipments</Link>
        </Button>
      </div>
    </div>
  );
}
