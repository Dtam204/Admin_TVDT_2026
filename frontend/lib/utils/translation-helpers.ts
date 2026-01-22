import { getLocaleValue, setLocaleValue } from './locale-admin';

export type Locale = 'vi' | 'en' | 'ja';

/**
 * Extract text từ locale object hoặc string theo source language
 */
export function extractSourceText(value: any, sourceLang: Locale): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (sourceLang in value) {
      const text = (value as Record<Locale, string>)[sourceLang];
      return typeof text === 'string' ? text.trim() : '';
    }
  }
  return '';
}

/**
 * Check if a value needs translation (has source text but missing target languages)
 */
export function needsTranslation(value: any, sourceLang: Locale): boolean {
  if (typeof value === 'string' && value.trim()) {
    return true; // String needs to be converted to locale object
  }
  
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('vi' in value || 'en' in value || 'ja' in value) {
      const localeValue = value as Record<Locale, string>;
      const sourceText = (localeValue[sourceLang] || '').trim();
      if (!sourceText) return false;
      
      // Check if missing any target language
      const allLangs: Locale[] = ['vi', 'en', 'ja'];
      const targetLangs = allLangs.filter(lang => lang !== sourceLang);
      return targetLangs.some(lang => !localeValue[lang]?.trim());
    }
  }
  
  return false;
}

/**
 * Đếm số lượng fields cần dịch và đã có đầy đủ ngôn ngữ
 */
export function countTranslationFields(
  data: any,
  sourceLang: Locale,
  skipFields: string[] = []
): { totalFields: number; needsTranslation: number; alreadyComplete: number; skippedEmpty: number } {
  if (!data || typeof data !== 'object') {
    return { totalFields: 0, needsTranslation: 0, alreadyComplete: 0, skippedEmpty: 0 };
  }
  
  const defaultSkipFields = [
    'image', 'link', 'href', 'url', 'icon', 'gradient', 'color',
    'partners', 'heroImage', 'backgroundImage', 'imageUrl', 'slug',
    'id', 'sortOrder', 'isActive', 'iconName', 'rating', 'type',
    'imageSide', 'buttonLink', 'stepId', 'iconSize', 'backgroundColor',
    'avatar', 'iconGradient', 'email', 'phone', 'year', 'icon',
    'createdAt', 'updatedAt', 'created_at', 'updated_at' // Metadata fields không cần dịch
    // Không skip 'button', 'header', 'steps', 'items', 'stats', 'contacts', 'colors' 
    // để có thể đếm các fields bên trong chúng
  ];
  
  const allSkipFields = [...defaultSkipFields, ...skipFields];
  let totalFields = 0;
  let needsTranslation = 0;
  let alreadyComplete = 0;
  let skippedEmpty = 0;
  
  const countRecursive = (obj: any, path: string = ''): void => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (allSkipFields.includes(key)) continue;
      
      if (typeof value === 'string') {
        totalFields++;
        const trimmed = value.trim();
        if (trimmed) {
          // String cần dịch thành locale object
          needsTranslation++;
        } else {
          skippedEmpty++;
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Kiểm tra nếu là locale object
        if ('vi' in value || 'en' in value || 'ja' in value) {
          totalFields++;
          const localeValue = value as Record<Locale, string>;
          const sourceText = (localeValue[sourceLang] || '').trim();
          
          if (!sourceText) {
            skippedEmpty++;
          } else {
            // Check if missing any target language
            const allLangs: Locale[] = ['vi', 'en', 'ja'];
            const targetLangs = allLangs.filter(lang => lang !== sourceLang);
            const missingTargets = targetLangs.filter(lang => !localeValue[lang]?.trim());
            
            if (missingTargets.length > 0) {
              needsTranslation++;
            } else {
              alreadyComplete++;
            }
          }
        } else {
          // Nested object - đệ quy
          countRecursive(value, currentPath);
        }
      } else if (Array.isArray(value)) {
        // Array
        value.forEach((item, index) => {
          if (item === null || item === undefined) return;
          
          if (typeof item === 'string') {
            totalFields++;
            const trimmed = item.trim();
            if (trimmed) {
              needsTranslation++;
            } else {
              skippedEmpty++;
            }
          } else if (item && typeof item === 'object' && !Array.isArray(item)) {
            if ('vi' in item || 'en' in item || 'ja' in item) {
              totalFields++;
              const localeValue = item as Record<Locale, string>;
              const sourceText = (localeValue[sourceLang] || '').trim();
              
              if (!sourceText) {
                skippedEmpty++;
              } else {
                const allLangs: Locale[] = ['vi', 'en', 'ja'];
                const targetLangs = allLangs.filter(lang => lang !== sourceLang);
                const missingTargets = targetLangs.filter(lang => !localeValue[lang]?.trim());
                
                if (missingTargets.length > 0) {
                  needsTranslation++;
                } else {
                  alreadyComplete++;
                }
              }
            } else {
              // Nested object trong array
              countRecursive(item, `${currentPath}[${index}]`);
            }
          }
        });
      }
    }
  };
  
  countRecursive(data);
  
  return { totalFields, needsTranslation, alreadyComplete, skippedEmpty };
}

