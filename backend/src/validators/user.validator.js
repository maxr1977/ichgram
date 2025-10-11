import { body } from 'express-validator';

export const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage('Full name must be 1-60 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 160 })
    .withMessage('Bio must be up to 160 characters'),
  body('website')
    .optional()
    .trim()
    .isURL({ require_protocol: true })
    .withMessage('Website must be a valid URL starting with http:// or https://'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9._]+$/).withMessage('Username can contain letters, numbers, dot and underscore'),
];
