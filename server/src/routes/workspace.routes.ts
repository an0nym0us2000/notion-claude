import { Router } from 'express';
import { body } from 'express-validator';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addMember,
} from '../controllers/workspace.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(getWorkspaces));

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Workspace name is required')],
  asyncHandler(createWorkspace)
);

router.get('/:id', asyncHandler(getWorkspace));

router.patch(
  '/:id',
  [body('name').optional().trim().notEmpty()],
  asyncHandler(updateWorkspace)
);

router.delete('/:id', asyncHandler(deleteWorkspace));

router.post(
  '/:id/members',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('role')
      .optional()
      .isIn(['owner', 'admin', 'member', 'viewer'])
      .withMessage('Invalid role'),
  ],
  asyncHandler(addMember)
);

export { router as workspaceRouter };
