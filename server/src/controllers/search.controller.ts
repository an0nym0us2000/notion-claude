import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const searchWorkspace = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, query, limit = 20, offset = 0 } = req.query;

  if (!workspaceId) {
    throw new AppError('Workspace ID is required', 400);
  }

  if (!query || typeof query !== 'string') {
    throw new AppError('Search query is required', 400);
  }

  // Verify user has access to workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId as string },
    include: {
      members: {
        where: {
          userId: req.user.id,
        },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  const searchQuery = query.toLowerCase().trim();

  // Search pages by title
  const pages = await prisma.page.findMany({
    where: {
      workspaceId: workspaceId as string,
      title: {
        contains: searchQuery,
        mode: 'insensitive',
      },
    },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      icon: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Search blocks by content
  // Note: This is a basic text search. For production, consider using PostgreSQL full-text search
  const blocks = await prisma.block.findMany({
    where: {
      page: {
        workspaceId: workspaceId as string,
      },
    },
    take: parseInt(limit as string) * 2, // Get more blocks to filter
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          icon: true,
        },
      },
    },
  });

  // Filter blocks by content (client-side for now)
  const matchingBlocks = blocks
    .filter((block) => {
      const contentStr = JSON.stringify(block.content).toLowerCase();
      return contentStr.includes(searchQuery);
    })
    .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string))
    .map((block) => ({
      id: block.id,
      type: block.type,
      content: block.content,
      pageId: block.pageId,
      page: block.page,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    }));

  // Combine results
  const results = {
    pages: pages.map((page) => ({
      ...page,
      type: 'page' as const,
    })),
    blocks: matchingBlocks.map((block) => ({
      ...block,
      type: 'block' as const,
    })),
  };

  res.json({
    status: 'success',
    data: {
      results,
      total: {
        pages: pages.length,
        blocks: matchingBlocks.length,
      },
    },
  });
};

export const searchPages = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, query, limit = 10 } = req.query;

  if (!workspaceId) {
    throw new AppError('Workspace ID is required', 400);
  }

  if (!query || typeof query !== 'string') {
    return res.json({
      status: 'success',
      data: {
        pages: [],
      },
    });
  }

  // Verify user has access to workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId as string },
    include: {
      members: {
        where: {
          userId: req.user.id,
        },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  const searchQuery = query.toLowerCase().trim();

  // Search pages by title for autocomplete
  const pages = await prisma.page.findMany({
    where: {
      workspaceId: workspaceId as string,
      title: {
        contains: searchQuery,
        mode: 'insensitive',
      },
    },
    take: parseInt(limit as string),
    orderBy: [
      {
        updatedAt: 'desc',
      },
    ],
    select: {
      id: true,
      title: true,
      icon: true,
      parentId: true,
      updatedAt: true,
    },
  });

  res.json({
    status: 'success',
    data: {
      pages,
    },
  });
};

export const getRecentPages = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, limit = 10 } = req.query;

  if (!workspaceId) {
    throw new AppError('Workspace ID is required', 400);
  }

  // Verify user has access to workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId as string },
    include: {
      members: {
        where: {
          userId: req.user.id,
        },
      },
    },
  });

  if (!workspace || workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  const pages = await prisma.page.findMany({
    where: {
      workspaceId: workspaceId as string,
    },
    take: parseInt(limit as string),
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      title: true,
      icon: true,
      parentId: true,
      updatedAt: true,
    },
  });

  res.json({
    status: 'success',
    data: {
      pages,
    },
  });
};

export const getPageBacklinks = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { pageId } = req.params;

  const page = await prisma.page.findUnique({
    where: { id: pageId },
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

  if (!page || page.workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  // Get all pages that link to this page
  const backlinks = await prisma.pageLink.findMany({
    where: {
      targetPageId: pageId,
    },
    include: {
      sourcePage: {
        select: {
          id: true,
          title: true,
          icon: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    status: 'success',
    data: {
      backlinks: backlinks.map((link) => ({
        id: link.id,
        page: link.sourcePage,
        blockId: link.blockId,
        createdAt: link.createdAt,
      })),
    },
  });
};

export const createPageLink = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { sourcePageId, targetPageId, blockId } = req.body;

  // Verify user has access to source page
  const sourcePage = await prisma.page.findUnique({
    where: { id: sourcePageId },
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

  if (!sourcePage || sourcePage.workspace.members.length === 0) {
    throw new AppError('Access denied to source page', 403);
  }

  // Verify target page exists and user has access
  const targetPage = await prisma.page.findUnique({
    where: { id: targetPageId },
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

  if (!targetPage || targetPage.workspace.members.length === 0) {
    throw new AppError('Access denied to target page', 403);
  }

  // Create or update page link
  const pageLink = await prisma.pageLink.upsert({
    where: {
      sourcePageId_targetPageId_blockId: {
        sourcePageId,
        targetPageId,
        blockId: blockId || '',
      },
    },
    create: {
      sourcePageId,
      targetPageId,
      blockId: blockId || null,
    },
    update: {},
  });

  res.status(201).json({
    status: 'success',
    data: {
      pageLink,
    },
  });
};
