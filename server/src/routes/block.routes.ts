import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
} from '../controllers/block.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  [
    body('pageId').notEmpty().withMessage('Page ID is required'),
    body('type').notEmpty().withMessage('Block type is required'),
  ],
  asyncHandler(createBlock)
);

router.patch('/:id', asyncHandler(updateBlock));

router.delete('/:id', asyncHandler(deleteBlock));

router.post('/reorder', asyncHandler(reorderBlocks));

export { router as blockRouter };