/**
 * Build a simple translation object from data
 * Áp dụng logic từ handleTranslateAll trong home/page.tsx
 * Chỉ lấy các fields có giá trị ở ngôn ngữ nguồn và còn thiếu ngôn ngữ đích
 * Giữ nguyên cấu trúc nested
 */
export function buildSimpleTranslationObject(
  data: any,
  sourceLang: Locale,
  skipFields: string[] = [],
  path: string = '',
  targetObj: any = {}
): any {
  if (!data || typeof data !== 'object') return targetObj;
  
  const defaultSkipFields = [
    'image', 'link', 'href', 'url', 'icon', 'gradient', 'color',
    'partners', 'heroImage', 'backgroundImage', 'imageUrl', 'slug',
    'id', 'sortOrder', 'isActive', 'iconName', 'rating', 'type',
    'imageSide', 'buttonLink', 'stepId', 'iconSize', 'backgroundColor',
    'avatar', 'iconGradient', 'email', 'phone', 'year', 'icon',
    'createdAt', 'updatedAt', 'created_at', 'updated_at' // Metadata fields không cần dịch
    // Không skip 'button', 'header', 'steps', 'items', 'stats', 'contacts', 'colors'
    // để có thể đếm các fields bên trong chúng
  ];
  
  const allSkipFields = [...defaultSkipFields, ...skipFields];
  
  for (const [key, value] of Object.entries(data)) {
    if (allSkipFields.includes(key)) continue;
    
    const currentPath = path ? `${path}.${key}` : key;
    
    // Nếu là string - tự động convert thành locale object
    if (typeof value === 'string' && value.trim()) {
      // Tạo nested structure trong targetObj
      const keys = currentPath.split('.');
      let current: any = targetObj;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      // Lưu source text (chỉ lấy text từ source language đã chọn)
      current[keys[keys.length - 1]] = value.trim();
      continue;
    }
    
    // Kiểm tra nếu là locale object (có vi, en, ja)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const hasVi = 'vi' in value;
      const hasEn = 'en' in value;
      const hasJa = 'ja' in value;
      
      if (hasVi || hasEn || hasJa) {
        const localeValue = value as Record<Locale, string>;
        const viText = (localeValue.vi || '').trim();
        const enText = (localeValue.en || '').trim();
        const jaText = (localeValue.ja || '').trim();
        
        // Chỉ xử lý nếu ngôn ngữ nguồn đã chọn có nội dung
        const sourceText = (localeValue[sourceLang] || '').trim();
        if (!sourceText) {
          // Bỏ qua field này nếu không có nội dung ở ngôn ngữ nguồn
          continue;
        }
        
        // Kiểm tra xem có ngôn ngữ nào còn thiếu không (dựa trên source language đã chọn)
        const needsTranslation = (
          (sourceLang === 'vi' && (!enText || !jaText)) ||
          (sourceLang === 'en' && (!viText || !jaText)) ||
          (sourceLang === 'ja' && (!viText || !enText))
        );
        
        if (needsTranslation) {
          // Tạo nested structure trong targetObj
          const keys = currentPath.split('.');
          let current: any = targetObj;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          // Lưu source text (chỉ lấy text từ source language)
          current[keys[keys.length - 1]] = localeValue[sourceLang];
        }
      } else {
        // Đệ quy tìm trong nested objects (không phải locale object)
        buildSimpleTranslationObject(value, sourceLang, allSkipFields, currentPath, targetObj);
      }
    } else if (Array.isArray(value)) {
      // Xử lý arrays
      value.forEach((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          // Nested object trong array
          buildSimpleTranslationObject(item, sourceLang, allSkipFields, `${currentPath}.${index}`, targetObj);
        } else if (typeof item === 'string' && item.trim()) {
          // String trong array
          const keys = `${currentPath}.${index}`.split('.');
          let current: any = targetObj;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              // Nếu là index số, tạo array
              if (!isNaN(Number(keys[i]))) {
                if (!Array.isArray(current)) current = [];
                while (current.length <= Number(keys[i])) current.push(null);
                current[Number(keys[i])] = {};
              } else {
                current[keys[i]] = {};
              }
            }
            current = current[keys[i]];
          }
          
          const lastKey = keys[keys.length - 1];
          if (!isNaN(Number(lastKey))) {
            if (!Array.isArray(current)) current = [];
            while (current.length <= Number(lastKey)) current.push(null);
            current[Number(lastKey)] = item.trim();
          } else {
            current[lastKey] = item.trim();
          }
        }
      });
    }
  }
  
  return targetObj;
}

