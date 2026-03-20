import { createServer } from 'http';

import app from './app.js';
import { connectDB } from './config/db.js';
import { setupRealtimeServer } from './realtime/index.js';

import { logger } from './config/logger.js';
import { env } from './config/environment.js';

// Load environment variables
logger.info('Loading environment configuration...');
logger.debug('Environment config loaded:', env.getConfig(false));

const PORT = env.server.port;

async function startServer() {
  try {
    await connectDB();

    const server = createServer(app);

    // Setup WebSocket realtime server
    setupRealtimeServer(server);

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${env.server.nodeEnv}`);
      logger.info(`🔗 Frontend URL: ${env.cors.frontendUrl}`);

      if (env.server.isDevelopment) {
        logger.debug('Development mode - additional debugging enabled');
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
