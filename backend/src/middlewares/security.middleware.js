/**
 * Security Middleware
 * Implements security best practices using helmet
 */

const helmet = require('helmet');

/**
 * Configure helmet with security headers
 * Customized for admin panel + API usage
 */
const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind needs unsafe-inline
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js dev needs eval
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"], // Allow http for dev
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  
  // Cross-Origin-Resource-Policy: Allow cross-origin for uploads
  // This is needed for frontend (localhost:3000) to access backend images (localhost:5000)
  crossOriginResourcePolicy: {
    policy: "cross-origin" // Allow cross-origin requests
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny', // Prevent clickjacking
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
});

module.exports = securityMiddleware;