/**
 * Xác định các ngôn ngữ còn thiếu cho một value
 * Chỉ trả về các ngôn ngữ thực sự còn thiếu (chưa có giá trị)
 */
function getMissingLanguages(value: any, sourceLang: Locale): Locale[] {
  const allLangs: Locale[] = ['vi', 'en', 'ja'];
  const missing: Locale[] = [];
  
  if (typeof value === 'string' && value.trim()) {
    // String cần dịch sang tất cả các ngôn ngữ khác
    return allLangs.filter(lang => lang !== sourceLang);
  }
  
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('vi' in value || 'en' in value || 'ja' in value) {
      const localeValue = value as Record<Locale, string>;
      const sourceText = (localeValue[sourceLang] || '').trim();
      if (sourceText) {
        // Chỉ dịch sang các ngôn ngữ còn thiếu (chưa có giá trị hoặc rỗng)
        allLangs.forEach(lang => {
          if (lang !== sourceLang) {
            const existingValue = localeValue[lang];
            if (!existingValue || typeof existingValue !== 'string' || !existingValue.trim()) {
              missing.push(lang);
            }
          }
        });
      }
    }
  }
  
  return missing;
}

/**
 * Kiểm tra xem một ngôn ngữ có thiếu trong value không
 */
function isLanguageMissing(value: any, lang: Locale, sourceLang: Locale): boolean {
  if (typeof value === 'string' && value.trim()) {
    // String cần dịch sang tất cả các ngôn ngữ khác
    return lang !== sourceLang;
  }
  
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if ('vi' in value || 'en' in value || 'ja' in value) {
      const localeValue = value as Record<Locale, string>;
      const sourceText = (localeValue[sourceLang] || '').trim();
      if (sourceText) {
        const existingValue = localeValue[lang];
        return !existingValue || typeof existingValue !== 'string' || !existingValue.trim();
      }
    }
  }
  
  return false;
}

/**
 * Apply translations to data
 * Áp dụng logic từ extractAndUpdate trong home/page.tsx
 * CHỈ cập nhật các ngôn ngữ còn thiếu, không ghi đè các ngôn ngữ đã có
 * Giữ nguyên các giá trị đã có trong originalValue
 */
