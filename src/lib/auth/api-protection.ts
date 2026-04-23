import { type NextRequest, NextResponse } from "next/server";
import type { RolePermissions } from "./roles";
import { getUserRole, hasPermission, type UserRole } from "./roles";
import { auth } from "./server";

export interface ProtectionOptions {
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: keyof RolePermissions;
}

/**
 * Protect API route with authentication and authorization
 */
export async function protectAPIRoute(
  request: NextRequest,
  options?: ProtectionOptions,
): Promise<
  | { authorized: true; session: unknown; userRole: UserRole }
  | { authorized: false; response: NextResponse }
> {
  // Check authentication
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 },
      ),
    };
  }

  const userRole = getUserRole(session.user);

  // Check role requirement
  if (options?.requiredRole) {
    const roles = Array.isArray(options.requiredRole)
      ? options.requiredRole
      : [options.requiredRole];

    if (!roles.includes(userRole)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden - Insufficient permissions" },
          { status: 403 },
        ),
      };
    }
  }

  // Check permission requirement
  if (options?.requiredPermission) {
    if (!hasPermission(userRole, options.requiredPermission)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden - Insufficient permissions" },
          { status: 403 },
        ),
      };
    }
  }

  return {
    authorized: true,
    session,
    userRole,
  };
}

/**
 * Middleware wrapper for API routes
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: { params: unknown; session: unknown; userRole: UserRole },
  ) => Promise<NextResponse>,
  options?: ProtectionOptions,
) {
  return async (request: NextRequest, { params }: { params: unknown }) => {
    const protection = await protectAPIRoute(request, options);

    if (!protection.authorized) {
      return protection.response;
    }

    return handler(request, {
      params,
      session: protection.session,
      userRole: protection.userRole,
    });
  };
}
