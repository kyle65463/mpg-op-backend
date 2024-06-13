/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodSchema } from "zod";

export type RequestSchema<
  TParams = any,
  TQuery = any,
  TBody = any,
  TAuth = any,
  TOthers = any,
> = {
  params?: ZodSchema<TParams>;
  query?: ZodSchema<TQuery>;
  body?: ZodSchema<TBody>;
  auth?: ZodSchema<TAuth>;
  others?: ZodSchema<TOthers>;
};

export type RequestProps<T extends RequestSchema> =
  (T["params"] extends ZodSchema ? z.infer<T["params"]> : unknown) &
    (T["body"] extends ZodSchema ? z.infer<T["body"]> : unknown) &
    (T["query"] extends ZodSchema ? z.infer<T["query"]> : unknown) &
    (T["auth"] extends ZodSchema ? z.infer<T["auth"]> : unknown) &
    (T["others"] extends ZodSchema ? z.infer<T["others"]> : unknown);

export type ResponseSchema<TResponse = any> = {
  statusCode: number;
  schema?: ZodSchema<TResponse>;
};
