import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Permission =
  | 'canEdit'
  | 'canComment'
  | 'canShare'
  | 'canInvite'
  | 'canCreatePage'
  | 'canDeletePage';

/**
 * Middleware to check if user has specific permission in workspace
 */
export const checkPermission = (permission: Permission) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const { workspaceId, pageId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      let targetWorkspaceId = workspaceId;

      // If we have pageId but not workspaceId, get workspace from page
      if (pageId && !workspaceId) {
        const page = await prisma.page.findUnique({
          where: { id: pageId },
          select: { workspaceId: true },
        });

        if (!page) {
          return res.status(404).json({
            success: false,
            message: 'Page not found',
          });
        }

        targetWorkspaceId = page.workspaceId;
      }

      if (!targetWorkspaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workspace ID required',
        });
      }

      // Get user's membership
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: targetWorkspaceId,
            userId,
          },
        },
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: 'No access to this workspace',
        });
      }

      // Check permission
      const permissions = member.permissions as any;

      // Owners and admins have all permissions
      if (member.role === 'owner' || member.role === 'admin') {
        return next();
      }

      // Check specific permission
      if (permissions && permissions[permission] === true) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission}`,
      });
    } catch (error) {
      console.error('Error checking permission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check permissions',
      });
    }
  };
};

/**
 * Middleware to check if user is workspace owner or admin
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const { workspaceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check admin status',
    });
  }
};

/**
 * Middleware to check if user is workspace owner
 */
export const requireOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    const { workspaceId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || member.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Owner access required',
      });
    }

    next();
  } catch (error) {
    console.error('Error checking owner status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check owner status',
    });
  }
};
