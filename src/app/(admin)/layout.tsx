import { QueryProvider } from "@/lib/api/query-provider";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "@/components/admin/header";

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
