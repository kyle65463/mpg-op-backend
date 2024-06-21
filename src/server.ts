import { PrismaClient } from "@prisma/pg/index";
import { mock } from "vitest-mock-extended";

import { createNativeProductRoutes } from "./endpoints/nativeProduct/route";
import {
  createNativeProductService,
  NativeProductService,
} from "./endpoints/nativeProduct/service";
import { createPackageRoutes } from "./endpoints/package/route";
import {
  createPackageService,
  PackageService,
} from "./endpoints/package/service";
import { createNativeProductRepo } from "./repos/nativeProductRepo";
import { createPackageRepo } from "./repos/packageRepo";
import { APIServer, createServer } from "./utils/api/createServer";
import { env } from "./utils/env";
import { logger } from "./utils/logger";

interface Services {
  nativeProductService: NativeProductService;
  packageService: PackageService;
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
  const nativeProductRepo = createNativeProductRepo(db);
  const packageRepo = createPackageRepo(db);

  // Services
  const nativeProductService = createNativeProductService({
    nativeProductRepo,
  });
  const packageService = createPackageService({
    packageRepo,
  });

  return {
    nativeProductService,
    packageService,
  };
}

/**
 * 建立假的 services 以避免真的連接到資料庫與其他服務
 */
export function setupMockServices(): Services {
  const nativeProductService = createNativeProductService({
    nativeProductRepo: mock(),
  });
  const packageService = createPackageService({
    packageRepo: mock(),
  });

  return {
    nativeProductService,
    packageService,
  };
}

/**
 * 建立 server 並註冊所有的 api routes
 */
export async function setupServer({
  nativeProductService,
  packageService,
}: Services) {
  const server = createServer({
    healthCheckPath: "/api/v1/healthz",
    apiDocs: {
      path: "/api/v1/docs",
      filePath: "openapi.yaml",
    },
  });
  server.register(createNativeProductRoutes({ nativeProductService }));
  server.register(createPackageRoutes({ packageService }));

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
