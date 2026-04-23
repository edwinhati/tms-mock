"use client";

import {
  IconBox,
  IconBuildingStore,
  IconDashboard,
  IconFileReport,
  IconLogout,
  IconMapPin,
  IconSchool,
  IconShip,
  IconTruck,
  IconTruckDelivery,
  IconUsers,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

const navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: IconDashboard,
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Shipments",
        href: "/shipments",
        icon: IconShip,
      },
    ],
  },
  {
    title: "Master Data",
    items: [
      {
        title: "Customers",
        href: "/master/customers",
        icon: IconUsers,
      },
      {
        title: "Vendors",
        href: "/master/vendors",
        icon: IconBuildingStore,
      },
      {
        title: "Drivers",
        href: "/master/drivers",
        icon: IconTruckDelivery,
      },
      {
        title: "Vehicles",
        href: "/master/vehicles",
        icon: IconTruck,
      },
      {
        title: "Schools",
        href: "/master/schools",
        icon: IconSchool,
      },
      {
        title: "Warehouses",
        href: "/master/warehouses",
        icon: IconBuildingStore,
      },
      {
        title: "Hubs",
        href: "/master/hubs",
        icon: IconMapPin,
      },
      {
        title: "Ports",
        href: "/master/ports",
        icon: IconShip,
      },
      {
        title: "Goods",
        href: "/master/goods",
        icon: IconBox,
      },
      {
        title: "Shipping Rates",
        href: "/master/shipping-rates",
        icon: IconFileReport,
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: IconFileReport,
      },
    ],
  },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname();

  const router = useRouter();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
        },
      },
    });
  };

  return (
    <Sidebar className={className}>
      <SidebarHeader className="h-16 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconTruck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-none">TMS</span>
            <span className="text-xs text-muted-foreground leading-none mt-1">
              Transport Management
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        {navigation.map((group, index) => (
          <React.Fragment key={group.title}>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                        >
                          <a
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 transition-colors",
                              isActive
                                ? "text-apple-link font-medium"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {index < navigation.length - 1 && (
              <SidebarSeparator className="my-2 mx-4" />
            )}
          </React.Fragment>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        <div className="px-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors group"
          >
            <IconLogout className="h-4 w-4 shrink-0 group-hover:text-destructive" />
            <span>Sign Out</span>
          </button>
        </div>
        <div className="flex items-center gap-2.5 px-3 text-[11px] font-medium text-muted-foreground/60 border-t pt-4 border-sidebar-border/50">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>System Online</span>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
