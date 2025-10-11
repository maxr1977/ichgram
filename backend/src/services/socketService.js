import env from '../config/env.js';
import logger from '../utils/logger.js';
import {
  createMessage,
  markMessagesDelivered,
  markMessagesRead,
} from './messagingService.js';

export const registerSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('auth:join', (userId) => {
      if (!userId) return;
      socket.data.userId = userId.toString();
      socket.join(userId.toString());
      if (env.isDev) {
        logger.info(`Socket ${socket.id} joined user room ${userId}`);
      }
    });

    socket.on('conversation:join', ({ conversationId }) => {
      if (!conversationId) return;
      socket.join(`conversation:${conversationId}`);
      if (env.isDev) {
        logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
      }
    });

    socket.on('conversation:leave', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        if (!socket.data.userId) {
          throw new Error('Unauthorized');
        }
        const { conversationId, content } = payload ?? {};
        const message = await createMessage({
          conversationId,
          senderId: socket.data.userId,
          content,
          files: [],
        });
        if (ack) {
          ack({ status: 'ok', messageId: message.id });
        }
      } catch (error) {
        logger.error('Socket message:send error', error);
        if (ack) {
          ack({ status: 'error', message: error.message });
        }
      }
    });

    socket.on('message:delivered', async ({ conversationId, messageIds }) => {
      if (!socket.data.userId) return;
      try {
        await markMessagesDelivered({
          conversationId,
          messageIds,
          userId: socket.data.userId,
        });
      } catch (error) {
        if (env.isDev) {
          logger.error('Socket delivered error', error);
        }
      }
    });

    socket.on('message:read', async ({ conversationId, messageIds }) => {
      if (!socket.data.userId) return;
      try {
        await markMessagesRead({
          conversationId,
          messageIds,
          userId: socket.data.userId,
        });
      } catch (error) {
        if (env.isDev) {
          logger.error('Socket read error', error);
        }
      }
    });

    socket.on('typing:start', ({ conversationId }) => {
      if (!conversationId || !socket.data.userId) return;
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.data.userId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (!conversationId || !socket.data.userId) return;
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.data.userId,
      });
    });

    socket.on('disconnect', () => {
      if (env.isDev) {
        logger.info(`Socket disconnected: ${socket.id}`);
      }
    });
  });
};
