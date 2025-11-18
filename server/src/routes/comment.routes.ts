import express from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get comments for a page or block
// GET /api/comments?pageId=xxx&blockId=yyy (blockId optional)
router.get('/', getComments);

// Create a new comment
// POST /api/comments
router.post('/', createComment);

// Update a comment (resolve/unresolve, edit content)
// PATCH /api/comments/:commentId
router.patch('/:commentId', updateComment);

// Delete a comment
// DELETE /api/comments/:commentId
router.delete('/:commentId', deleteComment);

export default router;
