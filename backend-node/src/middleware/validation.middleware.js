import { ZodError } from 'zod';
import { body, param, query, validationResult } from 'express-validator';
import {logger} from '../config/logger.js';
import { ValidationAppError } from './errors.js';

function formatZodIssues(err) {
  return err.issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
}

function validateWithSchema(schema, target) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(new ValidationAppError('Validation error', {
          details: { target, fields: formatZodIssues(err) },
        }));
      }
      return next(err);
    }
  };
}

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: (error).value || undefined,
      location: (error).location || undefined
    }));

    logger.warn('Validation errors:', {
      requestId: req.headers['x-request-id'],
      url: req.originalUrl,
      method: req.method,
      errors: errorDetails
    });

    const errorMessages = errorDetails.map(error => 
      `${error.field}: ${error.message}`
    ).join('. ');

    next(new ValidationError(
      errorMessages,
      errorDetails[0]?.field,
      {
        requestId: req.headers['x-request-id'],
        metadata: { validationErrors: errorDetails }
      }
    ));
    return;
  }
  
  next();
};

export const validateBody = (schema) => validateWithSchema(schema, 'body');
export const validateParams = (schema) => validateWithSchema(schema, 'params');
export const validateQuery = (schema) => validateWithSchema(schema, 'query');
