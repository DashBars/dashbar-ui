import { io, Socket } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

/**
 * Get or create the singleton Socket.IO client connected to /dashboard namespace.
 * Authenticates using the user's JWT stored in localStorage.
 */
export function getSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem('auth_token');

  if (!token) {
    throw new Error('No auth token available for WebSocket connection');
  }

  socket = io(`${API_BASE_URL}/dashboard`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log('[WS] Connected to dashboard');
  });

  socket.on('disconnect', (reason) => {
    console.log('[WS] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[WS] Connection error:', err.message);
  });

  socket.on('error', (data: { message: string }) => {
    console.error('[WS] Server error:', data.message);
  });

  return socket;
}

/**
 * Disconnect the WebSocket client and clean up.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
