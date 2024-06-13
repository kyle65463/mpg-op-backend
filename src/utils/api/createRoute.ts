import { ZodSchema } from "zod";

import { CustomError } from "@/utils/error/base";
import { ServiceError } from "@/utils/error/service";

import { verifyAuthToken } from "./auth";
import { APIServer } from "./createServer";
import { registerRouteToApiDocs } from "./openapi";
import { RequestSchema, ResponseSchema } from "./schema";
import { validateRequest, validateResponse } from "./validation";
import { env } from "../env";

export type CreateRoutes<T> = (
  services: T,
) => (server: APIServer) => Promise<void>;

/**
 * HTTP methods.
 */
type Method = "get" | "post" | "patch" | "delete" | "put";

interface CreateRouteProps<TParams, TQuery, TBody, TResponse> {
  /**
   * The express router to handle the route.
   */
  server: APIServer;

  /**
   * The base path, for registering api docs only by concatenating with path, defaults to "".
   * @example /auth
   */
  basePath?: string;

  /**
   * The path after base path, for registering express router and api docs, e.g. /login/email.
   * @example /login/email
   */
  path: string;

  /**
   * The HTTP method.
   */
  method: Method;

  /**
   * A brief description of the route to display on api docs.
   */
  summary?: string;

  /**
   * A full description of the route to display on api docs.
   */
  description?: string;

  /**
   * A list of tags to display on api docs.
   */
  tags?: string[];

  /**
   * If the request needs to be authenticated to access by checking the auth token on the header, defaults to true.
   * Notes: if true, it will be handled by isAuthenticated middleware.
   */
  needAuthenticated: boolean;

  /**
   * Schemas to validate payload of request and response.
   * Notes: if not undefined, it will be handled by validateRequestMiddleware and validateResponseMiddleware.
   */
  schemas: {
    request: RequestSchema<TParams, TQuery, TBody>;
    response: ResponseSchema<TResponse> | ResponseSchema<TResponse>["schema"];
  };

  errors?: CustomError[];

  /**
   * The request handler.
   */
  handler: (
    params: TParams & TQuery & TBody & { userId: string },
  ) => Promise<TResponse> | TResponse;
}

/**
 * Create a route with handler, and register it to api docs by request and response schemas automatically.
 */
export function createRoute<TParams, TQuery, TBody, TResponse>({
  server,
  basePath = "",
  path,
  method,
  summary,
  description,
  tags,
  needAuthenticated,
  schemas: { request: requestSchema, response },
  errors = [],
  handler,
}: CreateRouteProps<TParams, TQuery, TBody, TResponse>) {
  const responseSchema =
    response instanceof ZodSchema ? response : response?.schema;
  const responseStatusCode =
    response instanceof ZodSchema || response === undefined
      ? 200
      : response.statusCode;

  registerRouteToApiDocs({
    method,
    path: basePath + path,
    description,
    summary,
    tags,
    request: requestSchema,
    response: {
      schema: responseSchema,
      statusCode: responseStatusCode,
    },
    errors,
    needAuthenticated,
  });

  server.route({
    method,
    url: path,
    handler: async (request, reply) => {
      // Check if the auth token is valid
      let userId: string | undefined;
      if (needAuthenticated !== false) {
        try {
          const [, token] = request.headers.authorization?.split(" ") || [];
          // TODO: Inject access token instead of using from env
          const authPayload = verifyAuthToken(token, env.accessTokenSecret);
          userId = authPayload.userId;
        } catch (e) {
          // TODO: Catch more specific error
          throw ServiceError.Unauthorized;
        }
      }
      let params = validateRequest(request, requestSchema);
      if (userId && requestSchema.auth) {
        params = { ...params, userId };
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const res = await handler({
        ...params,
        userId,
      });
      if (responseSchema) {
        const validatedResponse = validateResponse(res, responseSchema);
        reply.status(responseStatusCode).send(validatedResponse);
      } else {
        reply.status(responseStatusCode).send();
      }
    },
  });
}
