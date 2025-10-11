import { validationResult } from 'express-validator';
import AppError from '../utils/appError.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    }));

    throw new AppError('Validation failed', 422, extractedErrors);
  }

  next();
};
