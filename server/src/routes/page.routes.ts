import { Router } from 'express';
import { body } from 'express-validator';
import {
  createPage,
  getPages,
  getPage,
  updatePage,
  deletePage,
} from '../controllers/page.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(getPages));

router.post(
  '/',
  [body('workspaceId').notEmpty().withMessage('Workspace ID is required')],
  asyncHandler(createPage)
);

router.get('/:id', asyncHandler(getPage));

router.patch('/:id', asyncHandler(updatePage));

router.delete('/:id', asyncHandler(deletePage));

export { router as pageRouter };
