export const AUTH_PATHS = {
  SIGN_IN: "/auth/login",
  FORGOT_PASSWORD: "/auth/forgot-password",
  CALLBACK: "/auth/callback",
} as const;

export const PUBLIC_PATHS = [
  "/_next",
  "/api",
  "/favicon.ico",
  "/health",
  "/metrics",
] as const;

export const PROTECTED_PATHS = [
  "/",
  "/dashboard",
  "/master",
  "/shipments",
  "/reports",
  "/driver/shipments",
] as const;

export const SESSION_COOKIE_NAME = "session_token";