/**
 * Helper function to convert object with numeric keys to array
 * Example: { "0": {...}, "1": {...} } => [{...}, {...}]
 */
function normalizeToArray(obj: any): any {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const keys = Object.keys(obj);
  // Check if all keys are numeric (representing array indices)
  const allNumericKeys = keys.every(key => /^\d+$/.test(key));
  
  if (allNumericKeys && keys.length > 0) {
    // Convert to array
    const maxIndex = Math.max(...keys.map(k => parseInt(k)));
    const arr: any[] = [];
    for (let i = 0; i <= maxIndex; i++) {
      arr[i] = obj[String(i)] !== undefined ? obj[String(i)] : null;
    }
    return arr;
  }
  
  return obj;
}

export function applySimpleTranslations(
  originalData: any,
  translatedData: any,
  sourceLang: Locale,
  targetLangs: Locale[],
  path: string = ''
): any {
  if (!originalData || typeof originalData !== 'object') return originalData;
  if (!translatedData || typeof translatedData !== 'object') return originalData;
  
  const result = JSON.parse(JSON.stringify(originalData)); // Deep clone
  
  // Normalize translatedData: convert objects with numeric keys to arrays
  const normalizedTranslatedData = normalizeToArray(translatedData);
  
  // Xử lý arrays
  if (Array.isArray(normalizedTranslatedData)) {
    if (Array.isArray(result)) {
      normalizedTranslatedData.forEach((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return;
        
        // Kiểm tra nếu item là locale object
        const hasVi = 'vi' in item;
        const hasEn = 'en' in item;
        const hasJa = 'ja' in item;
        
        if (hasVi || hasEn || hasJa) {
          // Đây là locale object trong array
          if (index < result.length && result[index]) {
            const originalItem = result[index];
            const translatedValue = item as Record<Locale, string>;
            
            // Lấy originalValue từ result[index]
            let originalLocaleValue: Record<Locale, string> | null = null;
            if (typeof originalItem === 'string' && originalItem.trim()) {
              // Nếu là string, convert thành locale object
              originalLocaleValue = {
                vi: sourceLang === 'vi' ? originalItem.trim() : '',
                en: sourceLang === 'en' ? originalItem.trim() : '',
                ja: sourceLang === 'ja' ? originalItem.trim() : ''
              };
            } else if (originalItem && typeof originalItem === 'object' && !Array.isArray(originalItem)) {
              if ('vi' in originalItem || 'en' in originalItem || 'ja' in originalItem) {
                originalLocaleValue = originalItem as Record<Locale, string>;
              } else {
                // Không phải locale object, đệ quy
                result[index] = applySimpleTranslations(originalItem, item, sourceLang, targetLangs, `${path}[${index}]`);
                return;
              }
            }
            
            // Chỉ xử lý nếu có originalLocaleValue
            if (originalLocaleValue) {
              // Tạo locale object mới, giữ nguyên các giá trị đã có
              const newLocaleValue: Record<Locale, string> = {
                vi: (originalLocaleValue.vi || '').trim() || '',
                en: (originalLocaleValue.en || '').trim() || '',
                ja: (originalLocaleValue.ja || '').trim() || ''
              };
              
              // Cập nhật các ngôn ngữ còn thiếu từ translated value
              // CHỈ cập nhật nếu chưa có giá trị trong originalValue
              if (translatedValue.vi && typeof translatedValue.vi === 'string' && !newLocaleValue.vi) {
                newLocaleValue.vi = translatedValue.vi.trim();
              }
              if (translatedValue.en && typeof translatedValue.en === 'string' && !newLocaleValue.en) {
                newLocaleValue.en = translatedValue.en.trim();
              }
              if (translatedValue.ja && typeof translatedValue.ja === 'string' && !newLocaleValue.ja) {
                newLocaleValue.ja = translatedValue.ja.trim();
              }
              
              // Cập nhật vào result
              result[index] = newLocaleValue;
            }
          }
        } else {
          // Nested object trong array - đệ quy
          if (index < result.length) {
            result[index] = applySimpleTranslations(result[index], item, sourceLang, targetLangs, `${path}[${index}]`);
          }
        }
      });
    }
    return result;
  }
  
  // Xử lý objects
  for (const [key, translatedValue] of Object.entries(normalizedTranslatedData)) {
    if (!(key in result)) continue;
    
    const originalValue = result[key];
    const currentPath = path ? `${path}.${key}` : key;
    
    // Normalize nested translatedValue if it's an object with numeric keys
    const normalizedTranslatedValue = normalizeToArray(translatedValue);
    
    // Nếu normalizedTranslatedValue là array và originalValue cũng là array, xử lý như array
    if (Array.isArray(normalizedTranslatedValue) && Array.isArray(originalValue)) {
      result[key] = applySimpleTranslations(originalValue, normalizedTranslatedValue, sourceLang, targetLangs, currentPath);
      continue;
    }
    
    if (normalizedTranslatedValue && typeof normalizedTranslatedValue === 'object' && !Array.isArray(normalizedTranslatedValue)) {
      // Kiểm tra nếu value là locale object (có vi, en, ja)
      const hasVi = 'vi' in normalizedTranslatedValue;
      const hasEn = 'en' in normalizedTranslatedValue;
      const hasJa = 'ja' in normalizedTranslatedValue;
      
      if (hasVi || hasEn || hasJa) {
        // Đây là locale object - cần cập nhật
        const translatedLocaleValue = normalizedTranslatedValue as Record<Locale, string>;
        
        // Lấy originalValue
        let originalLocaleValue: Record<Locale, string>;
        if (typeof originalValue === 'string' && originalValue.trim()) {
          // Nếu là string, convert thành locale object
          originalLocaleValue = {
            vi: sourceLang === 'vi' ? originalValue.trim() : '',
            en: sourceLang === 'en' ? originalValue.trim() : '',
            ja: sourceLang === 'ja' ? originalValue.trim() : ''
          };
        } else if (originalValue && typeof originalValue === 'object' && !Array.isArray(originalValue)) {
          if ('vi' in originalValue || 'en' in originalValue || 'ja' in originalValue) {
            originalLocaleValue = originalValue as Record<Locale, string>;
          } else {
            // Không phải locale object, đệ quy
            result[key] = applySimpleTranslations(originalValue, normalizedTranslatedValue, sourceLang, targetLangs, currentPath);
            continue;
          }
        } else {
          // Không phải string hoặc locale object, skip
          continue;
        }
        
        // Tạo locale object mới, giữ nguyên các giá trị đã có
        const newLocaleValue: Record<Locale, string> = {
          vi: (originalLocaleValue.vi || '').trim() || '',
          en: (originalLocaleValue.en || '').trim() || '',
          ja: (originalLocaleValue.ja || '').trim() || ''
        };
        
        // Cập nhật các ngôn ngữ còn thiếu từ translated value
        // CHỈ cập nhật nếu chưa có giá trị trong originalValue
        if (translatedLocaleValue.vi && typeof translatedLocaleValue.vi === 'string' && !newLocaleValue.vi) {
          newLocaleValue.vi = translatedLocaleValue.vi.trim();
        }
        if (translatedLocaleValue.en && typeof translatedLocaleValue.en === 'string' && !newLocaleValue.en) {
          newLocaleValue.en = translatedLocaleValue.en.trim();
        }
        if (translatedLocaleValue.ja && typeof translatedLocaleValue.ja === 'string' && !newLocaleValue.ja) {
          newLocaleValue.ja = translatedLocaleValue.ja.trim();
        }
        
        // Cập nhật vào result
        result[key] = newLocaleValue;
      } else {
        // Không phải locale object - đệ quy tìm tiếp
        if (originalValue && typeof originalValue === 'object' && !Array.isArray(originalValue)) {
          result[key] = applySimpleTranslations(originalValue, normalizedTranslatedValue, sourceLang, targetLangs, currentPath);
        }
      }
    } else if (Array.isArray(normalizedTranslatedValue)) {
      // Array - đệ quy
      if (Array.isArray(originalValue)) {
        result[key] = applySimpleTranslations(originalValue, normalizedTranslatedValue, sourceLang, targetLangs, currentPath);
      }
    }
  }
  
  return result;
}

