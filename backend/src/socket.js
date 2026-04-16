const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.io Server
 * Cấu hình chuyên nghiệp hỗ trợ CORS và Room-based logic
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
        'http://127.0.0.1:3000'
      ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Client connected: ${socket.id}`);

    // Tham gia phòng cụ thể (Member hoặc Admin)
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`[Socket.io] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get Socket.io Instance (Singleton)
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO
};
