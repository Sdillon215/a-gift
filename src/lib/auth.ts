import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Session, User } from "next-auth"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password ?? ""
        )

        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.email === "sdillon215@gmail.com"
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = (user as User).id
        token.isAdmin = (user as User).isAdmin
      }
      return token
    },
    async session({ session, token }): Promise<Session> {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    }
  }
}