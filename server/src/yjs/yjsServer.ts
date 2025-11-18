import { Server } from 'socket.io';
import * as Y from 'yjs';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';

const prisma = new PrismaClient();

interface YjsSocket {
  id: string;
  userId?: string;
  email?: string;
}

// Store active Y.Doc instances per page
const docs = new Map<string, Y.Doc>();
const awarenessStates = new Map<string, awarenessProtocol.Awareness>();

// Get or create Y.Doc for a page
const getYDoc = async (pageId: string): Promise<Y.Doc> => {
  if (docs.has(pageId)) {
    return docs.get(pageId)!;
  }

  const ydoc = new Y.Doc();

  // Try to load existing document from database
  try {
    const savedDoc = await prisma.yjsDocument.findUnique({
      where: { pageId },
    });

    if (savedDoc && savedDoc.data) {
      // Apply saved state to the Y.Doc
      Y.applyUpdate(ydoc, Buffer.from(savedDoc.data));
    }
  } catch (error) {
    console.error('Error loading Y.Doc from database:', error);
  }

  // Set up persistence - save updates to database
  ydoc.on('update', async (update: Uint8Array, origin: any) => {
    // Don't save if update came from database (to avoid loops)
    if (origin === 'database') return;

    try {
      const stateVector = Y.encodeStateAsUpdate(ydoc);

      await prisma.yjsDocument.upsert({
        where: { pageId },
        create: {
          pageId,
          data: Buffer.from(stateVector),
          version: 1,
        },
        update: {
          data: Buffer.from(stateVector),
          version: { increment: 1 },
        },
      });
    } catch (error) {
      console.error('Error saving Y.Doc to database:', error);
    }
  });

  docs.set(pageId, ydoc);
  return ydoc;
};

// Get or create awareness for a page
const getAwareness = (pageId: string, ydoc: Y.Doc): awarenessProtocol.Awareness => {
  if (awarenessStates.has(pageId)) {
    return awarenessStates.get(pageId)!;
  }

  const awareness = new awarenessProtocol.Awareness(ydoc);
  awarenessStates.set(pageId, awareness);
  return awareness;
};

// Handle Yjs sync protocol messages
const handleSyncMessage = (
  encoder: encoding.Encoder,
  decoder: decoding.Decoder,
  doc: Y.Doc,
  transactionOrigin: any
) => {
  const messageType = decoding.readVarUint(decoder);

  switch (messageType) {
    case syncProtocol.messageYjsSyncStep1:
      syncProtocol.readSyncStep1(decoder, encoder, doc);
      break;
    case syncProtocol.messageYjsSyncStep2:
      syncProtocol.readSyncStep2(decoder, doc, transactionOrigin);
      break;
    case syncProtocol.messageYjsUpdate:
      syncProtocol.readUpdate(decoder, doc, transactionOrigin);
      break;
    default:
      console.error('Unknown message type:', messageType);
  }
};

