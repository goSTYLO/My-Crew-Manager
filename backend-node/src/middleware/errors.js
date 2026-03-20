export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = options.name || 'AppError';
    this.statusCode = statusCode;
    this.code = options.code || 'APP_ERROR';
    this.isOperational = options.isOperational !== false;
    this.details = options.details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationAppError extends AppError {
  constructor(message = 'Validation error', options = {}) {
    super(message, 400, { ...options, name: 'ValidationAppError', code: 'VALIDATION_ERROR' });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication credentials were not provided.', options = {}) {
    super(message, 401, { ...options, name: 'UnauthorizedError', code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.', options = {}) {
    super(message, 403, { ...options, name: 'ForbiddenError', code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', options = {}) {
    super(message, 404, { ...options, name: 'NotFoundError', code: 'NOT_FOUND' });
  }
}
