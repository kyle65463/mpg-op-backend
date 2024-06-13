export enum PrismaError {
  UniqueConstraint = "P2002",
  ForeignKeyConstraint = "P2003",
  NotFound = "P2025",
}

const prismaErrors = [
  PrismaError.UniqueConstraint,
  PrismaError.ForeignKeyConstraint,
  PrismaError.NotFound,
];

/**
 * For type checking.
 */
function isPrismaError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
): err is { code: string; meta?: Record<string, unknown> } {
  return (
    err && typeof err.code === "string" && typeof err.clientVersion === "string"
  );
}

/**
 * Transform prisma errors to predefined custom errors and throw the custom error.
 * If there are no matched custom errors, return without rethrowing any error.
 * @param err - The occurring error.
 * @param customErrors - A table that maps prisma errors want to handle to custom errors.
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export function handlePrismaError(
  customErrors: Partial<
    Record<
      PrismaError,
      Error | { meta?: { field: string; include: string }; error: Error }[]
    >
  >,
) {
  return (err: unknown) => {
    if (!isPrismaError(err)) throw err;

    for (const prismaError of prismaErrors) {
      const customError = customErrors[prismaError];
      if (err.code !== prismaError) continue;
      if (!customError) continue;

      if (customError instanceof Error) {
        throw customError;
      } else {
        for (const { meta, error } of customError) {
          if (!meta) throw error;
          const field = err.meta?.[meta.field];
          if (typeof field === "string" && field.includes(meta.include)) {
            throw error;
          }
        }
      }
    }
    throw err;
  };
}
