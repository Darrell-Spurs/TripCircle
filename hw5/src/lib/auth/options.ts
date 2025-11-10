import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "../prisma";

const providers: NextAuthOptions["providers"] = [];

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (googleClientId && googleClientSecret) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
} else {
  console.warn("[auth] Google provider disabled: missing GOOGLE_CLIENT_ID/SECRET");
}

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
if (githubClientId && githubClientSecret) {
  providers.push(
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  );
} else {
  console.warn("[auth] GitHub provider disabled: missing GITHUB_CLIENT_ID/SECRET");
}

const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
if (facebookClientId && facebookClientSecret) {
  providers.push(
    FacebookProvider({
      clientId: facebookClientId,
      clientSecret: facebookClientSecret,
    }),
  );
} else {
  console.warn("[auth] Facebook provider disabled: missing FACEBOOK_CLIENT_ID/SECRET");
}

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
        const nextName = session?.user?.name as string | undefined;
        if (nextName) {
          token.name = nextName;
        }
      }

      if (user) {
        token.userId = user.id;
        token.handle = (user as { handle?: string | null }).handle ?? token.handle ?? null;
        token.name = user.name ?? token.name ?? null;
      }

      if (!token.handle && token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId },
          select: { handle: true, name: true },
        });
        token.handle = dbUser?.handle ?? null;
        token.name = dbUser?.name ?? token.name ?? null;
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
      session.user.name = (token.name as string | null) ?? session.user.name ?? null;

      return session;
    },
    async signIn({ user, account }) {
      // For OAuth sign-ins, this is called after account creation
      // We always allow sign-in - the middleware will handle redirects
      return true;
    },
    async redirect({ url, baseUrl }) {
      // After OAuth, check if redirect URL is /register - allow it
      if (url.includes("/register")) {
        return `${baseUrl}/register`;
      }
      
      // Allow relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Allow same-origin URLs
      try {
        const targetUrl = new URL(url);
        if (targetUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        // ignore invalid URLs
      }
      
      // Default to home (middleware will redirect to /register if no handle)
      return baseUrl;
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

