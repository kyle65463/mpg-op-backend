import cors from "@fastify/cors";
import etag from "@fastify/etag";
import fastify, { FastifyInstance } from "fastify";
import fs from "fs";

import { CustomError } from "@/utils/error/base";
import { ServiceError } from "@/utils/error/service";
import { logger } from "@/utils/logger";

interface CreateServerOptions {
  healthCheckPath?: string;
  apiDocs?: {
    path: string;
    filePath: string;
  };
}

export function createServer({
  healthCheckPath,
  apiDocs,
}: CreateServerOptions = {}) {
  const server = fastify();

  // TODO: Handle CORS properly
  server.register(cors, {
    origin: true,
  });

  server.register(etag);

  server.register((instance, _, next) => {
    if (healthCheckPath) {
      instance.get(healthCheckPath, async () => "ok");
    }
    next();
  });

  if (apiDocs) {
    server.get(apiDocs.path, (_, reply) => {
      fs.readFile(apiDocs.filePath, "utf8", (err, data) => {
        if (err) {
          reply.code(500).send("Error reading the file");
          return;
        }
        reply.type("application/x-yaml").send(data);
      });
    });
  }

  server.setNotFoundHandler(() => {
    throw ServiceError.RouteNotFound;
  });

  server.setErrorHandler((error, _, reply) => {
    logger?.error({
      error: error instanceof Error ? error.stack : error,
    });

    if (!(error instanceof CustomError)) {
      error = ServiceError.InternalServerError;
    }

    const { message, code, statusCode } = error as CustomError;
    reply.status(statusCode).send({ code, message });
  });

  return server;
}

export type APIServer = FastifyInstance;
