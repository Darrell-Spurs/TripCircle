import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "../prisma";

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  }),
  GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  }),
  FacebookProvider({
    clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
  }),
];

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update") {
        const nextHandle = session?.user?.handle as string | undefined;
        if (nextHandle) {
          token.handle = nextHandle;
        }
      }

      if (user) {
        token.userId = user.id;
        token.handle = (user as { handle?: string | null }).handle ?? token.handle ?? null;
      }

      if (!token.handle && token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId },
          select: { handle: true },
        });
        token.handle = dbUser?.handle ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = {} as typeof session.user;
      }

      if (token.userId) {
        session.user.id = token.userId;
      }

      session.user.handle = (token.handle as string | null) ?? null;

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName: user.name ?? user.email ?? "New User",
          avatarUrl: user.image,
        },
      });
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
