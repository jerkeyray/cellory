import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma";
import {
  getAuthErrorFingerprint,
  isRecoverableAuthError,
  shouldLogAuthErrorOnce,
} from "@/app/lib/auth-errors";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  trustHost: true,
  logger: {
    error(error) {
      const maybeError = (error as { cause?: unknown } | undefined)?.cause ?? error;

      if (isRecoverableAuthError(maybeError) || isRecoverableAuthError(error)) {
        if (process.env.NODE_ENV === "development") {
          const key = `authjs:${getAuthErrorFingerprint(maybeError)}`;
          if (shouldLogAuthErrorOnce(key)) {
            console.warn("[auth] recoverable adapter error");
          }
        }
        return;
      }

      console.error("[auth][error]", error);
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
