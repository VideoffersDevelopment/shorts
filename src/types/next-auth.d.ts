import { type DefaultSession, type DefaultUser } from "next-auth"
import { type JWT as DefaultJWT } from "next-auth/jwt"

// Role type mirrored from Prisma schema
// Defined locally to avoid Edge Runtime issues with @prisma/client imports
type Role = "USER" | "COMPANY" | "ADMIN"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      isBlocked?: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: Role
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    role?: Role
    isBlocked?: boolean
  }
}
