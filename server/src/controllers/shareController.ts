import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Get existing share for a page
 */
export const getPageShare = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;

    const share = await prisma.pageShare.findFirst({
      where: { pageId },
    });

    res.json({
      success: true,
      data: { share },
    });
  } catch (error) {
    console.error('Error getting page share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get page share',
    });
  }
};

/**
 * Create a new share link for a page
 */
export const createPageShare = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const { password, expiresAt, allowEdit, allowComment } = req.body;
    const userId = (req as any).user.id;

    // Check if page exists and user has access
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found',
      });
    }

    if (page.workspace.members.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No access to this page',
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create share
    const share = await prisma.pageShare.create({
      data: {
        pageId,
        token,
        password: hashedPassword,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        allowEdit: allowEdit || false,
        allowComment: allowComment !== false,
        createdBy: userId,
      },
    });

    res.json({
      success: true,
      data: {
        share: {
          ...share,
          password: undefined, // Don't return hashed password
        },
      },
    });
  } catch (error) {
    console.error('Error creating page share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create page share',
    });
  }
};

/**
 * Update an existing share link
 */
export const updatePageShare = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;
    const { password, expiresAt, allowEdit, allowComment } = req.body;
    const userId = (req as any).user.id;

    // Check if share exists
    const existingShare = await prisma.pageShare.findFirst({
      where: { pageId },
    });

    if (!existingShare) {
      return res.status(404).json({
        success: false,
        message: 'Share not found',
      });
    }

    // Hash new password if provided
    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update share
    const share = await prisma.pageShare.update({
      where: { id: existingShare.id },
      data: {
        password: password !== undefined ? hashedPassword : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        allowEdit: allowEdit !== undefined ? allowEdit : undefined,
        allowComment: allowComment !== undefined ? allowComment : undefined,
      },
    });

    res.json({
      success: true,
      data: {
        share: {
          ...share,
          password: undefined, // Don't return hashed password
        },
      },
    });
  } catch (error) {
    console.error('Error updating page share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update page share',
    });
  }
};

/**
 * Delete a share link
 */
export const deletePageShare = async (req: Request, res: Response) => {
  try {
    const { pageId } = req.params;

    const share = await prisma.pageShare.findFirst({
      where: { pageId },
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found',
      });
    }

    await prisma.pageShare.delete({
      where: { id: share.id },
    });

    res.json({
      success: true,
      message: 'Share deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting page share:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete page share',
    });
  }
};

/**
 * Get shared page by token (public access)
 */
export const getSharedPage = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    // Find share by token
    const share = await prisma.pageShare.findUnique({
      where: { token },
      include: {
        page: {
          include: {
            blocks: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
      },
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found',
      });
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'Share link has expired',
      });
    }

    // Check password if required
    if (share.password) {
      if (!password) {
        return res.status(401).json({
          success: false,
          message: 'Password required',
        });
      }

      const isValidPassword = await bcrypt.compare(
        password as string,
        share.password
      );

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password',
        });
      }
    }

    res.json({
      success: true,
      data: {
        page: share.page,
        blocks: share.page.blocks,
        permissions: {
          canEdit: share.allowEdit,
          canComment: share.allowComment,
        },
      },
    });
  } catch (error) {
    console.error('Error getting shared page:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shared page',
    });
  }
};
