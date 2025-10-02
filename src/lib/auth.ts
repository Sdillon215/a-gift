import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()



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
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.isAdmin = (user as any).isAdmin
      }
      return token
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        (session.user as any).id = token.id
        (session.user as any).isAdmin = token.isAdmin
      }
      return session
    }
  }
}
