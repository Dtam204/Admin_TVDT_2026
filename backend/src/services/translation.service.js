const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('../config/database');

/**
 * Map language codes to full names
 */
const LANGUAGE_NAMES = {
  vi: 'Vietnamese',
  en: 'English',
  ja: 'Japanese'
};

/**
 * Lấy API key từ database hoặc .env
 * Ưu tiên database, nếu không có thì dùng .env
 */
async function getApiKey(keyName) {
  try {
    // Thử lấy từ database trước
    const { rows } = await pool.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = $1',
      [keyName]
    );
    
    if (rows.length > 0 && rows[0].setting_value && rows[0].setting_value.trim()) {
      return rows[0].setting_value.trim();
    }
  } catch (error) {
    // Nếu lỗi khi query database, fallback về .env
    console.warn(`Could not get ${keyName} from database, using .env:`, error.message);
  }
  
  // Fallback về .env
  return process.env[keyName];
}

/**
 * Dịch text bằng OpenAI
 */
async function translateWithOpenAI(text, targetLang, sourceLang = 'vi') {
  const apiKey = await getApiKey('openai_api_key');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured. Please set it in Settings or .env file.');
  }
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // Sử dụng model rẻ hơn cho translation
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text from ${LANGUAGE_NAMES[sourceLang] || sourceLang} to ${LANGUAGE_NAMES[targetLang] || targetLang}. Only return the translation, no explanations, no additional text. Preserve the original meaning and tone.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    const translated = response.data.choices[0]?.message?.content?.trim();
    return translated || text;
  } catch (error) {
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
    }
    throw new Error(`Translation failed: ${error.message}`);
  }
}

/**
 * Dịch text bằng Google Gemini - Sử dụng SDK chính thức @google/generative-ai
 * 
 * ✅ CODE CHUẨN PRODUCTION:
 * - SDK mới nhất tự động map đúng v1 (không dùng v1beta)
 * - Chỉ dùng 1 model: gemini-1.5-flash-latest
 * - CẤM dùng: gemini-2.0-*, *-exp, *-lite
 * 
 * ⚠️ LƯU Ý QUAN TRỌNG:
 * - API key PHẢI có billing active trong AI Studio: https://aistudio.google.com/app/billing
 * - Không bật billing → quota = 0 → API trả 404/429
 * - Đợi 2-5 phút sau khi bật billing để có hiệu lực
 */
async function translateWithGemini(text, targetLang, sourceLang = 'vi') {
  // Sử dụng API key được cung cấp hoặc từ config
  let apiKey = 'AIzaSyDvSZlDVrrw25dQaPVwtsC8_ykiPCjAngE'; // API key được tích hợp
  const envKey = await getApiKey('gemini_api_key');
  if (envKey) {
    apiKey = envKey; // Ưu tiên API key từ env/database
  }

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Please set it in Settings or .env file.');
  }

  // Danh sách models có sẵn (theo thứ tự ưu tiên: rẻ, nhanh trước)
  // Model gemini-1.5-flash-latest KHÔNG có sẵn với key này
  // Sử dụng các model có sẵn: gemini-2.5-flash (rẻ, nhanh nhất), gemini-2.0-flash, gemini-2.5-pro
  const modelsToTry = [
    'gemini-2.5-flash',      // ✅ Rẻ nhất, nhanh nhất - có sẵn
    'gemini-2.0-flash',     // ✅ Rẻ, nhanh - có sẵn
    'gemini-2.5-pro',       // ✅ Chất lượng cao hơn - có sẵn
  ];

  const prompt = `Translate from ${LANGUAGE_NAMES[sourceLang] || sourceLang} to ${LANGUAGE_NAMES[targetLang] || targetLang}.
Only return the translation.

Text:
${text}`;

  // Thử từng model - ưu tiên model rẻ và nhanh trước
  let lastError = null;
  for (const modelName of modelsToTry) {
    try {

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

      const translated = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (translated) {
        return translated;
      }
    } catch (error) {
      lastError = error;
      const errorMsg = error.message || error.toString();
      const statusCode = error.response?.status;
      
      // Nếu lỗi 404, tiếp tục thử model tiếp theo
      if (statusCode === 404) {
        console.warn(`⚠ Model ${modelName} not available (404), trying next model...`);
        continue;
      }
      
      // Nếu lỗi 403, 401 - API key không hợp lệ, throw ngay
      if (statusCode === 403 || statusCode === 401) {
        throw new Error(`Gemini API v1 error: API key invalid or insufficient permissions (${statusCode}). Please check your API key and billing status.`);
      }
      
      // Nếu lỗi 429, quota exceeded
      if (statusCode === 429) {
        throw new Error(`Gemini API v1 error: Quota exceeded (429). Please check billing status in AI Studio.`);
      }
      
      // Các lỗi khác, tiếp tục thử model tiếp theo
      continue;
    }
  }

  // Nếu tất cả đều thất bại
  if (lastError) {
    const errorMsg = lastError.message || lastError.toString();
    const statusCode = lastError.response?.status;
    throw new Error(`Gemini API v1 error: All models failed (${statusCode || 'unknown'}). Đã thử: ${modelsToTry.join(', ')}. Error: ${errorMsg}`);
  }
  
  throw new Error('Translation failed: No result from any model');
}

