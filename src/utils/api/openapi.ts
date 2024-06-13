/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  ResponseConfig,
} from "@asteasolutions/zod-to-openapi";
import { z, ZodObject, ZodSchema } from "zod";

import { CustomError } from "@/utils/error/base";
import { ServiceError } from "@/utils/error/service";

import { RequestSchema, ResponseSchema } from "./schema";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

/**
 * Register a route to api docs
 */
export function registerRouteToApiDocs({
  method,
  path,
  summary,
  description,
  tags,
  request,
  response,
  errors = [],
  needAuthenticated = false,
}: {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  summary?: string;
  description?: string;
  tags?: string[];
  request?: RequestSchema;
  response?: ResponseSchema;
  errors?: CustomError[];
  needAuthenticated: boolean;
}) {
  const responses: {
    [statusCode: string]: ResponseConfig;
  } = {};
  if (response) {
    responses[response.statusCode.toString()] = {
      description: "",
      content: response.schema
        ? {
            "application/json": {
              schema: response.schema,
            },
          }
        : undefined,
    };
  }

  const headers = needAuthenticated
    ? z.object({
        Authorization: z.string().openapi({
          description: "Access token",
          example: "Bearer <token>",
        }),
      })
    : undefined;

  if (needAuthenticated) {
    errors.push(ServiceError.Unauthorized);
  }

  for (const error of errors) {
    responses[error.statusCode.toString()] = {
      description: "",
      content: {
        "application/json": {
          schema: z.object({
            code: z.literal(error.code),
            message: z.literal(error.message),
          }),
        },
      },
    };
  }

  registry.registerPath({
    method,
    path,
    summary,
    description,
    tags,
    request: request
      ? {
          headers,
          query: request.query as ZodObject<any>,
          params: request.params as ZodObject<any>,
          body: request.body
            ? {
                content: { json: { schema: request.body } },
              }
            : undefined,
        }
      : headers
        ? {
            headers,
          }
        : undefined,
    responses,
  });
}

/**
 * Register a model schema to api docs
 * @param name - The name of the schema
 * @param schema - The zod schema going to be registered
 */
export function registerModelToApiDocs<T extends ZodSchema<any>>(
  name: string,
  schema: T,
): T {
  return schema.openapi(name);
}
