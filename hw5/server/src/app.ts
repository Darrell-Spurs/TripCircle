import fastify, { FastifyInstance } from "fastify";
import { ZodTypeAny } from "zod";

import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";

import { env } from "./lib/env.js";
import authPlugin from "./plugins/auth.js";
import prismaPlugin from "./plugins/prisma.js";
import routes from "./routes/index.js";

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: true,
  });

  app.setValidatorCompiler(({ schema }) => {
    return (data) => {
      const zodSchema = schema as ZodTypeAny;
      const result = zodSchema.safeParse(data);
      if (result.success) {
        return { value: result.data };
      }
      return { error: result.error };
    };
  });

  app.register(sensible);
  app.register(cookie);
  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (origin === env.CLIENT_ORIGIN) {
        cb(null, true);
        return;
      }
      cb(new Error("Not allowed"), false);
    },
    credentials: true,
  });
  app.register(prismaPlugin);
  app.register(authPlugin);
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (request, payload, done) => {
      if (!payload || payload.length === 0) {
        done(null, {});
        return;
      }
      try {
        const payloadString = typeof payload === "string" ? payload : payload.toString();
        const json = JSON.parse(payloadString);
        done(null, json);
      } catch (error) {
        done(error as Error, undefined);
      }
    },
  );
  app.register(routes, { prefix: "/api" });

  return app;
}

