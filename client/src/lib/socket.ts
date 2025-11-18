import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (!socket) {
    socket = io(WS_URL, {
      auth: {
        token,
      },
      autoConnect: false,
    });
  }
  return socket;
};

export const connectSocket = (token: string) => {
  const socket = getSocket(token);
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { getSocket, connectSocket, disconnectSocket };
