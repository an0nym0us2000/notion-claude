import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthSocket extends Socket {
  userId?: string;
  email?: string;
}

interface UserPresence {
  userId: string;
  email: string;
  pageId: string;
  cursor?: {
    x: number;
    y: number;
  };
  selection?: {
    blockId: string;
    start: number;
    end: number;
  };
}

const activeUsers = new Map<string, UserPresence>();

export const setupSocketServer = (io: Server) => {
  // Authentication middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error('Server configuration error'));
    }

    try {
      const decoded = jwt.verify(token, secret) as {
        id: string;
        email: string;
      };

      socket.userId = decoded.id;
      socket.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join page room
    socket.on('join-page', (pageId: string) => {
      socket.join(`page:${pageId}`);

      // Add user to active users
      const presence: UserPresence = {
        userId: socket.userId!,
        email: socket.email!,
        pageId,
      };
      activeUsers.set(socket.id, presence);

      // Notify others in the room
      socket.to(`page:${pageId}`).emit('user-joined', {
        userId: socket.userId,
        email: socket.email,
      });

      // Send current active users to the new user
      const roomUsers = Array.from(activeUsers.values()).filter(
        (user) => user.pageId === pageId
      );
      socket.emit('active-users', roomUsers);

      console.log(`User ${socket.userId} joined page: ${pageId}`);
    });

    // Leave page room
    socket.on('leave-page', (pageId: string) => {
      socket.leave(`page:${pageId}`);
      activeUsers.delete(socket.id);

      socket.to(`page:${pageId}`).emit('user-left', {
        userId: socket.userId,
      });

      console.log(`User ${socket.userId} left page: ${pageId}`);
    });

    // Block update (for real-time collaboration)
    socket.on('block-update', (data: {
      pageId: string;
      blockId: string;
      content: any;
      type?: string;
    }) => {
      socket.to(`page:${data.pageId}`).emit('block-updated', {
        blockId: data.blockId,
        content: data.content,
        type: data.type,
        userId: socket.userId,
      });
    });

    // Block created
    socket.on('block-created', (data: {
      pageId: string;
      block: any;
    }) => {
      socket.to(`page:${data.pageId}`).emit('block-created', {
        block: data.block,
        userId: socket.userId,
      });
    });

    // Block deleted
    socket.on('block-deleted', (data: {
      pageId: string;
      blockId: string;
    }) => {
      socket.to(`page:${data.pageId}`).emit('block-deleted', {
        blockId: data.blockId,
        userId: socket.userId,
      });
    });

    // Cursor position
    socket.on('cursor-move', (data: {
      pageId: string;
      x: number;
      y: number;
    }) => {
      const presence = activeUsers.get(socket.id);
      if (presence) {
        presence.cursor = { x: data.x, y: data.y };
        activeUsers.set(socket.id, presence);
      }

      socket.to(`page:${data.pageId}`).emit('cursor-moved', {
        userId: socket.userId,
        email: socket.email,
        x: data.x,
        y: data.y,
      });
    });

    // Selection change
    socket.on('selection-change', (data: {
      pageId: string;
      blockId: string;
      start: number;
      end: number;
    }) => {
      const presence = activeUsers.get(socket.id);
      if (presence) {
        presence.selection = {
          blockId: data.blockId,
          start: data.start,
          end: data.end,
        };
        activeUsers.set(socket.id, presence);
      }

      socket.to(`page:${data.pageId}`).emit('selection-changed', {
        userId: socket.userId,
        email: socket.email,
        blockId: data.blockId,
        start: data.start,
        end: data.end,
      });
    });

    // Page title update
    socket.on('page-title-update', (data: {
      pageId: string;
      title: string;
    }) => {
      socket.to(`page:${data.pageId}`).emit('page-title-updated', {
        title: data.title,
        userId: socket.userId,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const presence = activeUsers.get(socket.id);
      if (presence) {
        socket.to(`page:${presence.pageId}`).emit('user-left', {
          userId: socket.userId,
        });
        activeUsers.delete(socket.id);
      }
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  console.log('✅ WebSocket server configured');
};
