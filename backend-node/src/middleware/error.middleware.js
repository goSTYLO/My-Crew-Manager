export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({
    error: message,
    detail: message,
    message,
    ...(err.details && { details: err.details }),
  });
}
