import { ZodError } from 'zod';
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

export const validateBody = (schema) => validateWithSchema(schema, 'body');
export const validateParams = (schema) => validateWithSchema(schema, 'params');
export const validateQuery = (schema) => validateWithSchema(schema, 'query');
