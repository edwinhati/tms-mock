"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useSession } from "@/lib/auth";
import type { RolePermissions } from "@/lib/auth/roles";
import { getUserRole, hasPermission, type UserRole } from "@/lib/auth/roles";

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: keyof RolePermissions;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Component to guard content based on user role or permission
 */
export function RoleGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback,
  redirectTo,
}: RoleGuardProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const userRole = getUserRole(session?.user);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      if (redirectTo) {
        router.push(redirectTo);
      }
      return;
    }

    // Check role requirement
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(userRole)) {
        if (redirectTo) {
          router.push(redirectTo);
        }
        return;
      }
    }

    // Check permission requirement
    if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [
    session,
    isPending,
    userRole,
    requiredRole,
    requiredPermission,
    redirectTo,
    router,
  ]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return fallback || null;
  }

  // Check role requirement
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(userRole)) {
      return fallback || null;
    }
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user has permission
 */
export function usePermission(permission: keyof RolePermissions): boolean {
  const { data: session } = useSession();
  const userRole = getUserRole(session?.user);
  return hasPermission(userRole, permission);
}

/**
 * Hook to get user role
 */
export function useUserRole(): UserRole {
  const { data: session } = useSession();
  return getUserRole(session?.user);
}

/**
 * Component to conditionally render based on permission
 */
export function PermissionGate({
  permission,
  children,
  fallback,
}: {
  permission: keyof RolePermissions;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const hasAccess = usePermission(permission);

  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
}
