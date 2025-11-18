import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refreshToken, getCurrentUser } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('name').optional().trim(),
  ],
  asyncHandler(register)
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  asyncHandler(login)
);

router.post('/refresh', asyncHandler(refreshToken));

router.get('/me', authenticate, asyncHandler(getCurrentUser));

export { router as authRouter };