export const setupYjsServer = (io: Server) => {
  const yjsNamespace = io.of('/yjs');

  // Authentication middleware
  yjsNamespace.use((socket: any, next) => {
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

  yjsNamespace.on('connection', async (socket: any) => {
    console.log(`Yjs client connected: ${socket.userId}`);

    let currentPageId: string | null = null;
    let currentDoc: Y.Doc | null = null;
    let currentAwareness: awarenessProtocol.Awareness | null = null;

    // Join a page room for collaboration
    socket.on('join-page', async (pageId: string) => {
      try {
        // Leave previous room if any
        if (currentPageId) {
          socket.leave(`yjs:${currentPageId}`);
          if (currentAwareness) {
            currentAwareness.setLocalState(null);
          }
        }

        currentPageId = pageId;
        currentDoc = await getYDoc(pageId);
        currentAwareness = getAwareness(pageId, currentDoc);

        // Join the room
        socket.join(`yjs:${pageId}`);

        // Send initial sync step
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, syncProtocol.messageYjsSyncStep1);
        syncProtocol.writeSyncStep1(encoder, currentDoc);
        socket.emit('yjs-message', encoding.toUint8Array(encoder));

        // Send awareness state
        if (currentAwareness) {
          const awarenessEncoder = encoding.createEncoder();
          encoding.writeVarUint(awarenessEncoder, 1); // Awareness message type
          encoding.writeVarUint8Array(
            awarenessEncoder,
            awarenessProtocol.encodeAwarenessUpdate(
              currentAwareness,
              Array.from(currentAwareness.getStates().keys())
            )
          );
          socket.emit('yjs-message', encoding.toUint8Array(awarenessEncoder));
        }

        console.log(`User ${socket.userId} joined Yjs room for page ${pageId}`);
      } catch (error) {
        console.error('Error joining Yjs page:', error);
        socket.emit('yjs-error', 'Failed to join page');
      }
    });

    // Handle Yjs protocol messages
    socket.on('yjs-message', async (message: Uint8Array) => {
      if (!currentDoc || !currentPageId) return;

      try {
        const encoder = encoding.createEncoder();
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);

        if (messageType === 0) {
          // Sync protocol message
          handleSyncMessage(encoder, decoder, currentDoc, socket.id);

          // Broadcast to other clients in the room
          if (encoding.length(encoder) > 0) {
            socket.to(`yjs:${currentPageId}`).emit('yjs-message', encoding.toUint8Array(encoder));
          }
        } else if (messageType === 1 && currentAwareness) {
          // Awareness protocol message
          awarenessProtocol.applyAwarenessUpdate(
            currentAwareness,
            decoding.readVarUint8Array(decoder),
            socket.id
          );

          // Broadcast awareness to other clients
          socket.to(`yjs:${currentPageId}`).emit('yjs-message', message);
        }
      } catch (error) {
        console.error('Error handling Yjs message:', error);
      }
    });

    // Handle awareness updates (cursor position, selection, etc.)
    socket.on('awareness-update', (update: { user: any; cursor: any; selection: any }) => {
      if (!currentAwareness || !currentPageId) return;

      try {
        const localState = {
          user: {
            id: socket.userId,
            email: socket.email,
            ...update.user,
          },
          cursor: update.cursor,
          selection: update.selection,
        };

        currentAwareness.setLocalStateField('user', localState);

        // Broadcast to other clients
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, 1); // Awareness message type
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(currentAwareness, [socket.id])
        );
        socket.to(`yjs:${currentPageId}`).emit('yjs-message', encoding.toUint8Array(encoder));
      } catch (error) {
        console.error('Error updating awareness:', error);
      }
    });

    // Leave page room
    socket.on('leave-page', () => {
      if (currentPageId) {
        socket.leave(`yjs:${currentPageId}`);
        if (currentAwareness) {
          currentAwareness.setLocalState(null);
        }
        console.log(`User ${socket.userId} left Yjs room for page ${currentPageId}`);
        currentPageId = null;
        currentDoc = null;
        currentAwareness = null;
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (currentAwareness) {
        currentAwareness.setLocalState(null);
      }
      console.log(`Yjs client disconnected: ${socket.userId}`);
    });
  });

  console.log('✅ Yjs WebSocket server configured');
};

// Cleanup old documents (run periodically)
export const cleanupOldDocs = () => {
  // Clean up docs that haven't been accessed in a while
  const now = Date.now();
  const timeout = 1000 * 60 * 30; // 30 minutes

  for (const [pageId, doc] of docs.entries()) {
    // Check if doc has any active connections
    const awareness = awarenessStates.get(pageId);
    if (awareness && awareness.getStates().size === 0) {
      // No active users, can clean up after timeout
      setTimeout(() => {
        if (awareness.getStates().size === 0) {
          docs.delete(pageId);
          awarenessStates.delete(pageId);
          doc.destroy();
          console.log(`Cleaned up Y.Doc for page ${pageId}`);
        }
      }, timeout);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupOldDocs, 1000 * 60 * 10);
