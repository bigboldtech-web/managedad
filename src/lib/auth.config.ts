import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — no Prisma, no bcrypt, no Node.js-only imports.
 * Used by middleware (Edge Runtime). The full config in auth.ts spreads this.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" as const },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [], // Populated in auth.ts (credentials/google need Node.js runtime)
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
