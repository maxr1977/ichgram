import { Router } from 'express';
import { searchUsersController } from '../controllers/searchController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/users', authenticate, searchUsersController);

export default router;
