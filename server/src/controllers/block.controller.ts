import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Helper function to generate fractional index
const generateOrder = (prevOrder?: number, nextOrder?: number): number => {
  if (!prevOrder && !nextOrder) return 1;
  if (!prevOrder) return nextOrder! / 2;
  if (!nextOrder) return prevOrder + 1;
  return (prevOrder + nextOrder) / 2;
};

export const createBlock = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { pageId, type, content = {}, properties, parentId, afterBlockId } = req.body;

  // Verify user has access to page
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

  // Calculate order
  let order: number;
  if (afterBlockId) {
    const afterBlock = await prisma.block.findUnique({
      where: { id: afterBlockId },
    });

    const nextBlock = await prisma.block.findFirst({
      where: {
        pageId,
        parentId: parentId || null,
        order: {
          gt: afterBlock?.order || 0,
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    order = generateOrder(afterBlock?.order, nextBlock?.order);
  } else {
    // Add to end
    const lastBlock = await prisma.block.findFirst({
      where: {
        pageId,
        parentId: parentId || null,
      },
      orderBy: {
        order: 'desc',
      },
    });

    order = generateOrder(lastBlock?.order);
  }

  const block = await prisma.block.create({
    data: {
      type,
      content,
      properties,
      pageId,
      parentId: parentId || null,
      order,
    },
    include: {
      childBlocks: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      block,
    },
  });
};

export const updateBlock = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { type, content, properties } = req.body;

  const block = await prisma.block.findUnique({
    where: { id },
    include: {
      page: {
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
      },
    },
  });

  if (!block || block.page.workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  const updatedBlock = await prisma.block.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(content !== undefined && { content }),
      ...(properties !== undefined && { properties }),
    },
    include: {
      childBlocks: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  res.json({
    status: 'success',
    data: {
      block: updatedBlock,
    },
  });
};

export const deleteBlock = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const block = await prisma.block.findUnique({
    where: { id },
    include: {
      page: {
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
      },
    },
  });

  if (!block || block.page.workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  await prisma.block.delete({
    where: { id },
  });

  res.status(204).send();
};

export const reorderBlocks = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { blockId, afterBlockId, parentId, pageId } = req.body;

  // Verify access
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

  const block = await prisma.block.findUnique({
    where: { id: blockId },
  });

  if (!block) {
    throw new AppError('Block not found', 404);
  }

  // Calculate new order
  let newOrder: number;
  if (afterBlockId) {
    const afterBlock = await prisma.block.findUnique({
      where: { id: afterBlockId },
    });

    const nextBlock = await prisma.block.findFirst({
      where: {
        pageId,
        parentId: parentId || null,
        order: {
          gt: afterBlock?.order || 0,
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    newOrder = generateOrder(afterBlock?.order, nextBlock?.order);
  } else {
    const lastBlock = await prisma.block.findFirst({
      where: {
        pageId,
        parentId: parentId || null,
      },
      orderBy: {
        order: 'desc',
      },
    });

    newOrder = generateOrder(lastBlock?.order);
  }

  const updatedBlock = await prisma.block.update({
    where: { id: blockId },
    data: {
      order: newOrder,
      parentId: parentId || null,
    },
  });

  res.json({
    status: 'success',
    data: {
      block: updatedBlock,
    },
  });
};

export const duplicateBlock = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const block = await prisma.block.findUnique({
    where: { id },
    include: {
      page: {
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
      },
      childBlocks: true,
    },
  });

  if (!block || block.page.workspace.members.length === 0) {
    throw new AppError('Access denied', 403);
  }

  // Find next block to insert after
  const nextBlock = await prisma.block.findFirst({
    where: {
      pageId: block.pageId,
      parentId: block.parentId,
      order: {
        gt: block.order,
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  const newOrder = generateOrder(block.order, nextBlock?.order);

  // Create duplicate
  const duplicatedBlock = await prisma.block.create({
    data: {
      type: block.type,
      content: block.content,
      properties: block.properties,
      pageId: block.pageId,
      parentId: block.parentId,
      order: newOrder,
    },
    include: {
      childBlocks: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      block: duplicatedBlock,
    },
  });
};
