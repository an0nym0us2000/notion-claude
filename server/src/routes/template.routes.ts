import { Router } from 'express';
import { body } from 'express-validator';
import {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  createPageFromTemplate,
  getPredefinedTemplates,
} from '../controllers/template.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticate);

// Get predefined templates
router.get('/predefined', asyncHandler(getPredefinedTemplates));

// Template CRUD
router.post(
  '/',
  [
    body('workspaceId').notEmpty().withMessage('Workspace ID is required'),
    body('name').notEmpty().withMessage('Template name is required'),
  ],
  asyncHandler(createTemplate)
);

router.get('/', asyncHandler(getTemplates));

router.get('/:id', asyncHandler(getTemplate));

router.patch('/:id', asyncHandler(updateTemplate));

router.delete('/:id', asyncHandler(deleteTemplate));

// Create page from template
router.post(
  '/instantiate',
  [
    body('templateId').notEmpty().withMessage('Template ID is required'),
    body('workspaceId').notEmpty().withMessage('Workspace ID is required'),
  ],
  asyncHandler(createPageFromTemplate)
);

export { router as templateRouter };