/**
 * Dịch text bằng provider được chỉ định
 */
async function translateWithProvider(text, targetLang, sourceLang = 'vi', provider = 'openai') {
  switch (provider.toLowerCase()) {
    case 'openai':
      return await translateWithOpenAI(text, targetLang, sourceLang);
    case 'gemini':
      return await translateWithGemini(text, targetLang, sourceLang);
    default:
      throw new Error(`Unsupported provider: ${provider}. Supported providers: openai, gemini`);
  }
}

/**
 * Batch translate object với nhiều locale
 */
async function translateObject(obj, sourceLang = 'vi', targetLangs = ['en', 'ja'], provider = 'openai') {
  // Validate provider
  const validProviders = ['openai', 'gemini'];
  if (provider && !validProviders.includes(provider.toLowerCase())) {
    throw new Error(`Provider "${provider}" is not supported. Supported providers: ${validProviders.join(', ')}`);
  }

  if (!obj) return obj;
  
  // Nếu là string
  if (typeof obj === 'string') {
    const result = { [sourceLang]: obj };
    for (const targetLang of targetLangs) {
      try {
        result[targetLang] = await translateWithProvider(obj, targetLang, sourceLang, provider);
        // Delay để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Translation error (${provider}, ${sourceLang}->${targetLang}):`, error.message);
        result[targetLang] = obj; // Fallback về source nếu lỗi
      }
    }
    return result;
  }
  
  // Nếu là object
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip non-translatable fields
      if (['image', 'link', 'href', 'url', 'icon', 'gradient', 'color', 
           'partners', 'heroImage', 'backgroundImage', 'imageUrl', 'slug',
           'id', 'sortOrder', 'isActive'].includes(key)) {
        result[key] = value;
        continue;
      }
      
      // Recursively translate nested objects
      result[key] = await translateObject(value, sourceLang, targetLangs, provider);
    }
    return result;
  }
  
  // Nếu là array
  if (Array.isArray(obj)) {
    const result = [];
    for (const item of obj) {
      result.push(await translateObject(item, sourceLang, targetLangs, provider));
    }
    return result;
  }
  
  // Giữ nguyên các giá trị khác
  return obj;
}

/**
 * Translate một field cụ thể
 */
async function translateField(field, sourceLang = 'vi', targetLangs = ['en', 'ja'], provider = 'openai') {
  if (typeof field === 'string') {
    return await translateObject(field, sourceLang, targetLangs, provider);
  }
  
  if (typeof field === 'object' && !Array.isArray(field)) {
    return await translateObject(field, sourceLang, targetLangs, provider);
  }
  
  return field;
}

module.exports = {
  translateWithOpenAI,
  translateWithGemini,
  translateWithProvider,
  translateObject,
  translateField
};