/**
 * Kiểm tra xem data có chứa nội dung ở ngôn ngữ nguồn không
 * Cải thiện để check chính xác hơn với các trường hợp edge cases
 */
export function checkHasSourceLanguageContent(data: any, sourceLang: Locale): boolean {
  if (!data || typeof data !== 'object') return false;
  
  // Các field không cần dịch (giữ nguyên hoàn toàn)
  const skipFields = ['image', 'link', 'href', 'url', 'icon', 'gradient', 'color', 
                     'partners', 'heroImage', 'backgroundImage', 'imageUrl', 'slug',
                     'id', 'sortOrder', 'isActive', 'iconName', 'rating', 'type', 'imageSide',
                     'buttonLink', 'imageSide', 'stepId', 'iconSize', 'backgroundColor',
                     'avatar', 'iconGradient', 'email', 'phone', 'year', 'icon',
                     'createdAt', 'updatedAt', 'created_at', 'updated_at']; // Metadata fields không cần dịch
  
  // Các field đặc biệt: tên field không dịch nhưng cần đệ quy vào trong để kiểm tra các field con
  const specialFields = ['button', 'buttons', 'header', 'steps', 'items', 'stats', 'contacts', 'colors'];
  
  for (const [key, value] of Object.entries(data)) {
    // Skip các field không cần dịch
    if (skipFields.includes(key)) continue;
    
    // Các field đặc biệt: đệ quy vào trong để kiểm tra các field con
    if (specialFields.includes(key)) {
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          // Array - đệ quy vào từng item
          for (const item of value) {
            if (item === null || item === undefined) continue;
            if (checkHasSourceLanguageContent(item, sourceLang)) {
              return true;
            }
          }
        } else {
          // Object - đệ quy vào trong
          if (checkHasSourceLanguageContent(value, sourceLang)) {
            return true;
          }
        }
      }
      continue;
    }
    
    // Check string values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed && trimmed.length > 0) {
        return true;
      }
      continue;
    }
    
    // Check locale objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Kiểm tra nếu là locale object (có các key vi, en, ja)
      if ('vi' in value || 'en' in value || 'ja' in value) {
        const localeValue = value as Record<Locale, string>;
        const sourceText = localeValue[sourceLang];
        if (sourceText && typeof sourceText === 'string' && sourceText.trim().length > 0) {
          return true;
        }
      } else {
        // Nested object - đệ quy kiểm tra
        if (checkHasSourceLanguageContent(value, sourceLang)) {
          return true;
        }
      }
    } else if (Array.isArray(value)) {
      // Kiểm tra trong arrays
      for (const item of value) {
        if (item === null || item === undefined) continue;
        
        // Nếu item là string
        if (typeof item === 'string' && item.trim().length > 0) {
          return true;
        }
        
        // Nếu item là locale object
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          if ('vi' in item || 'en' in item || 'ja' in item) {
            const localeValue = item as Record<Locale, string>;
            const sourceText = localeValue[sourceLang];
            if (sourceText && typeof sourceText === 'string' && sourceText.trim().length > 0) {
              return true;
            }
          } else {
            // Nested object trong array
            if (checkHasSourceLanguageContent(item, sourceLang)) {
              return true;
            }
          }
        }
      }
    }
  }
  
  return false;
}

