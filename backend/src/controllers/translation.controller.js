const { translateObject, translateField } = require('../services/translation.service');

/**
 * POST /api/admin/translate
 * Body: { text: string | object, sourceLang: 'vi', targetLangs: ['en', 'ja'], provider: 'openai' }
 */
exports.translate = async (req, res, next) => {
  try {
    const { text, sourceLang = 'vi', targetLangs = ['en', 'ja'], provider = 'openai' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    // Validate provider
    const validProviders = ['openai', 'gemini'];
    if (provider && !validProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Provider "${provider}" is not supported. Supported providers: ${validProviders.join(', ')}`
      });
    }
    
    // Validate targetLangs
    const validLangs = ['vi', 'en', 'ja'];
    const validTargetLangs = targetLangs.filter(lang => validLangs.includes(lang));
    
    if (validTargetLangs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid target language is required (en, ja)'
      });
    }
    
    const translated = await translateObject(text, sourceLang, validTargetLangs, provider.toLowerCase());
    
    return res.json({
      success: true,
      data: translated
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/translate/field
 * Body: { field: string | object, sourceLang: 'vi', targetLangs: ['en', 'ja'], provider: 'openai' }
 */
exports.translateField = async (req, res, next) => {
  try {
    const { field, sourceLang = 'vi', targetLangs = ['en', 'ja'], provider = 'openai' } = req.body;
    
    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'Field is required'
      });
    }
    
    // Validate provider
    const validProviders = ['openai', 'gemini'];
    if (provider && !validProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Provider "${provider}" is not supported. Supported providers: ${validProviders.join(', ')}`
      });
    }
    
    const validLangs = ['vi', 'en', 'ja'];
    const validTargetLangs = targetLangs.filter(lang => validLangs.includes(lang));
    
    if (validTargetLangs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid target language is required (en, ja)'
      });
    }
    
    const translated = await translateField(field, sourceLang, validTargetLangs, provider.toLowerCase());
    
    return res.json({
      success: true,
      data: translated
    });
  } catch (error) {
    return next(error);
  }
};

