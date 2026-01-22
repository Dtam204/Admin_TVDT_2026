type Locale = 'vi' | 'en' | 'ja';

/**
 * Lấy text từ field có thể là string hoặc object locale
 * @param field - Có thể là string (backward compatible), JSON string, hoặc object {vi, en, ja}
 * @param locale - Locale hiện tại
 * @param fallback - Fallback nếu không tìm thấy
 */
export function getLocalizedText(
  field: string | Record<Locale, string> | undefined,
  locale: Locale = 'vi',
  fallback: string = ''
): string {
  if (!field) return fallback;
  
  // Nếu là string, kiểm tra xem có phải JSON string không
  if (typeof field === 'string') {
    // Try to parse as JSON (could be a JSON string representing locale object)
    try {
      const parsed = JSON.parse(field);
      if (parsed && typeof parsed === 'object' && ('vi' in parsed || 'en' in parsed || 'ja' in parsed)) {
        // It's a JSON string representing a locale object, recurse with parsed object
        return getLocalizedText(parsed, locale, fallback);
      }
    } catch (e) {
      // Not JSON, treat as regular string
    }
    // Return as regular string
    return field;
  }
  
  // Nếu là object locale
  if (typeof field === 'object') {
    // Ưu tiên locale hiện tại
    if (field[locale]) return field[locale];
    
    // Fallback theo thứ tự: vi -> en -> ja
    if (field.vi) return field.vi;
    if (field.en) return field.en;
    if (field.ja) return field.ja;
    
    // Nếu không có gì, lấy giá trị đầu tiên
    const firstValue = Object.values(field)[0];
    return typeof firstValue === 'string' ? firstValue : fallback;
  }
  
  return fallback;
}

/**
 * Lấy nested object theo locale
 * Ví dụ: getLocalizedData(data.title, 'en')
 */
export function getLocalizedData<T>(
  data: T | Record<Locale, T> | undefined,
  locale: Locale = 'vi'
): T | undefined {
  if (!data) return undefined;
  
  // Nếu là object locale
  if (typeof data === 'object' && !Array.isArray(data)) {
    if ('vi' in data || 'en' in data || 'ja' in data) {
      return (data as Record<Locale, T>)[locale] || (data as Record<Locale, T>).vi;
    }
  }
  
  return data as T;
}

/**
 * Recursively apply locale to entire object
 * Chuyển đổi tất cả các field có locale object thành string theo locale hiện tại
 * Xử lý đệ quy tất cả nested objects và arrays
 */
export function applyLocale<T extends Record<string, any>>(
  data: T,
  locale: Locale = 'vi'
): T {
  if (!data || typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  // Nếu là array, xử lý từng item
  if (Array.isArray(data)) {
    return data.map(item => {
      if (item === null || item === undefined) return item;
      
      // Nếu item là locale object {vi, en, ja}
      if (typeof item === 'object' && !Array.isArray(item)) {
        if ('vi' in item || 'en' in item || 'ja' in item) {
          return getLocalizedText(item as any, locale);
        }
        // Nếu là nested object, đệ quy
        return applyLocale(item, locale);
      }
      
      // Nếu là array, đệ quy
      if (Array.isArray(item)) {
        return applyLocale(item, locale);
      }
      
      return item;
    }) as any;
  }
  
  // Nếu không phải object, trả về nguyên bản
  if (typeof data !== 'object') {
    return data;
  }
  
  const result: any = { ...data };
  
  // Danh sách các field không cần dịch (giữ nguyên)
  // Các field này có thể chứa nested objects nhưng không cần xử lý locale
  const nonTranslatableFields = [
    'image', 'link', 'href', 'url', 'icon', 'gradient', 'color', 
    'partners', 'heroImage', 'backgroundImage', 'imageUrl', 'slug',
    'id', 'sortOrder', 'isActive', 'createdAt', 'updatedAt',
    'iconName', 'rating', 'type', 'imageSide', 'buttonLink',
    'author'
  ];
  
  // Các field đặc biệt: có thể chứa nested objects cần xử lý locale
  // Nhưng field name không cần dịch
  const specialFields = ['button', 'buttons'];
  
  for (const [key, value] of Object.entries(result)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    // Skip non-translatable fields (giữ nguyên hoàn toàn)
    if (nonTranslatableFields.includes(key)) {
      continue;
    }
    
    // Xử lý special fields: field name không dịch nhưng nested content cần dịch
    if (specialFields.includes(key)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        result[key] = applyLocale(value, locale);
      } else if (Array.isArray(value)) {
        result[key] = value.map(item => {
          if (item && typeof item === 'object') {
            return applyLocale(item, locale);
          }
          return item;
        });
      }
      continue;
    }
    
    // Nếu là locale object {vi, en, ja}
    if (typeof value === 'object' && !Array.isArray(value)) {
      if ('vi' in value || 'en' in value || 'ja' in value) {
        result[key] = getLocalizedText(value as any, locale);
      } else {
        // Recursively process nested objects
        result[key] = applyLocale(value, locale);
      }
    } 
    // Nếu là array
    else if (Array.isArray(value)) {
      result[key] = value.map(item => {
        if (item === null || item === undefined) return item;
        
        // Nếu item là string, kiểm tra xem có phải JSON string không
        if (typeof item === 'string') {
          return getLocalizedText(item, locale);
        }
        
        // Nếu item là locale object
        if (typeof item === 'object' && !Array.isArray(item)) {
          if ('vi' in item || 'en' in item || 'ja' in item) {
            return getLocalizedText(item as any, locale);
          }
          // Nếu là nested object, đệ quy
          return applyLocale(item, locale);
        }
        
        // Nếu item là array, đệ quy
        if (Array.isArray(item)) {
          return applyLocale(item, locale);
        }
        
        return item;
      });
    }
  }
  
  return result as T;
}

/**
 * Kiểm tra xem một value có phải là locale object không
 */
export function isLocaleObject(value: any): value is Record<Locale, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  
  return 'vi' in value || 'en' in value || 'ja' in value;
}

/**
 * Chuyển đổi string thành locale object (để migrate dữ liệu cũ)
 */
export function stringToLocaleObject(text: string): Record<Locale, string> {
  return {
    vi: text,
    en: '',
    ja: ''
  };
}

