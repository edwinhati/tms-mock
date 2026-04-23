import { admin } from "better-auth/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [admin()],
});

export const { signIn, signOut, useSession } = authClient;
