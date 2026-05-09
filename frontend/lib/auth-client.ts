import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same domain — no baseURL needed in production.
  // Set this if your auth server is on a different port during dev.
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
