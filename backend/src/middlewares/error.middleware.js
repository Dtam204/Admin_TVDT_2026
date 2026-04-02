const fs = require('fs');

// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);
  
  try {
    const logPath = 'd:\\Do_An_Tot_Nghiep\\Admin-thuvien\\admin-thuvien-tn\\tmp\\global_error.log';
    const logMsg = `\n[${new Date().toISOString()}] ${req.method} ${req.url}\nError: ${err.message}\nStack: ${err.stack}\nBody: ${JSON.stringify(req.body)}\n`;
    fs.appendFileSync(logPath, logMsg);
  } catch (logErr) {
    console.error('Failed to write to global log:', logErr);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};


