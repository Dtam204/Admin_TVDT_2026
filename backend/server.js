const { port } = require('./src/config/env');
const http = require('http');
const app = require('./src/app.js');
const { testConnection } = require('./src/config/database');
const { initSocket } = require('./src/socket');

const PORT = port;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start server after database connection is ready
async function startServer() {
  try {
    // Test database connection first
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Cannot start server: Database connection failed');
      console.error('   Please check your database configuration in .env file');
      console.error('   Make sure PostgreSQL is running and credentials are correct');
      process.exit(1);
    }
    
    // Start the server
    const { ensureTablesOnce } = require('./src/utils/ensureMediaTables');
    const CronJobManager = require('./src/utils/cron');
    server.listen(PORT, async () => {
      console.log(`✅ Backend server started on port ${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
      
      try {
        await ensureTablesOnce();
        console.log('✅ Media tables initialization checked');
        
        // Bắt đầu các tác vụ định kỳ (Quét quá hạn lúc 8h sáng)
        CronJobManager.start();
      } catch (err) {
        console.error('❌ Failed to initialize media tables:', err.message);
      }
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error('   Please stop the other process or change PORT in .env');
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();




