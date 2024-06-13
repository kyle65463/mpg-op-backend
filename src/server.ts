import { PrismaClient } from "@prisma/pg/index";
import { mock } from "vitest-mock-extended";

import { createCommentRoutes } from "./endpoints/comment/route";
import {
  CommentService,
  createCommentService,
} from "./endpoints/comment/service";
import { createPostRoutes } from "./endpoints/post/route";
import { createPostService, PostService } from "./endpoints/post/service";
import { createCommentRepo } from "./repos/commentRepo";
import { createPostRepo } from "./repos/postRepo";
import { APIServer, createServer } from "./utils/api/createServer";
import { env } from "./utils/env";
import { logger } from "./utils/logger";

interface Services {
  commentService: CommentService;
  postService: PostService;
}

export function setupRealServices(): Services {
  // Clients
  const db = new PrismaClient();
  // const redis = createRedisClient({
  //   host: env.redisUrl,
  //   password: env.redisPassword,
  //   dbIndex: env.redisDbIndex,
  // });

  // Repos
  const commentRepo = createCommentRepo(db);
  const postRepo = createPostRepo(db);

  // Services
  const commentService = createCommentService({ commentRepo });
  const postService = createPostService({ postRepo, commentRepo });

  return {
    commentService,
    postService,
  };
}

/**
 * 建立假的 services 以避免真的連接到資料庫與其他服務
 */
export function setupMockServices(): Services {
  const commentService = createCommentService({ commentRepo: mock() });
  const postService = createPostService({
    postRepo: mock(),
    commentRepo: mock(),
  });

  return {
    commentService,
    postService,
  };
}

/**
 * 建立 server 並註冊所有的 api routes
 */
export async function setupServer({ commentService, postService }: Services) {
  const server = createServer({
    healthCheckPath: "/api/v1/healthz",
    apiDocs: {
      path: "/api/v1/docs",
      filePath: "openapi.yaml",
    },
  });
  server.register(createCommentRoutes({ commentService }));
  server.register(createPostRoutes({ postService }));

  await server.ready();
  return server;
}

export async function startServer(server: APIServer) {
  try {
    const port = env.port;
    const host = "0.0.0.0";
    await server.listen({ port, host });
    logger.info(`Server started on port ${port}`);
  } catch (err) {
    logger.error("Server started failed");
    logger.error(err);
    process.exit(1);
  }
}

/**
 * 開始執行 api server
 */
export async function exec() {
  const services = setupRealServices();
  const server = await setupServer(services);
  startServer(server);
}
