export function areErrorsEqual(error1: unknown, error2: unknown): boolean {
  if (error1 instanceof Error && error2 instanceof Error) {
    return error1.message === error2.message;
  }
  return error1 === error2;
}

export function ignoreError() {}

export class CustomError extends Error {
  constructor({
    code,
    statusCode,
    message,
  }: {
    code: string;
    statusCode: number;
    message: string;
  }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }

  public code: string;
  public statusCode: number;
}

// 400
export class BadRequestError extends CustomError {
  constructor(code: string, message: string) {
    super({
      statusCode: 400,
      code,
      message,
    });
  }
}

// 401
export class UnauthorizedError extends CustomError {
  constructor(code: string, message: string) {
    super({
      statusCode: 401,
      code,
      message,
    });
  }
}

// 403
export class NoPermissionError extends CustomError {
  constructor(code: string, message: string) {
    super({
      statusCode: 403,
      code,
      message,
    });
  }
}

// 404
export class NotFoundError extends CustomError {
  constructor(code: string, message: string) {
    super({
      statusCode: 404,
      code,
      message,
    });
  }
}

// 409
export class ConflictError extends CustomError {
  constructor(code: string, message: string) {
    super({
      statusCode: 409,
      code,
      message,
    });
  }
}

// 500
export class InternalServerError extends CustomError {
  constructor(code: string, message: string) {
    super({
      statusCode: 500,
      code,
      message,
    });
  }
}

// 501
export class NotImplementedError extends CustomError {
  constructor(code: string, message: string) {
    super({
      statusCode: 501,
      code,
      message,
    });
  }
}
