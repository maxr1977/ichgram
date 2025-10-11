import http from 'http';
import { Server } from 'socket.io';

import app from './app.js';
import env from './config/env.js';
import connectDatabase from './config/database.js';
import { registerSocketHandlers } from './services/socketService.js';
import logger from './utils/logger.js';

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    credentials: true,
  },
});

app.set('io', io);
global.io = io;
registerSocketHandlers(io);

const start = async () => {
  try {
    await connectDatabase();
    server.listen(env.port, () => {
      logger.info(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Server startup failed', error);
    process.exit(1);
  }
};

start();
