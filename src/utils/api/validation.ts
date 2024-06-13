import { FastifyRequest } from "fastify";
import { ZodError, ZodSchema } from "zod";

import { ServiceError } from "@/utils/error/service";
import { logger } from "@/utils/logger";

import { RequestSchema } from "./schema";

/**
 * Validate request params, query and body using zod schemas. Throw an invalid request error if the
 * request is invalid.
 */
export function validateRequest<TParams, TQuery, TBody>(
  req: FastifyRequest,
  { params, query, body }: RequestSchema<TParams, TQuery, TBody>,
): TParams & TQuery & TBody {
  // TODO: Block same property names in params, query and body
  const zodErrors: ZodError[] = [];

  let validatedParams: TParams | undefined;
  if (params) {
    const parsed = params.safeParse(req.params);
    if (!parsed.success) {
      zodErrors.push(parsed.error);
    } else {
      validatedParams = parsed.data;
    }
  }

  let validatedQuery: TQuery | undefined;
  if (query) {
    const parsed = query.safeParse(req.query);
    if (!parsed.success) {
      zodErrors.push(parsed.error);
    } else {
      validatedQuery = parsed.data;
    }
  }

  let validatedBody: TBody | undefined;
  if (body) {
    const parsed = body.safeParse(req.body);
    if (!parsed.success) {
      zodErrors.push(parsed.error);
    } else {
      validatedBody = parsed.data;
    }
  }
  if (zodErrors.length > 0) {
    logger.error(zodErrors);
    throw ServiceError.InvalidArgument;
  }

  return {
    ...(validatedParams as TParams),
    ...(validatedQuery as TQuery),
    ...(validatedBody as TBody),
  };
}

export function validateResponse<TResponse>(
  data: TResponse,
  schema: ZodSchema<TResponse>,
): TResponse {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    logger.error("Invalid response");
    logger.error(parsed.error);
    return data;
  }
  return parsed.data;
}
