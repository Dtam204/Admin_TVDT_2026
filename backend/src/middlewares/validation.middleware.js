/**
 * Validation Middleware
 * Uses Joi for request validation
 */

const Joi = require('joi');

/**
 * Validate request body, query, or params
 * @param {Object} schema - Joi schema object
 * @param {String} source - 'body', 'query', or 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false, // Show all errors
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // ID parameter
  id: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),

  // Slug parameter
  slug: Joi.object({
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).required(),
  }),

  // News create/update
  news: Joi.object({
    title: Joi.alternatives().try(
      Joi.string(),
      Joi.object({
        vi: Joi.string(),
        en: Joi.string().allow(''),
        ja: Joi.string().allow(''),
      })
    ).required(),
    slug: Joi.string().pattern(/^[a-z0-9-]+$/).required(),
    content: Joi.alternatives().try(
      Joi.string(),
      Joi.object({
        vi: Joi.string(),
        en: Joi.string().allow(''),
        ja: Joi.string().allow(''),
      })
    ).required(),
    excerpt: Joi.alternatives().try(
      Joi.string().allow(''),
      Joi.object({
        vi: Joi.string().allow(''),
        en: Joi.string().allow(''),
        ja: Joi.string().allow(''),
      })
    ).optional(),
    category_id: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('draft', 'pending', 'approved', 'published', 'rejected').default('draft'),
    published_at: Joi.date().iso().optional(),
    featured_image: Joi.string().uri().allow('').optional(),
  }),

  // User create/update
  user: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).optional(), // Optional for update
    name: Joi.string().min(2).required(),
    role_id: Joi.number().integer().positive().required(),
    status: Joi.string().valid('active', 'inactive').default('active'),
  }),

  // Auth login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Contact request
  contactRequest: Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    company: Joi.string().allow('').optional(),
    message: Joi.string().min(10).required(),
  }),

  // Settings update
  setting: Joi.object({
    setting_value: Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object(),
      Joi.array()
    ).required(),
  }),

  // Translation request
  translation: Joi.object({
    text: Joi.string().required(),
    from: Joi.string().valid('vi', 'en', 'ja').required(),
    to: Joi.string().valid('vi', 'en', 'ja').required(),
    provider: Joi.string().valid('gemini', 'openai').default('gemini'),
  }),
};

module.exports = {
  validate,
  schemas,
};
