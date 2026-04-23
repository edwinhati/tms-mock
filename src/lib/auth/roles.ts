// Role-based access control utilities

export type UserRole = "admin" | "driver" | "viewer" | "user";

export const ROLES = {
  ADMIN: "admin" as const,
  DRIVER: "driver" as const,
  VIEWER: "viewer" as const,
  USER: "user" as const,
};

export interface RolePermissions {
  canViewShipments: boolean;
  canCreateShipments: boolean;
  canEditShipments: boolean;
  canDeleteShipments: boolean;
  canAssignDrivers: boolean;
  canUpdateStatus: boolean;
  canViewMasterData: boolean;
  canEditMasterData: boolean;
  canViewReports: boolean;
  canGenerateBAST: boolean;
  canAccessDriverApp: boolean;
  canAccessAdminDashboard: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewShipments: true,
    canCreateShipments: true,
    canEditShipments: true,
    canDeleteShipments: true,
    canAssignDrivers: true,
    canUpdateStatus: true,
    canViewMasterData: true,
    canEditMasterData: true,
    canViewReports: true,
    canGenerateBAST: true,
    canAccessDriverApp: false,
    canAccessAdminDashboard: true,
  },
  driver: {
    canViewShipments: true, // Only assigned shipments
    canCreateShipments: false,
    canEditShipments: false,
    canDeleteShipments: false,
    canAssignDrivers: false,
    canUpdateStatus: true, // Only for assigned shipments
    canViewMasterData: false,
    canEditMasterData: false,
    canViewReports: false,
    canGenerateBAST: false,
    canAccessDriverApp: true,
    canAccessAdminDashboard: false,
  },
  viewer: {
    canViewShipments: true,
    canCreateShipments: false,
    canEditShipments: false,
    canDeleteShipments: false,
    canAssignDrivers: false,
    canUpdateStatus: false,
    canViewMasterData: true,
    canEditMasterData: false,
    canViewReports: true,
    canGenerateBAST: false,
    canAccessDriverApp: false,
    canAccessAdminDashboard: true,
  },
  user: {
    canViewShipments: true,
    canCreateShipments: false,
    canEditShipments: false,
    canDeleteShipments: false,
    canAssignDrivers: false,
    canUpdateStatus: false,
    canViewMasterData: true,
    canEditMasterData: false,
    canViewReports: true,
    canGenerateBAST: false,
    canAccessDriverApp: false,
    canAccessAdminDashboard: true,
  },
};

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions,
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(role: UserRole): boolean {
  return hasPermission(role, "canAccessAdminDashboard");
}

/**
 * Check if user can access driver app
 */
export function canAccessDriverApp(role: UserRole): boolean {
  return hasPermission(role, "canAccessDriverApp");
}

/**
 * Check if user can perform write operations
 */
export function canWrite(role: UserRole): boolean {
  return (
    hasPermission(role, "canCreateShipments") ||
    hasPermission(role, "canEditShipments") ||
    hasPermission(role, "canEditMasterData")
  );
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === ROLES.ADMIN;
}

/**
 * Check if user is driver
 */
export function isDriver(role: UserRole): boolean {
  return role === ROLES.DRIVER;
}

/**
 * Check if user is viewer
 */
export function isViewer(role: UserRole): boolean {
  return role === ROLES.VIEWER;
}

/**
 * Get user role from session or user object
 */
export function getUserRole(
  user: { role?: string | null; [key: string]: unknown } | null | undefined,
): UserRole {
  if (!user || !user.role) {
    return ROLES.VIEWER;
  }

  const role = user.role.toLowerCase();
  if (
    role === "admin" ||
    role === "driver" ||
    role === "viewer" ||
    role === "user"
  ) {
    return role as UserRole;
  }

  return ROLES.VIEWER;
}
