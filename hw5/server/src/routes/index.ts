import { FastifyPluginAsync } from "fastify";

import healthRoutes from "../routes/health.js";
import usersRoutes from "../modules/users/users.routes.js";
import postsRoutes from "../modules/posts/posts.routes.js";
import timelineRoutes from "../modules/timeline/timeline.routes.js";
import draftsRoutes from "../modules/drafts/drafts.routes.js";
import notificationsRoutes from "../modules/notifications/notifications.routes.js";

const routes: FastifyPluginAsync = async (app) => {
  app.register(healthRoutes);
  app.register(usersRoutes, { prefix: "/users" });
  app.register(postsRoutes, { prefix: "/posts" });
  app.register(timelineRoutes, { prefix: "/timeline" });
  app.register(draftsRoutes, { prefix: "/drafts" });
  app.register(notificationsRoutes, { prefix: "/notifications" });
};

export default routes;

