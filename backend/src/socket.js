const { Server } = require('socket.io');

let io;

const DEFAULT_ROOMS = {
  admin: 'admin_room',
  app: 'app_room',
  notifications: 'notifications_room',
};

const normalizeRole = (role = 'user') => {
  const value = String(role || 'user').toLowerCase().trim();
  if (['admin', 'admins'].includes(value)) return 'admin';
  if (['app', 'reader', 'member', 'user'].includes(value)) return 'app';
  return value || 'app';
};

const getUserRoom = (userId, role = 'user') => {
  if (userId === undefined || userId === null || userId === '') return null;
  return `${normalizeRole(role)}:${userId}`;
};

const getAdminRoom = (adminId = null) => {
  if (adminId === undefined || adminId === null || adminId === '') return DEFAULT_ROOMS.admin;
  return `admin:${adminId}`;
};

const getNotificationRoom = (userId = null, role = 'user') => {
  if (userId === undefined || userId === null || userId === '') return DEFAULT_ROOMS.notifications;
  return `${normalizeRole(role)}:${userId}`;
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
      const role = normalizeRole(payload.role || 'member');
      const roomName = getUserRoom(userId, role);
      if (!roomName) return;
      socket.join(roomName);
      socket.join(DEFAULT_ROOMS.notifications);
      console.log(`[Socket.io] Client ${socket.id} joined user room: ${roomName}`);
    });

    socket.on('join_admin_room', (payload = {}) => {
      const adminId = payload.adminId || payload.id;
      const roomName = getAdminRoom(adminId);
      socket.join(DEFAULT_ROOMS.admin);
      socket.join(DEFAULT_ROOMS.notifications);
      if (adminId !== undefined && adminId !== null && adminId !== '') socket.join(roomName);
      console.log(`[Socket.io] Client ${socket.id} joined admin room: ${roomName}`);
    });

    socket.on('join_notification_room', (payload = {}) => {
      const userId = payload.userId || payload.id;
      const role = normalizeRole(payload.role || 'member');
      const roomName = payload.room || getNotificationRoom(userId, role);
      socket.join(roomName);
      socket.join(DEFAULT_ROOMS.notifications);
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

const emitToUser = (userId, eventName, data, role = 'member') => {
  if (!io) throw new Error('Socket.io has not been initialized!');
  if (userId === undefined || userId === null) return;
  const userRoom = getUserRoom(userId, role);
  const notificationRoom = getNotificationRoom(userId, role);
  if (userRoom) io.to(userRoom).emit(eventName, data);
  if (notificationRoom) io.to(notificationRoom).emit(eventName, data);
  io.to(DEFAULT_ROOMS.notifications).emit(eventName, data);
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
  getUserRoom,
  getAdminRoom,
  getNotificationRoom,
  normalizeRole,
};
