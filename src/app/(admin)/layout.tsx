import { AppSidebar } from "@/components/admin/app-sidebar";
import { Header } from "@/components/admin/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { QueryProvider } from "@/lib/api/query-provider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-background">
          <Header />
          <div className="flex-1 overflow-visible">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
