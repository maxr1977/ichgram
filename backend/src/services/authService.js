import crypto from 'crypto';
import env from '../config/env.js';
import Token from '../models/tokenModel.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/token.js';
import { parseDurationToMs } from '../utils/time.js';
import AppError from '../utils/appError.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const getRefreshMaxAge = () => {
  const ms = parseDurationToMs(env.refreshTokenTtl) || 7 * 24 * 60 * 60 * 1000;
  return ms;
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: !env.isDev,
    sameSite: 'strict',
    maxAge: getRefreshMaxAge(),
  });
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: !env.isDev,
    sameSite: 'strict',
  });
};

export const buildUserResponse = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  bio: user.bio,
  website: user.website,
  avatarUrl: user.avatarUrl,
  postsCount: user.postsCount,
  followersCount: user.followersCount,
  followingCount: user.followingCount,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const buildPublicUser = (user) => ({
  id: user.id,
  username: user.username,
  fullName: user.fullName,
  bio: user.bio,
  website: user.website,
  avatarUrl: user.avatarUrl,
  postsCount: user.postsCount,
  followersCount: user.followersCount,
  followingCount: user.followingCount,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const createSession = async (user, req, res) => {
  const payload = { userId: user.id };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + getRefreshMaxAge());

  await Token.create({
    user: user.id,
    tokenHash,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    expiresAt,
    isActive: true,
  });

  setRefreshCookie(res, refreshToken);

  return { accessToken, refreshToken };
};

export const revokeSession = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashToken(refreshToken);
  await Token.findOneAndUpdate(
    { tokenHash },
    { isActive: false },
    { new: true },
  );
};

export const refreshSession = async (refreshToken, req, res) => {
  if (!refreshToken) {
    throw new AppError('Refresh token missing', 401);
  }

  let payload;
  try {
    payload = verifyToken(refreshToken);
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await Token.findOne({
    tokenHash,
    user: payload.userId,
    isActive: true,
  });

  if (!storedToken) {
    throw new AppError('Session not found', 401);
  }

  if (storedToken.expiresAt < new Date()) {
    storedToken.isActive = false;
    await storedToken.save();
    throw new AppError('Session expired', 401);
  }

  const newTokens = await createSession({ id: payload.userId }, req, res);

  storedToken.isActive = false;
  await storedToken.save();

  return { accessToken: newTokens.accessToken, userId: payload.userId };
};

export const getRefreshTokenFromRequest = (req) =>
  req.cookies?.[REFRESH_COOKIE_NAME] ?? null;
