import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"

/**
 * Edge-compatible auth configuration (without Prisma adapter).
 * Used by middleware which runs in Edge Runtime.
 *
 * Note: Credentials provider authorize() is empty here because
 * it requires Prisma which doesn't work in Edge Runtime.
 * The full implementation is in auth.ts for Node.js runtime.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login"
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!
    }),
    // Credentials provider placeholder for Edge Runtime
    // Full implementation with Prisma is in auth.ts
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      authorize: () => null // Placeholder - real auth happens in Node.js runtime
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: "USER" | "COMPANY" | "ADMIN" }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as "USER" | "COMPANY" | "ADMIN"
        session.user.isBlocked = token.isBlocked as boolean
        if (token.picture) {
          session.user.image = token.picture as string
        }
      }
      return session
    }
  }
}
