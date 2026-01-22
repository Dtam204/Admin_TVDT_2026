/**
 * Admin Services
 * Services for admin section (requires authentication)
 * 
 * All admin services should be imported and exported here
 */

const authService = require('./auth.service');

module.exports = {
  auth: authService,
};

