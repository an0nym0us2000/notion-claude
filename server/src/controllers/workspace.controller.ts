import { Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createWorkspace = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { name, icon } = req.body;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      icon,
      members: {
        create: {
          userId: req.user.id,
          role: 'owner',
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      workspace,
    },
  });
};

export const getWorkspaces = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId: req.user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: {
          pages: true,
        },
      },
    },
  });

  res.json({
    status: 'success',
    data: {
      workspaces,
    },
  });
};

export const getWorkspace = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const workspace = await prisma.workspace.findFirst({
    where: {
      id,
      members: {
        some: {
          userId: req.user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      pages: {
        where: {
          parentId: null, // Only root pages
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!workspace) {
    throw new AppError('Workspace not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      workspace,
    },
  });
};

export const updateWorkspace = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { name, icon } = req.body;

  // Check if user has permission
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: id,
      userId: req.user.id,
      role: {
        in: ['owner', 'admin'],
      },
    },
  });

  if (!member) {
    throw new AppError('Permission denied', 403);
  }

  const workspace = await prisma.workspace.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(icon !== undefined && { icon }),
    },
  });

  res.json({
    status: 'success',
    data: {
      workspace,
    },
  });
};

export const deleteWorkspace = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  // Check if user is owner
  const member = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: id,
      userId: req.user.id,
      role: 'owner',
    },
  });

  if (!member) {
    throw new AppError('Only workspace owner can delete workspace', 403);
  }

  await prisma.workspace.delete({
    where: { id },
  });

  res.status(204).send();
};

export const addMember = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { email, role = 'member' } = req.body;

  // Check if current user has permission
  const currentMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: id,
      userId: req.user.id,
      role: {
        in: ['owner', 'admin'],
      },
    },
  });

  if (!currentMember) {
    throw new AppError('Permission denied', 403);
  }

  // Find user to add
  const userToAdd = await prisma.user.findUnique({
    where: { email },
  });

  if (!userToAdd) {
    throw new AppError('User not found', 404);
  }

  // Check if user is already a member
  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: id,
      userId: userToAdd.id,
    },
  });

  if (existingMember) {
    throw new AppError('User is already a member', 409);
  }

  // Add member
  const newMember = await prisma.workspaceMember.create({
    data: {
      workspaceId: id,
      userId: userToAdd.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      member: newMember,
    },
  });
};
