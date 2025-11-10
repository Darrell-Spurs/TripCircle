import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { jwtVerify } from "jose";

import { env } from "../lib/env.js";

const COOKIE_TOKENS = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

const authPlugin: FastifyPluginAsync = fp(async (app) => {
  // NextAuth uses A256GCM which requires exactly 32 bytes (256 bits)
  // Secret must be exactly 32 characters in both frontend and backend .env files
  const secret = new TextEncoder().encode(env.NEXTAUTH_SECRET);
  app.log.info({ 
    secretLength: env.NEXTAUTH_SECRET.length,
    bytesLength: secret.length 
  }, "Auth plugin initialized (secret MUST be 32 chars)");

  app.decorateRequest("currentUserId", null);

  app.addHook("preHandler", async (request) => {
    let token: string | null = null;

    const header = request.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      token = header.slice("Bearer ".length);
      app.log.info({ path: request.url }, "Found Bearer token in Authorization header");
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
      app.log.info({ 
        path: request.url, 
        cookies: Object.keys(request.cookies ?? {}),
        hasAuthHeader: !!header,
        authHeader: header ? header.substring(0, 20) + "..." : null
      }, "No auth token found");
      request.currentUserId = null;
      return;
    }

    try {
      app.log.info({ 
        tokenLength: token.length,
        tokenStart: token.substring(0, 20),
        path: request.url 
      }, "Attempting to verify token");
      
      // Verify the signed JWT from our /api/token endpoint
      const { payload } = await jwtVerify(token, secret);
      const sub = payload?.sub;
      if (typeof sub === "string" && sub.length) {
        request.currentUserId = sub;
        app.log.info({ userId: sub, path: request.url }, "User authenticated ✅");
      } else {
        app.log.info({ payload, path: request.url }, "Invalid token payload");
        request.currentUserId = null;
      }
    } catch (error) {
      app.log.info({ 
        error: (error as Error).message, 
        errorName: (error as Error).name,
        path: request.url 
      }, "Token verification failed");
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
