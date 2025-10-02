import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Define types for callback parameters
type JWTCallbackParams = {
  token: Record<string, unknown>
  user?: Record<string, unknown>
}

type SessionCallbackParams = {
  session: {
    user?: Record<string, unknown>
  }
  token: Record<string, unknown>
}


export const authOptions = {
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
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // For this example, we'll assume passwords are stored as plain text
        // In production, you should hash passwords with bcrypt
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || "")

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.email === "sdillon215@gmail.com", // Check if user is admin
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async jwt({ token, user }: JWTCallbackParams) {
      if (user) {
        token.id = user.id as string
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin
      }
      return token
    },
    async session({ session, token }: SessionCallbackParams) {
      if (token && session.user) {
        (session.user as { id?: string; isAdmin?: boolean }).id = token.id as string
        (session.user as { id?: string; isAdmin?: boolean }).isAdmin = token.isAdmin as boolean
      }
      return session
    }
  }
}
