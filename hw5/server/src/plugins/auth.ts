import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { jwtVerify } from "jose";

import { env } from "../lib/env.js";

const COOKIE_TOKENS = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

const authPlugin: FastifyPluginAsync = fp(async (app) => {
  const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);

  app.decorateRequest("currentUserId", null);

  app.addHook("preHandler", async (request) => {
    let token: string | null = null;

    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      token = header.slice("Bearer ".length);
    }

    if (!token) {
      for (const key of COOKIE_TOKENS) {
        const value = request.cookies?.[key];
        if (value) {
          token = value;
          break;
        }
      }
    }

    if (!token) {
      request.currentUserId = null;
      return;
    }

    try {
      const { payload } = await jwtVerify(token, secret);
      const sub = payload?.sub;
      if (typeof sub === "string" && sub.length) {
        request.currentUserId = sub;
      } else {
        request.currentUserId = null;
      }
    } catch {
      request.currentUserId = null;
    }
  });
});

declare module "fastify" {
  interface FastifyRequest {
    currentUserId: string | null;
  }
}

export default authPlugin;
