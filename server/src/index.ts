import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { authRouter } from './routes/auth.routes';
import { workspaceRouter } from './routes/workspace.routes';
import { pageRouter } from './routes/page.routes';
import { blockRouter } from './routes/block.routes';
import { databaseRouter } from './routes/database.routes';
import { templateRouter } from './routes/template.routes';
import { searchRouter } from './routes/search.routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketServer } from './socket/socketServer';
import { setupYjsServer } from './yjs/yjsServer';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspaceRouter);
app.use('/api/pages', pageRouter);
app.use('/api/blocks', blockRouter);
app.use('/api/databases', databaseRouter);
app.use('/api/templates', templateRouter);
app.use('/api/search', searchRouter);

// Error handling
app.use(errorHandler);

// Setup WebSocket servers
setupSocketServer(io);
setupYjsServer(io);

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔄 Yjs collaboration server ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

export { io };
