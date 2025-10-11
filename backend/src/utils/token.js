import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import AppError from './appError.js';

const signToken = (payload, secret, options) =>
  jwt.sign(payload, secret, options);

const ensureSecretConfigured = () => {
  if (!env.jwtSecret) {
    throw new AppError('JWT secret is not configured', 500);
  }
};

export const generateAccessToken = (payload) => {
  ensureSecretConfigured();
  return signToken(payload, env.jwtSecret, { expiresIn: env.accessTokenTtl });
};

export const generateRefreshToken = (payload) => {
  ensureSecretConfigured();
  return signToken(payload, env.jwtSecret, { expiresIn: env.refreshTokenTtl });
};

export const verifyToken = (token) => {
  ensureSecretConfigured();

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (!payload?.userId) {
      throw new AppError('Invalid token payload', 401);
    }
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
};
