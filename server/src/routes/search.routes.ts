import { Router } from 'express';
import { body } from 'express-validator';
import {
  searchWorkspace,
  searchPages,
  getRecentPages,
  getPageBacklinks,
  createPageLink,
} from '../controllers/search.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// Search endpoints
router.get('/workspace', asyncHandler(searchWorkspace));

router.get('/pages', asyncHandler(searchPages));

router.get('/recent', asyncHandler(getRecentPages));

// Backlinks
router.get('/backlinks/:pageId', asyncHandler(getPageBacklinks));

router.post(
  '/link',
  [
    body('sourcePageId').notEmpty().withMessage('Source page ID is required'),
    body('targetPageId').notEmpty().withMessage('Target page ID is required'),
  ],
  asyncHandler(createPageLink)
);

export { router as searchRouter };
