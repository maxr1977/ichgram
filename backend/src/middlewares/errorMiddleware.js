import logger from '../utils/logger.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
};

export const errorHandler = (err, req, res) => {
  const status = err.statusCode ?? 500;
  const message = err.message ?? 'Internal Server Error';

  if (logger && status >= 500) {
    logger.error(err);
  }

  res.status(status).json({
    status: 'error',
    message,
    ...(err.errors ? { errors: err.errors } : {}),
    ...(process.env.NODE_ENV === 'development' && err.stack
      ? { stack: err.stack }
      : {}),
  });
};
