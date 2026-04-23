import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI, admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",")
  : [];

const globalForAuth = globalThis as unknown as {
  auth: ReturnType<typeof betterAuth> | undefined;
};

export const auth =
  globalForAuth.auth ??
  betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
    },
    user: {
      additionalFields: {
        role: { type: "string" },
        phone: { type: "string" },
        banned: { type: "boolean" },
        banReason: { type: "string" },
        banExpires: { type: "date" },
      },
    },
    trustedOrigins,
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
      expiresIn: 60 * 60 * 24 * 7,
    },
    plugins: [
      openAPI(),
      admin({
        impersonationSessionDuration: 60 * 60,
      }),
    ],
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuth.auth = auth as any;
}

export type Auth = typeof auth;
