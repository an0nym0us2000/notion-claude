import { Router } from 'express';
import { body } from 'express-validator';
import {
  createDatabase,
  getDatabase,
  updateDatabase,
  deleteDatabase,
  createProperty,
  updateProperty,
  deleteProperty,
  createRow,
  updateRow,
  deleteRow,
  createView,
  updateView,
  deleteView,
  queryDatabase,
} from '../controllers/database.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// =====================
// DATABASE ROUTES
// =====================

router.post(
  '/',
  [
    body('pageId').notEmpty().withMessage('Page ID is required'),
    body('name').optional().isString(),
  ],
  asyncHandler(createDatabase)
);

router.get('/:id', asyncHandler(getDatabase));

router.patch('/:id', asyncHandler(updateDatabase));

router.delete('/:id', asyncHandler(deleteDatabase));

// =====================
// PROPERTY ROUTES
// =====================

router.post(
  '/:databaseId/properties',
  [
    body('name').notEmpty().withMessage('Property name is required'),
    body('type').notEmpty().withMessage('Property type is required'),
  ],
  asyncHandler(createProperty)
);

router.patch('/properties/:id', asyncHandler(updateProperty));

router.delete('/properties/:id', asyncHandler(deleteProperty));

// =====================
// ROW ROUTES
// =====================

router.post(
  '/:databaseId/rows',
  [
    body('values').optional().isObject(),
  ],
  asyncHandler(createRow)
);

router.patch('/rows/:id', asyncHandler(updateRow));

router.delete('/rows/:id', asyncHandler(deleteRow));

// =====================
// VIEW ROUTES
// =====================

router.post(
  '/:databaseId/views',
  [
    body('name').notEmpty().withMessage('View name is required'),
    body('type').notEmpty().withMessage('View type is required'),
  ],
  asyncHandler(createView)
);

router.patch('/views/:id', asyncHandler(updateView));

router.delete('/views/:id', asyncHandler(deleteView));

// =====================
// QUERY ROUTES
// =====================

router.post(
  '/:databaseId/query',
  [
    body('filters').optional().isArray(),
    body('sorts').optional().isArray(),
  ],
  asyncHandler(queryDatabase)
);

export { router as databaseRouter };
