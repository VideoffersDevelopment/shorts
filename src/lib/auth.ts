import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { type Role } from "@prisma/client"

/**
 * Full auth configuration with Prisma adapter.
 * Used by Server Components, API Routes, Server Actions (Node.js runtime).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user?.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED")
        }

        // Check if user is blocked by admin
        if (user.isBlocked) {
          throw new Error("USER_BLOCKED")
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: Role }).role
        token.isBlocked = false // New login = not blocked

        // Fetch avatar from UserProfile on initial sign-in
        try {
          const profile = await prisma.userProfile.findUnique({
            where: { userId: user.id },
            select: { avatar: true }
          })
          if (profile?.avatar) {
            token.picture = profile.avatar
          }
        } catch {
          // Database error - continue without avatar
        }
      }

      // ALWAYS check isBlocked from database for immediate response to blocking
      // This runs on every request to ensure blocked users are detected instantly
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, isBlocked: true }
          })
          if (dbUser) {
            token.role = dbUser.role
            token.isBlocked = dbUser.isBlocked
          }
        } catch {
          // Database error - continue without update
        }
      }

      // Refresh avatar on session update trigger (not critical, so only on explicit update)
      if (trigger === "update" && token.id) {
        try {
          const profile = await prisma.userProfile.findUnique({
            where: { userId: token.id as string },
            select: { avatar: true }
          })
          if (profile?.avatar) {
            token.picture = profile.avatar
          }
        } catch {
          // Database error - continue without update
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.isBlocked = token.isBlocked as boolean

        // Pass avatar from token to session
        if (token.picture) {
          session.user.image = token.picture as string
        }
      }
      return session
    }
  }
})
