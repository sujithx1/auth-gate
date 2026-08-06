export class AuthGateError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AuthGateError';
  }
}

export class NotFoundError extends AuthGateError {
  constructor(message: string, code: string = 'NOT_FOUND') {
    super(code, message, 404);
  }
}

export class UnauthorizedError extends AuthGateError {
  constructor(message: string, code: string = 'UNAUTHORIZED') {
    super(code, message, 401);
  }
}

export class ConflictError extends AuthGateError {
  constructor(message: string, code: string = 'CONFLICT') {
    super(code, message, 409);
  }
}

export class ValidationError extends AuthGateError {
  constructor(message: string, details?: unknown, code: string = 'VALIDATION_ERROR') {
    super(code, message, 400, details);
  }
}
