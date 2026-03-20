import { logger } from '../config/logger.js';

function safeErrorMessage(err) {
  return err?.message || 'Internal server error';
}

export function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  const message = status >= 500 ? 'Internal server error' : safeErrorMessage(err);
  const requestId = req.requestId || req.headers['x-request-id'] || null;

  const logPayload = {
    request_id: requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    user_id: req.user?.user_id || req.user?._id || null,
    error_name: err?.name,
    status_code: status,
    details: err?.details || null,
  };

  if (status >= 500) {
    logger.error('Unhandled server error', {
      ...logPayload,
      message: safeErrorMessage(err),
      stack: err?.stack,
    });
  } else if (status >= 400) {
    logger.warn('Handled client error', {
      ...logPayload,
      message: safeErrorMessage(err),
    });
  }

  res.status(status).json({
    error: message,
    detail: message,
    message,
    ...(err?.details && { details: err.details }),
    ...(requestId ? { request_id: String(requestId) } : {}),
  });
}
