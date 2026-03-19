import http from 'http';

import app from './app.js';
import { connectDB } from './config/db.js';
import { validateEnv } from './config/env.js';
import { setupRealtimeServer } from './realtime/index.js';

const PORT = process.env.PORT || 8001;

async function start() {
  validateEnv();
  await connectDB();

  const server = http.createServer(app);

  // Setup WebSocket realtime server
  setupRealtimeServer(server);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
