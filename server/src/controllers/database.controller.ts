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
// DATABASE OPERATIONS
// =====================

export const createDatabase = async (req: AuthRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { pageId, name, icon, properties = [], views = [] } = req.body;

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

  // Create database block
  const block = await prisma.block.create({
    data: {
      type: 'database',
      content: {},
      pageId,
      order: generateOrder(),
    },
  });

  // Create database with properties and views
  const database = await prisma.database.create({
    data: {
      blockId: block.id,
      name: name || 'Untitled Database',
      icon,
      properties: {
        create: properties.map((prop: any, index: number) => ({
          name: prop.name,
          type: prop.type,
          config: prop.config || {},
          order: index + 1,
        })),
      },
      views: {
        create: views.length > 0 ? views.map((view: any, index: number) => ({
          name: view.name,
          type: view.type,
          config: view.config || {},
          order: index + 1,
          isDefault: index === 0,
        })) : [{
          name: 'Table View',
          type: 'table',
          config: {},
          order: 1,
          isDefault: true,
        }],
      },
    },
    include: {
      properties: {
        orderBy: {
          order: 'asc',
        },
      },
      views: {
        orderBy: {
          order: 'asc',
        },
      },
      rows: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      database,
      block,
    },
  });
};

export const getDatabase = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const database = await prisma.database.findUnique({
    where: { id },
    include: {
      properties: {
        orderBy: {
          order: 'asc',
        },
      },
      views: {
        orderBy: {
          order: 'asc',
        },
      },
      rows: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!database) {
    throw new AppError('Database not found', 404);
  }

  // Verify access through block -> page -> workspace
  const block = await prisma.block.findUnique({
    where: { id: database.blockId },
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

  res.json({
    status: 'success',
    data: {
      database,
    },
  });
};

export const updateDatabase = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { name, icon } = req.body;

  const database = await prisma.database.findUnique({
    where: { id },
    include: {
      properties: true,
      views: true,
      rows: true,
    },
  });

  if (!database) {
    throw new AppError('Database not found', 404);
  }

  // Verify access
  const block = await prisma.block.findUnique({
    where: { id: database.blockId },
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

  const updatedDatabase = await prisma.database.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(icon !== undefined && { icon }),
    },
    include: {
      properties: {
        orderBy: {
          order: 'asc',
        },
      },
      views: {
        orderBy: {
          order: 'asc',
        },
      },
      rows: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  res.json({
    status: 'success',
    data: {
      database: updatedDatabase,
    },
  });
};

export const deleteDatabase = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const database = await prisma.database.findUnique({
    where: { id },
  });

  if (!database) {
    throw new AppError('Database not found', 404);
  }

  // Verify access
  const block = await prisma.block.findUnique({
    where: { id: database.blockId },
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

  // Delete database (cascade will handle properties, rows, views)
  await prisma.database.delete({
    where: { id },
  });

  // Delete the associated block
  await prisma.block.delete({
    where: { id: database.blockId },
  });

  res.status(204).send();
};

// =====================
// PROPERTY OPERATIONS
// =====================

export const createProperty = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { databaseId } = req.params;
  const { name, type, config } = req.body;

  // Verify access
  const database = await prisma.database.findUnique({
    where: { id: databaseId },
  });

  if (!database) {
    throw new AppError('Database not found', 404);
  }

  const block = await prisma.block.findUnique({
    where: { id: database.blockId },
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

  // Get last property order
  const lastProperty = await prisma.databaseProperty.findFirst({
    where: { databaseId },
    orderBy: { order: 'desc' },
  });

  const property = await prisma.databaseProperty.create({
    data: {
      databaseId,
      name,
      type,
      config: config || {},
      order: generateOrder(lastProperty?.order),
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      property,
    },
  });
};

export const updateProperty = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { name, type, config } = req.body;

  const property = await prisma.databaseProperty.findUnique({
    where: { id },
    include: {
      database: true,
    },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Verify access
  const block = await prisma.block.findUnique({
    where: { id: property.database.blockId },
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

  const updatedProperty = await prisma.databaseProperty.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(config !== undefined && { config }),
    },
  });

  res.json({
    status: 'success',
    data: {
      property: updatedProperty,
    },
  });
};

export const deleteProperty = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const property = await prisma.databaseProperty.findUnique({
    where: { id },
    include: {
      database: true,
    },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  // Verify access
  const block = await prisma.block.findUnique({
    where: { id: property.database.blockId },
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

  await prisma.databaseProperty.delete({
    where: { id },
  });

  res.status(204).send();
};

// =====================
// ROW OPERATIONS
// =====================

export const createRow = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { databaseId } = req.params;
  const { values = {}, pageId } = req.body;

  // Verify access
  const database = await prisma.database.findUnique({
    where: { id: databaseId },
  });

  if (!database) {
    throw new AppError('Database not found', 404);
  }

  const block = await prisma.block.findUnique({
    where: { id: database.blockId },
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

  // Get last row order
  const lastRow = await prisma.databaseRow.findFirst({
    where: { databaseId },
    orderBy: { order: 'desc' },
  });

  const row = await prisma.databaseRow.create({
    data: {
      databaseId,
      values,
      pageId: pageId || null,
      order: generateOrder(lastRow?.order),
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      row,
    },
  });
};

export const updateRow = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { values } = req.body;

  const row = await prisma.databaseRow.findUnique({
    where: { id },
    include: {
      database: true,
    },
  });

  if (!row) {
    throw new AppError('Row not found', 404);
  }

  // Verify access
  const block = await prisma.block.findUnique({
    where: { id: row.database.blockId },
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

  // Merge new values with existing values
  const updatedValues = {
    ...(row.values as object),
    ...values,
  };

  const updatedRow = await prisma.databaseRow.update({
    where: { id },
    data: {
      values: updatedValues,
    },
  });

  res.json({
    status: 'success',
    data: {
      row: updatedRow,
    },
  });
};

export const deleteRow = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const row = await prisma.databaseRow.findUnique({
    where: { id },
    include: {
      database: true,
    },
  });

  if (!row) {
    throw new AppError('Row not found', 404);
  }

  // Verify access
  const block = await prisma.block.findUnique({
    where: { id: row.database.blockId },
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

  await prisma.databaseRow.delete({
    where: { id },
  });

  res.status(204).send();
};

// =====================
// VIEW OPERATIONS
// =====================

export const createView = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { databaseId } = req.params;
  const { name, type, config = {} } = req.body;

  // Verify access
  const database = await prisma.database.findUnique({
    where: { id: databaseId },
  });

  if (!database) {
    throw new AppError('Database not found', 404);
  }

  const block = await prisma.block.findUnique({
    where: { id: database.blockId },
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

  // Get last view order
  const lastView = await prisma.databaseView.findFirst({
    where: { databaseId },
    orderBy: { order: 'desc' },
  });

  const view = await prisma.databaseView.create({
    data: {
      databaseId,
      name,
      type,
      config,
      order: generateOrder(lastView?.order),
      isDefault: false,
    },
  });

  res.status(201).json({
    status: 'success',
    data: {
      view,
    },
  });
};

export const updateView = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;
  const { name, type, config, isDefault } = req.body;

  const view = await prisma.databaseView.findUnique({
    where: { id },
    include: {
      database: true,
    },
  });

  if (!view) {
    throw new AppError('View not found', 404);
  }

  // Verify access
  const block = await prisma.block.findUnique({
    where: { id: view.database.blockId },
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

  // If setting as default, unset other defaults
  if (isDefault) {
    await prisma.databaseView.updateMany({
      where: {
        databaseId: view.databaseId,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    });
  }

  const updatedView = await prisma.databaseView.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      ...(config !== undefined && { config }),
      ...(isDefault !== undefined && { isDefault }),
    },
  });

  res.json({
    status: 'success',
    data: {
      view: updatedView,
    },
  });
};

export const deleteView = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { id } = req.params;

  const view = await prisma.databaseView.findUnique({
    where: { id },
    include: {
      database: true,
    },
  });

  if (!view) {
    throw new AppError('View not found', 404);
  }

  // Verify access
  const block = await prisma.block.findUnique({
    where: { id: view.database.blockId },
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

  // Don't allow deleting the last view
  const viewCount = await prisma.databaseView.count({
    where: { databaseId: view.databaseId },
  });

  if (viewCount <= 1) {
    throw new AppError('Cannot delete the last view', 400);
  }

  await prisma.databaseView.delete({
    where: { id },
  });

  res.status(204).send();
};

// =====================
// QUERY OPERATIONS
// =====================

export const queryDatabase = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  const { databaseId } = req.params;
  const { filters = [], sorts = [], limit, offset } = req.body;

  // Verify access
  const database = await prisma.database.findUnique({
    where: { id: databaseId },
    include: {
      properties: true,
    },
  });

  if (!database) {
    throw new AppError('Database not found', 404);
  }

  const block = await prisma.block.findUnique({
    where: { id: database.blockId },
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

  // Get all rows and filter/sort in memory
  // For production, consider implementing SQL-based filtering
  let rows = await prisma.databaseRow.findMany({
    where: { databaseId },
    orderBy: { order: 'asc' },
  });

  // Apply filters
  if (filters.length > 0) {
    rows = rows.filter((row) => {
      const values = row.values as Record<string, any>;
      return filters.every((filter: any) => {
        const value = values[filter.propertyId];

        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'not_equals':
            return value !== filter.value;
          case 'contains':
            return String(value).includes(filter.value);
          case 'not_contains':
            return !String(value).includes(filter.value);
          case 'starts_with':
            return String(value).startsWith(filter.value);
          case 'ends_with':
            return String(value).endsWith(filter.value);
          case 'is_empty':
            return !value || value === '';
          case 'is_not_empty':
            return value && value !== '';
          case 'greater_than':
            return Number(value) > Number(filter.value);
          case 'less_than':
            return Number(value) < Number(filter.value);
          case 'greater_than_or_equal':
            return Number(value) >= Number(filter.value);
          case 'less_than_or_equal':
            return Number(value) <= Number(filter.value);
          case 'is_checked':
            return value === true;
          case 'is_not_checked':
            return value !== true;
          default:
            return true;
        }
      });
    });
  }

  // Apply sorts
  if (sorts.length > 0) {
    rows.sort((a, b) => {
      for (const sort of sorts) {
        const aValue = (a.values as Record<string, any>)[sort.propertyId];
        const bValue = (b.values as Record<string, any>)[sort.propertyId];

        if (aValue === bValue) continue;

        const comparison = aValue > bValue ? 1 : -1;
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }

  // Apply pagination
  const total = rows.length;
  if (offset) {
    rows = rows.slice(offset);
  }
  if (limit) {
    rows = rows.slice(0, limit);
  }

  res.json({
    status: 'success',
    data: {
      rows,
      total,
      database,
    },
  });
};
