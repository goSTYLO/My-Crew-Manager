import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Get log level from environment or use default
const getLogLevel = () => {
  try {
    const nodeEnv = process.env.NODE_ENV || 'development';
    return nodeEnv === 'production' ? 'warn' : 'debug';
  } catch {
    return 'debug';
  }
};

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const baseFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.splat(),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
);

const consoleFormat = isProduction
  ? winston.format.combine(baseFormat, winston.format.json())
  : winston.format.combine(
      baseFormat,
      winston.format.colorize({ all: true }),
      winston.format.printf((info) => {
        const meta = info.metadata && Object.keys(info.metadata).length > 0
          ? ` ${JSON.stringify(info.metadata)}`
          : '';
        return `${info.timestamp} ${info.level}: ${info.message}${meta}`;
      })
    );

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({ format: consoleFormat }),
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(baseFormat, winston.format.json()),
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(baseFormat, winston.format.json()),
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  transports,
  exitOnError: false,
});
