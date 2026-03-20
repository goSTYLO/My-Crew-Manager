import dotenv from 'dotenv';

dotenv.config();

class Environment {
  constructor() {
    this.config = this.validateAndLoadConfig();
  }

  validateAndLoadConfig() {
    const requiredVars = [
      'POSTGRES_URI',
      'JWT_SECRET'
    ];

    const missingVars = requiredVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }

    // JWT validation
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security'
      );
    }

    return {
      // Database
      POSTGRES_URI: this.getString('POSTGRES_URI'),

      // Server
      PORT: this.getNumber('PORT', 5000),
      NODE_ENV: this.getString('NODE_ENV', 'development'),

      // JWT
      JWT_SECRET: this.getString('JWT_SECRET'),
      JWT_EXPIRES_IN: this.getString('JWT_EXPIRES_IN', '24h'),

      // CORS
      FRONTEND_URL: this.getString(
        'FRONTEND_URL',
        'http://localhost:3000'
      ),

      // File Upload
      MAX_FILE_SIZE: this.getNumber('MAX_FILE_SIZE', 52428800),
      UPLOAD_PATH: this.getString('UPLOAD_PATH', './uploads'),

      // Logging
      LOG_LEVEL: this.getString('LOG_LEVEL', 'info'),

      // OpenRouter API
      OPENROUTER_API_KEY: this.getOptionalString('OPENROUTER_API_KEY'),
      OPENROUTER_MODEL: this.getOptionalString(
        'OPENROUTER_MODEL',
        'x-ai/grok-4-fast:free'
      ),
      SITE_URL: this.getString('SITE_URL', 'http://localhost:3000'),
      SITE_NAME: this.getString('SITE_NAME', 'MyCrewManager'),

      // Email (optional)
      EMAIL_HOST: this.getOptionalString('EMAIL_HOST'),
      EMAIL_PORT: this.getNumber('EMAIL_PORT', 587),
      EMAIL_USER: this.getOptionalString('EMAIL_USER'),
      EMAIL_PASS: this.getOptionalString('EMAIL_PASS'),
      EMAIL_FROM: this.getString(
        'EMAIL_FROM',
        'My Crew Manager <mycrewmanager.ml@gmail.com>'
      ),
      EMAIL_SECURE: this.getBoolean('EMAIL_SECURE', false),

      // Web Push (optional)
      WEB_PUSH_PUBLIC_KEY: this.getOptionalString('WEB_PUSH_PUBLIC_KEY'),
      WEB_PUSH_PRIVATE_KEY: this.getOptionalString('WEB_PUSH_PRIVATE_KEY'),
      WEB_PUSH_CONTACT: this.getOptionalString('WEB_PUSH_CONTACT'),

      // Security
      ENCRYPTION_MASTER_KEY: this.getOptionalString(
        'ENCRYPTION_MASTER_KEY'
      ),
      ENCRYPTION_KEY_ID: this.getString('ENCRYPTION_KEY_ID', 'default'),
      REDIS_URL: this.getString('REDIS_URL', 'redis://localhost:6379'),
      RATE_LIMIT_WINDOW_MS: this.getNumber(
        'RATE_LIMIT_WINDOW_MS',
        900000
      ),
      RATE_LIMIT_MAX_REQUESTS: this.getNumber(
        'RATE_LIMIT_MAX_REQUESTS',
        100
      ),
    };
  }

  getString(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Environment variable ${key} is required`);
    }
    return value;
  }

  getOptionalString(key, defaultValue) {
    const value = process.env[key];
    return value === undefined ? defaultValue : value;
  }

  getNumber(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Environment variable ${key} is required`);
    }

    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(
        `Environment variable ${key} must be a valid number`
      );
    }
    return num;
  }

  getBoolean(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Environment variable ${key} is required`);
    }
    return value.toLowerCase() === 'true';
  }

  // ===== Getters =====

  get database() {
    return {
      uri: this.config.POSTGRES_URI,
    };
  }

  get server() {
    return {
      port: this.config.PORT,
      nodeEnv: this.config.NODE_ENV,
      isProduction: this.config.NODE_ENV === 'production',
      isDevelopment: this.config.NODE_ENV === 'development',
      isTest: this.config.NODE_ENV === 'test',
    };
  }

  get jwt() {
    return {
      secret: this.config.JWT_SECRET,
      expiresIn: this.config.JWT_EXPIRES_IN,
    };
  }

  get cors() {
    return {
      frontendUrl: this.config.FRONTEND_URL,
    };
  }

  get fileUpload() {
    return {
      maxSize: this.config.MAX_FILE_SIZE,
      uploadPath: this.config.UPLOAD_PATH,
    };
  }

  get logging() {
    return {
      level: this.config.LOG_LEVEL,
    };
  }

  get openRouter() {
    return {
      apiKey: this.config.OPENROUTER_API_KEY,
      model: this.config.OPENROUTER_MODEL,
      siteUrl: this.config.SITE_URL,
      siteName: this.config.SITE_NAME,
    };
  }

  get email() {
    return {
      host: this.config.EMAIL_HOST,
      port: this.config.EMAIL_PORT,
      user: this.config.EMAIL_USER,
      pass: this.config.EMAIL_PASS,
      from: this.config.EMAIL_FROM,
      secure: this.config.EMAIL_SECURE,
    };
  }

  get webPush() {
    return {
      publicKey: this.config.WEB_PUSH_PUBLIC_KEY,
      privateKey: this.config.WEB_PUSH_PRIVATE_KEY,
      contact: this.config.WEB_PUSH_CONTACT,
    };
  }

  get security() {
    return {
      encryptionMasterKey: this.config.ENCRYPTION_MASTER_KEY,
      encryptionKeyId: this.config.ENCRYPTION_KEY_ID,
      redisUrl: this.config.REDIS_URL,
      rateLimitWindowMs: this.config.RATE_LIMIT_WINDOW_MS,
      rateLimitMaxRequests: this.config.RATE_LIMIT_MAX_REQUESTS,
    };
  }

  get encryption() {
    return {
      masterKey: this.config.ENCRYPTION_MASTER_KEY,
      currentKeyId: this.config.ENCRYPTION_KEY_ID,
    };
  }

  getConfig(includeSensitive = false) {
    const config = { ...this.config };

    if (!includeSensitive) {
      delete config.JWT_SECRET;
      delete config.OPENROUTER_API_KEY;
      delete config.POSTGRES_URI;
      delete config.EMAIL_PASS;
      delete config.WEB_PUSH_PRIVATE_KEY;
    }

    return config;
  }
}

// Singleton
export const env = new Environment();
export default env;