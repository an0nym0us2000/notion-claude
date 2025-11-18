import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get comments for a page or block
 */
export const getComments = async (req: Request, res: Response) => {
  try {
    const { pageId, blockId } = req.query;

    if (!pageId) {
      return res.status(400).json({
        success: false,
        message: 'Page ID is required',
      });
    }

    const whereClause: any = {
      pageId: pageId as string,
    };

    if (blockId) {
      whereClause.blockId = blockId as string;
    }

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Build threaded structure
    const commentMap = new Map();
    const topLevelComments: any[] = [];

    // First pass: create all comments
    comments.forEach((comment) => {
      commentMap.set(comment.id, {
        ...comment,
        replies: [],
      });
    });

    // Second pass: build hierarchy
    comments.forEach((comment) => {
      const commentWithReplies = commentMap.get(comment.id);

      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        topLevelComments.push(commentWithReplies);
      }
    });

    res.json({
      success: true,
      data: {
        comments: topLevelComments,
      },
    });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments',
    });
  }
};

/**
 * Create a new comment
 */
export const createComment = async (req: Request, res: Response) => {
  try {
    const { content, pageId, blockId, parentId, mentions } = req.body;
    const userId = (req as any).user.id;

    if (!content || !pageId) {
      return res.status(400).json({
        success: false,
        message: 'Content and page ID are required',
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        pageId,
        blockId: blockId || undefined,
        parentId: parentId || undefined,
        authorId: userId,
        mentions: mentions || [],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // TODO: Send notifications to mentioned users

    res.json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
    });
  }
};

/**
 * Update a comment (resolve/unresolve, edit content)
 */
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content, resolved } = req.body;
    const userId = (req as any).user.id;

    // Get existing comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check permissions (only author can edit content, anyone can resolve)
    if (content !== undefined && existingComment.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can edit this comment',
      });
    }

    const updateData: any = {};

    if (content !== undefined) {
      updateData.content = content;
    }

    if (resolved !== undefined) {
      updateData.resolved = resolved;
      if (resolved) {
        updateData.resolvedBy = userId;
        updateData.resolvedAt = new Date();
      } else {
        updateData.resolvedBy = null;
        updateData.resolvedAt = null;
      }
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { comment },
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
    });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).user.id;

    // Get existing comment
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check permissions (only author can delete)
    if (existingComment.authorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the author can delete this comment',
      });
    }

    // Delete comment (cascade will delete replies)
    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
    });
  }
};
