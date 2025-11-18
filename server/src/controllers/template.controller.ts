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

// =====================
// TEMPLATE OPERATIONS
// =====================

export const createTemplate = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, name, description, icon, category, blocks, isPublic = false } = req.body;

  // Verify user has access to workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
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

  const template = await prisma.template.create({
    data: {
      workspaceId,
      name,
      description,
      icon,
      category,
      blocks: blocks || [],
      isPublic,
      createdBy: req.user.id,
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      template,
    },
  });
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { workspaceId, category, includePublic = 'true' } = req.query;

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

  // Build where clause
  const whereClause: any = {
    OR: [
      { workspaceId: workspaceId as string },
      ...(includePublic === 'true' ? [{ isPublic: true }] : []),
    ],
  };

  if (category) {
    whereClause.category = category;
  }

  const templates = await prisma.template.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    status: 'success',
    data: {
      templates,
    },
  });
};

export const getTemplate = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Check if user has access (either workspace member or template is public)
  if (!template.isPublic) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: template.workspaceId },
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
  }

  res.json({
    status: 'success',
    data: {
      template,
    },
  });
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { name, description, icon, category, blocks, isPublic } = req.body;

  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Verify user has access
  const workspace = await prisma.workspace.findUnique({
    where: { id: template.workspaceId },
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

  const updatedTemplate = await prisma.template.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(icon !== undefined && { icon }),
      ...(category !== undefined && { category }),
      ...(blocks && { blocks }),
      ...(isPublic !== undefined && { isPublic }),
    },
  });

  res.json({
    status: 'success',
    data: {
      template: updatedTemplate,
    },
  });
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Verify user has access
  const workspace = await prisma.workspace.findUnique({
    where: { id: template.workspaceId },
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

  await prisma.template.delete({
    where: { id },
  });

  res.status(204).send();
};

// =====================
// TEMPLATE INSTANTIATION
// =====================

export const createPageFromTemplate = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { templateId, workspaceId, parentId, title } = req.body;

  // Get template
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Check access to template
  if (!template.isPublic && template.workspaceId !== workspaceId) {
    const workspace = await prisma.workspace.findUnique({
      where: { id: template.workspaceId },
      include: {
        members: {
          where: {
            userId: req.user.id,
          },
        },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      throw new AppError('Access denied to template', 403);
    }
  }

  // Verify user has access to target workspace
  const targetWorkspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: {
          userId: req.user.id,
        },
      },
    },
  });

  if (!targetWorkspace || targetWorkspace.members.length === 0) {
    throw new AppError('Access denied to workspace', 403);
  }

  // Create page
  const page = await prisma.page.create({
    data: {
      title: title || template.name,
      icon: template.icon,
      workspaceId,
      parentId: parentId || null,
      createdBy: req.user.id,
    },
  });

  // Create blocks from template
  const templateBlocks = template.blocks as any[];
  if (Array.isArray(templateBlocks) && templateBlocks.length > 0) {
    const blocksToCreate = templateBlocks.map((block, index) => ({
      type: block.type || 'text',
      content: block.content || {},
      properties: block.properties || {},
      pageId: page.id,
      parentId: null,
      order: index + 1,
    }));

    await prisma.block.createMany({
      data: blocksToCreate,
    });
  }

  // Fetch complete page with blocks
  const completePageData = await prisma.page.findUnique({
    where: { id: page.id },
    include: {
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
      page: completePageData,
    },
  });
};

// =====================
// PREDEFINED TEMPLATES
// =====================

export const getPredefinedTemplates = async (req: AuthRequest, res: Response) => {
  // These are built-in templates that come with the app
  const predefinedTemplates = [
    {
      id: 'blank',
      name: 'Blank Page',
      description: 'Start with a clean slate',
      icon: '📄',
      category: 'Basic',
      blocks: [],
      isPublic: true,
    },
    {
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Document your meetings with agenda, notes, and action items',
      icon: '📝',
      category: 'Work',
      blocks: [
        {
          type: 'heading1',
          content: { type: 'doc', content: [{ type: 'text', text: 'Meeting Notes' }] },
        },
        {
          type: 'text',
          content: { type: 'doc', content: [{ type: 'text', text: 'Date: ' }] },
        },
        {
          type: 'text',
          content: { type: 'doc', content: [{ type: 'text', text: 'Attendees: ' }] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Agenda' }] },
        },
        {
          type: 'bullet',
          content: { type: 'doc', content: [{ type: 'text', text: 'Topic 1' }] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Notes' }] },
        },
        {
          type: 'text',
          content: { type: 'doc', content: [] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Action Items' }] },
        },
        {
          type: 'todo',
          content: { type: 'doc', content: [{ type: 'text', text: 'Action item 1' }] },
          properties: { checked: false },
        },
      ],
      isPublic: true,
    },
    {
      id: 'project-plan',
      name: 'Project Plan',
      description: 'Plan and track your projects',
      icon: '🎯',
      category: 'Work',
      blocks: [
        {
          type: 'heading1',
          content: { type: 'doc', content: [{ type: 'text', text: 'Project Plan' }] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Overview' }] },
        },
        {
          type: 'text',
          content: { type: 'doc', content: [{ type: 'text', text: 'Project description...' }] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Goals' }] },
        },
        {
          type: 'bullet',
          content: { type: 'doc', content: [{ type: 'text', text: 'Goal 1' }] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Timeline' }] },
        },
        {
          type: 'text',
          content: { type: 'doc', content: [] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Tasks' }] },
        },
        {
          type: 'todo',
          content: { type: 'doc', content: [{ type: 'text', text: 'Task 1' }] },
          properties: { checked: false },
        },
      ],
      isPublic: true,
    },
    {
      id: 'todo-list',
      name: 'To-Do List',
      description: 'Simple task list to stay organized',
      icon: '✅',
      category: 'Personal',
      blocks: [
        {
          type: 'heading1',
          content: { type: 'doc', content: [{ type: 'text', text: 'To-Do List' }] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Today' }] },
        },
        {
          type: 'todo',
          content: { type: 'doc', content: [{ type: 'text', text: 'Task 1' }] },
          properties: { checked: false },
        },
        {
          type: 'todo',
          content: { type: 'doc', content: [{ type: 'text', text: 'Task 2' }] },
          properties: { checked: false },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'This Week' }] },
        },
        {
          type: 'todo',
          content: { type: 'doc', content: [{ type: 'text', text: 'Task 3' }] },
          properties: { checked: false },
        },
      ],
      isPublic: true,
    },
    {
      id: 'documentation',
      name: 'Documentation',
      description: 'Create technical documentation',
      icon: '📚',
      category: 'Work',
      blocks: [
        {
          type: 'heading1',
          content: { type: 'doc', content: [{ type: 'text', text: 'Documentation' }] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Overview' }] },
        },
        {
          type: 'text',
          content: { type: 'doc', content: [{ type: 'text', text: 'Brief description...' }] },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'Getting Started' }] },
        },
        {
          type: 'code',
          content: { type: 'doc', content: [{ type: 'text', text: '// Code example' }] },
          properties: { language: 'javascript' },
        },
        {
          type: 'heading2',
          content: { type: 'doc', content: [{ type: 'text', text: 'API Reference' }] },
        },
        {
          type: 'text',
          content: { type: 'doc', content: [] },
        },
      ],
      isPublic: true,
    },
  ];

  res.json({
    status: 'success',
    data: {
      templates: predefinedTemplates,
    },
  });
};
