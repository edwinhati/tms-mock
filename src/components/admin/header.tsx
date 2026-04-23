"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchIcon, BellIcon, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-50 h-[48px] w-full bg-apple-glass flex items-center justify-between px-4 border-none">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        <span className="font-semibold text-[13px] tracking-apple-body uppercase text-muted-foreground/80">
          TMS Dashboard
        </span>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 hover:bg-transparent"
        >
          <SearchIcon className="size-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 hover:bg-transparent"
        >
          <BellIcon className="size-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative size-7 rounded-full ml-1 p-0 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-gray-900 border border-border/50"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-400">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 mt-2 bg-apple-glass backdrop-blur-xl border-border/50 rounded-xl shadow-2xl"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 rounded-lg mx-1 my-0.5">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 rounded-lg mx-1 my-0.5">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg mx-1 my-0.5"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
