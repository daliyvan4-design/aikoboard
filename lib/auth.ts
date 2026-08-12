import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const ip = (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim()
          || (req?.headers?.["x-real-ip"] as string)
          || "anonymous";
        const key = `login:${ip}`;
        const now = Date.now();
        const entry = loginAttempts.get(key);
        if (entry && now < entry.resetAt && entry.count >= 5) return null;
        if (!entry || now > entry.resetAt) {
          loginAttempts.set(key, { count: 1, resetAt: now + 300_000 });
        } else {
          entry.count++;
        }

        const user = await prisma.adminUser.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.actif) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        loginAttempts.delete(key);
        return { id: user.id, email: user.email, name: user.nom, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      } else if (token.sub) {
        const dbUser = await prisma.adminUser.findUnique({
          where: { id: token.sub },
          select: { role: true, actif: true },
        });
        if (!dbUser || !dbUser.actif) {
          token.role = undefined;
          token.error = "inactive";
        } else {
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as import("@prisma/client").Role;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
