import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

import { prisma } from "../lib/prisma.js";

const prismaPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}, { name: "prisma" });

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

export default prismaPlugin;

