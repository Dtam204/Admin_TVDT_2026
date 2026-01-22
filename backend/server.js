const app = require('./src/app');
const { testConnection } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

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
    app.listen(PORT, () => {
      console.log(`✅ Backend server started on port ${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
    
    // Handle server errors
    app.on('error', (error) => {
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