/**
 * Thu thập tất cả target languages cần dịch từ data
 * Chỉ trả về các ngôn ngữ còn thiếu trong các fields cần dịch
 * Áp dụng logic từ handleTranslateAll trong home/page.tsx
 */
export function collectTargetLanguages(
  data: any,
  sourceLang: Locale,
  skipFields: string[] = []
): Locale[] {
  const allTargetLangs = new Set<Locale>();
  
  const defaultSkipFields = [
    'image', 'link', 'href', 'url', 'icon', 'gradient', 'color',
    'partners', 'heroImage', 'backgroundImage', 'imageUrl', 'slug',
    'id', 'sortOrder', 'isActive', 'iconName', 'rating', 'type',
    'imageSide', 'buttonLink', 'stepId', 'iconSize', 'backgroundColor',
    'avatar', 'iconGradient', 'email', 'phone', 'year', 'icon',
    'createdAt', 'updatedAt', 'created_at', 'updated_at' // Metadata fields không cần dịch
  ];
  
  const allSkipFields = [...defaultSkipFields, ...skipFields];
  
  const collectRecursive = (obj: any): void => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const [key, value] of Object.entries(obj)) {
      if (allSkipFields.includes(key)) continue;
      
      if (typeof value === 'string' && value.trim()) {
        // String cần dịch sang tất cả các ngôn ngữ khác
        const allLangs: Locale[] = ['vi', 'en', 'ja'];
        allLangs.forEach(lang => {
          if (lang !== sourceLang) {
            allTargetLangs.add(lang);
          }
        });
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Kiểm tra nếu là locale object
        if ('vi' in value || 'en' in value || 'ja' in value) {
          const localeValue = value as Record<Locale, string>;
          const viText = (localeValue.vi || '').trim();
          const enText = (localeValue.en || '').trim();
          const jaText = (localeValue.ja || '').trim();
          
          // Chỉ xử lý nếu ngôn ngữ nguồn đã chọn có nội dung
          const sourceText = (localeValue[sourceLang] || '').trim();
          if (sourceText) {
            // Thêm tất cả ngôn ngữ khác source vào target languages nếu chúng còn thiếu
            if (sourceLang !== 'vi' && !viText) allTargetLangs.add('vi');
            if (sourceLang !== 'en' && !enText) allTargetLangs.add('en');
            if (sourceLang !== 'ja' && !jaText) allTargetLangs.add('ja');
          }
        } else {
          // Nested object - đệ quy
          collectRecursive(value);
        }
      } else if (Array.isArray(value)) {
        // Array
        value.forEach((item) => {
          if (item === null || item === undefined) return;
          
          if (typeof item === 'string' && item.trim()) {
            // String trong array
            const allLangs: Locale[] = ['vi', 'en', 'ja'];
            allLangs.forEach(lang => {
              if (lang !== sourceLang) {
                allTargetLangs.add(lang);
              }
            });
          } else if (item && typeof item === 'object' && !Array.isArray(item)) {
            if ('vi' in item || 'en' in item || 'ja' in item) {
              const localeValue = item as Record<Locale, string>;
              const viText = (localeValue.vi || '').trim();
              const enText = (localeValue.en || '').trim();
              const jaText = (localeValue.ja || '').trim();
              
              const sourceText = (localeValue[sourceLang] || '').trim();
              if (sourceText) {
                if (sourceLang !== 'vi' && !viText) allTargetLangs.add('vi');
                if (sourceLang !== 'en' && !enText) allTargetLangs.add('en');
                if (sourceLang !== 'ja' && !jaText) allTargetLangs.add('ja');
              }
            } else {
              // Nested object trong array
              collectRecursive(item);
            }
          }
        });
      }
    }
  };
  
  collectRecursive(data);
  
  return Array.from(allTargetLangs);
}

/**
 * Lấy danh sách target languages (tất cả trừ source)
 * @deprecated Sử dụng collectTargetLanguages để chỉ dịch các ngôn ngữ còn thiếu
 */
export function getTargetLanguages(sourceLang: Locale): Locale[] {
  const allLangs: Locale[] = ['vi', 'en', 'ja'];
  return allLangs.filter(lang => lang !== sourceLang);
}

/**
 * Lấy tên ngôn ngữ
 */
export function getLanguageName(locale: Locale): string {
  const names: Record<Locale, string> = {
    vi: 'Tiếng Việt',
    en: 'English',
    ja: '日本語'
  };
  return names[locale];
}


