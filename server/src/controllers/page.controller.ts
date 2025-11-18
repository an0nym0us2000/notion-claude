import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createPage = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, parentId, title, icon, coverImage } = req.body;

  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId: req.user.id,
    },
  });

  if (!member) {
    throw new AppError('Access denied', 403);
  }

  // If parentId is provided, verify it exists
  if (parentId) {
    const parentPage = await prisma.page.findFirst({
      where: {
        id: parentId,
        workspaceId,
      },
    });

    if (!parentPage) {
      throw new AppError('Parent page not found', 404);
    }
  }

  const page = await prisma.page.create({
    data: {
      title: title || 'Untitled',
      icon,
      coverImage,
      workspaceId,
      parentId: parentId || null,
      createdBy: req.user.id,
    },
    include: {
      childPages: true,
      blocks: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      page,
    },
  });
};

export const getPages = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, parentId } = req.query;

  if (!workspaceId) {
    throw new AppError('Workspace ID is required', 400);
  }

  // Verify user has access to workspace
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: workspaceId as string,
      userId: req.user.id,
    },
  });

  if (!member) {
    throw new AppError('Access denied', 403);
  }

  const pages = await prisma.page.findMany({
    where: {
      workspaceId: workspaceId as string,
      parentId: parentId ? (parentId as string) : null,
    },
    include: {
      childPages: true,
      _count: {
        select: {
          blocks: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  res.json({
    status: 'success',
    data: {
      pages,
    },
  });
};

export const getPage = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      workspace: {
        include: {
          members: {
            where: {
              userId: req.user.id,
            },
          },
        },
      },
      childPages: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      blocks: {
        where: {
          parentId: null, // Only root blocks
        },
        orderBy: {
          order: 'asc',
        },
        include: {
          childBlocks: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
    },
  });

  if (!page) {
    throw new AppError('Page not found', 404);
  }

  // Verify user has access
  if (page.workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  res.json({
    status: 'success',
    data: {
      page,
    },
  });
};

export const updatePage = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { title, icon, coverImage, isPublished } = req.body;

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      workspace: {
        include: {
          members: {
            where: {
              userId: req.user.id,
            },
          },
        },
      },
    },
  });

  if (!page) {
    throw new AppError('Page not found', 404);
  }

  if (page.workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  const updatedPage = await prisma.page.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(icon !== undefined && { icon }),
      ...(coverImage !== undefined && { coverImage }),
      ...(isPublished !== undefined && { isPublished }),
    },
  });

  res.json({
    status: 'success',
    data: {
      page: updatedPage,
    },
  });
};

export const deletePage = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const page = await prisma.page.findUnique({
    where: { id },
    include: {
      workspace: {
        include: {
          members: {
            where: {
              userId: req.user.id,
              role: {
                in: ['owner', 'admin', 'member'],
              },
            },
          },
        },
      },
    },
  });

  if (!page) {
    throw new AppError('Page not found', 404);
  }

  if (page.workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  await prisma.page.delete({
    where: { id },
  });

  res.status(204).send();
};
