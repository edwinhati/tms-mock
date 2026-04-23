"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-background min-h-screen">
      {/* SECTION 1: Immersive Hero (Dark) */}
      <section className="relative w-full h-[90vh] bg-black flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="animate-apple-reveal text-center">
          <h1 className="text-white text-5xl md:text-[56px] font-semibold tracking-apple-hero leading-[1.07] mb-4">
            TMS. Efficiency in Motion.
          </h1>
          <p className="text-gray-400 text-xl md:text-[21px] tracking-apple-body mb-8 max-w-2xl mx-auto">
            A masterclass in logistics management. Precision tracking, automated
            BAST, and a world-class driver experience.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button variant="default" size="lg" asChild>
              <Link href="/auth/login">Get Started</Link>
            </Button>
            <Button variant="outline" size="pill" asChild>
              <Link href="/docs" className="flex items-center gap-1">
                Learn more <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 2: Informational Grid (Light Gray) */}
      <section className="w-full py-32 bg-[#f5f5f7] flex flex-col items-center px-4">
        <div className="max-w-[980px] w-full animate-apple-reveal delay-200">
          <h2 className="text-[#1d1d1f] text-4xl md:text-[40px] font-semibold tracking-apple-heading leading-[1.1] mb-16 text-center">
            Built for every segment of your supply chain.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl tracking-apple-heading">
                  Command Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-[17px] leading-[1.47] tracking-apple-body">
                  Real-time analytics and reporting for administrators. Manage
                  vendors, drivers, and shipments with absolute precision.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl tracking-apple-heading">
                  Driver Hub
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-[17px] leading-[1.47] tracking-apple-body">
                  A focused mobile experience for the front line. Offline-ready
                  status updates and digital proof of delivery.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-16 bg-[#f5f5f7] border-t border-black/5 flex justify-center px-4">
        <div className="max-w-[980px] w-full text-[12px] text-muted-foreground tracking-apple-caption">
          Copyright © 2026 TMS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
