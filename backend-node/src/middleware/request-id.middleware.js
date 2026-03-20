import crypto from 'crypto';

export function requestIdMiddleware(req, res, next) {
  const headerId = req.headers['x-request-id'];
  const requestId = typeof headerId === 'string' && headerId.trim().length > 0
    ? headerId.trim()
    : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
