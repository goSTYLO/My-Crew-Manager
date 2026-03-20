import sanitizeHtml from 'sanitize-html';
import { logger } from '../config/logger.js';

const SUSPICIOUS_PATTERNS = [
  { type: 'xss_script_tag', regex: /<\s*script\b/i },
  { type: 'xss_event_handler', regex: /on\w+\s*=\s*/i },
  { type: 'xss_js_protocol', regex: /javascript\s*:/i },
  { type: 'sql_union_select', regex: /\bunion\b\s+\bselect\b/i },
  { type: 'sql_or_true', regex: /\bor\b\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i },
  { type: 'sql_comment', regex: /--|\/\*/ },
  { type: 'sql_drop', regex: /\bdrop\b\s+\btable\b/i },
];

const REDACT_FIELDS = new Set(['password', 'token', 'refresh_token', 'authorization', 'secret']);

function sanitizeString(value) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function maskIfSensitive(path, value) {
  const key = String(path || '').split('.').pop()?.toLowerCase() || '';
  if (REDACT_FIELDS.has(key)) return '[REDACTED]';
  return value;
}

function walkAndSanitize(input, path = '', findings = []) {
  if (typeof input === 'string') {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.regex.test(input)) {
        findings.push({ path, type: pattern.type, sample: maskIfSensitive(path, input.slice(0, 80)) });
      }
    }
    return sanitizeString(input);
  }

  if (Array.isArray(input)) {
    return input.map((item, index) => walkAndSanitize(item, `${path}[${index}]`, findings));
  }

  if (isPlainObject(input)) {
    const out = {};
    for (const [k, v] of Object.entries(input)) {
      const childPath = path ? `${path}.${k}` : k;
      out[k] = walkAndSanitize(v, childPath, findings);
    }
    return out;
  }

  return input;
}

export function inputSanitizationMiddleware(req, res, next) {
  const findings = [];

  if (req.body && isPlainObject(req.body)) {
    req.body = walkAndSanitize(req.body, 'body', findings);
  }
  if (req.query && isPlainObject(req.query)) {
    req.query = walkAndSanitize(req.query, 'query', findings);
  }
  if (req.params && isPlainObject(req.params)) {
    req.params = walkAndSanitize(req.params, 'params', findings);
  }

  if (findings.length > 0) {
    logger.warn('Potential security threat detected in request input', {
      request_id: req.requestId || null,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      findings,
      security_event: 'input_threat_detected',
    });
  }

  next();
}
