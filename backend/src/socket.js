const { Server } = require('socket.io');

let io;

const DEFAULT_ROOMS = {
  admin: 'admin_room',
  app: 'app_room',
  notifications: 'notifications_room',
};

/**
 * Initialize Socket.io Server
 * Đồng bộ luồng thông báo giữa Admin và App
 */
const initSocket = (server) => {
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = configuredOrigins.length > 0
    ? configuredOrigins
    : [
        'https://thuvientn.site',
        'https://www.thuvientn.site',
        'http://thuvientn.site',
        'http://www.thuvientn.site',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001'
      ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    socket.on('join_room', (room) => {
      if (!room || typeof room !== 'string') return;
      socket.join(room);
      console.log(`[Socket.io] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('join_user_room', (payload = {}) => {
      const userId = payload.userId || payload.id;
      const role = payload.role || 'user';
      if (!userId) return;
      const roomName = `${role}:${userId}`;
      socket.join(roomName);
      socket.join(DEFAULT_ROOMS.notifications);
      console.log(`[Socket.io] Client ${socket.id} joined user room: ${roomName}`);
    });

    socket.on('join_admin_room', (payload = {}) => {
      const adminId = payload.adminId || payload.id;
      const roomName = adminId ? `admin:${adminId}` : DEFAULT_ROOMS.admin;
      socket.join(DEFAULT_ROOMS.admin);
      socket.join(DEFAULT_ROOMS.notifications);
      if (adminId) socket.join(roomName);
      console.log(`[Socket.io] Client ${socket.id} joined admin room: ${roomName}`);
    });

    socket.on('join_notification_room', (payload = {}) => {
      const userId = payload.userId || payload.id;
      const role = payload.role || 'user';
      const roomName = payload.room || (userId ? `${role}:${userId}` : DEFAULT_ROOMS.notifications);
      socket.join(roomName);
      console.log(`[Socket.io] Client ${socket.id} joined notification room: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const emitToRoom = (room, eventName, data) => {
  if (!io) throw new Error('Socket.io has not been initialized!');
  io.to(room).emit(eventName, data);
};

const emitToUser = (userId, eventName, data) => {
  if (!io) throw new Error('Socket.io has not been initialized!');
  if (userId === undefined || userId === null) return;
  io.to(`user:${userId}`).emit(eventName, data);
  io.to(`admin:${userId}`).emit(eventName, data);
  io.to(`app:${userId}`).emit(eventName, data);
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
  emitToRoom,
  emitToUser,
  DEFAULT_ROOMS,
};
