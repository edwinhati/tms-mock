import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type UserRole = "admin" | "driver" | "viewer" | "user";

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
}

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const userRole = (session.user as SessionUser).role || "viewer";

  if (!allowedRoles.includes(userRole)) {
    redirect("/unauthorized");
  }

  return session;
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireDriver() {
  return requireRole(["driver", "admin"]);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user as SessionUser | null;
}

export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}
