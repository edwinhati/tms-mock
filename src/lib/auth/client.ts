import { createAuthClient } from "better-auth/react";
import { admin } from "better-auth/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [admin()],
});

export const { signIn, signOut, useSession } = authClient;
