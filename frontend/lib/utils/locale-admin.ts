type Locale = 'vi' | 'en' | 'ja';

/**
 * Normalize value: Convert string to locale object nếu cần
 * Dùng khi load data từ API để đảm bảo luôn có format locale object
 */
export function normalizeLocaleValue(
  value: string | Record<Locale, string> | undefined | null,
  defaultValue: string = ''
): Record<Locale, string> {
  if (!value) {
    return { vi: defaultValue, en: '', ja: '' };
  }
  
  if (typeof value === 'string') {
    return { vi: value, en: '', ja: '' };
  }
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Kiểm tra xem có phải là locale object không (có các key vi, en, ja)
    const hasLocaleKeys = 'vi' in value || 'en' in value || 'ja' in value;
    
    if (hasLocaleKeys) {
      // Đảm bảo mỗi giá trị là string, không phải object
      const vi = value.vi;
      const en = value.en;
      const ja = value.ja;
      
      return {
        vi: (typeof vi === 'string' ? vi : (vi ? String(vi) : defaultValue)),
        en: (typeof en === 'string' ? en : (en ? String(en) : '')),
        ja: (typeof ja === 'string' ? ja : (ja ? String(ja) : ''))
      };
    }
    
    // Nếu không phải locale object, trả về default
    return { vi: defaultValue, en: '', ja: '' };
  }
  
  return { vi: defaultValue, en: '', ja: '' };
}

/**
 * Get value for display/edit (luôn trả về locale object)
 * Hỗ trợ nested path như 'title.line1' hoặc 'primaryButton.text'
 */
export function getLocaleValue(
  data: any,
  path: string,
  defaultValue: string = ''
): Record<Locale, string> {
  if (!data) {
    return { vi: defaultValue, en: '', ja: '' };
  }
  
  // Nếu path rỗng, trả về normalize của chính data
  if (!path || path === '') {
    return normalizeLocaleValue(data, defaultValue);
  }
  
  const keys = path.split('.');
  let current: any = data;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && !Array.isArray(current) && key in current) {
      current = current[key];
    } else {
      return { vi: defaultValue, en: '', ja: '' };
    }
  }
  
  return normalizeLocaleValue(current, defaultValue);
}

/**
 * Set locale value vào nested object
 * Tạo nested structure nếu chưa có
 * Hỗ trợ arrays (ví dụ: slides.0.title)
 */
export function setLocaleValue(
  data: any,
  path: string,
  value: Record<Locale, string>
): any {
  if (!data) {
    data = {};
  }
  
  const keys = path.split('.');
  const newData = JSON.parse(JSON.stringify(data)); // Deep clone
  let current: any = newData;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const isArrayIndex = !isNaN(Number(key));
    
    if (isArrayIndex) {
      // Xử lý array index
      const index = Number(key);
      if (!Array.isArray(current)) {
        // Nếu current không phải array, tạo array mới
        current = [];
      }
      // Đảm bảo array đủ dài
      while (current.length <= index) {
        current.push(null);
      }
      // Nếu phần tử tại index chưa có hoặc không phải object, tạo object mới
      if (!current[index] || typeof current[index] !== 'object' || Array.isArray(current[index])) {
        current[index] = {};
      }
      current = current[index];
    } else {
      // Xử lý object key
      if (!current[key]) {
        // Kiểm tra key tiếp theo có phải là array index không
        const nextKey = keys[i + 1];
        const nextIsArrayIndex = !isNaN(Number(nextKey));
        current[key] = nextIsArrayIndex ? [] : {};
      } else if (Array.isArray(current[key])) {
        // Nếu đã là array, giữ nguyên
        // Không làm gì, chỉ cần current = current[key]
      } else if (typeof current[key] !== 'object') {
        // Nếu không phải object, tạo object mới
        current[key] = {};
      }
      current = current[key];
    }
  }
  
  // Set value vào key cuối cùng
  const lastKey = keys[keys.length - 1];
  const lastIsArrayIndex = !isNaN(Number(lastKey));
  
  if (lastIsArrayIndex) {
    // Nếu key cuối là array index, không nên xảy ra (vì value phải là locale object, không phải array item)
    // Nhưng để an toàn, vẫn xử lý
    const index = Number(lastKey);
    if (!Array.isArray(current)) {
      current = [];
    }
    while (current.length <= index) {
      current.push(null);
    }
    current[index] = value;
  } else {
    current[lastKey] = value;
  }
  
  return newData;
}

/**
 * Check xem field có cần dịch không
 * Các field không cần dịch: image, link, href, url, slug, id, etc.
 */
export function isTranslatableField(fieldName: string): boolean {
  const nonTranslatableFields = [
    'demolinktype', 'demo_link_type', // Added demoLinkType
    // Icon fields
    'icon', 'iconname',
    // Link fields
    'link', 'href', 'url', 'buttonlink', 'contentbuttonlink', 'contactbuttonlink', 
    'primarybuttonlink', 'secondarybuttonlink', 'demolink',
    // Color/Gradient fields
    'gradient', 'color', 'backgroundcolor', 'backgroundgradient',
    // Image fields
    'image', 'imageurl', 'backgroundimage', 'heroimage', 'contentimage', 'contactimage',
    // Path/Route fields
    'path', 'route', 'slug',
    // Other non-translatable fields
    'slug', 'id', 'sortorder', 'isactive', 'categoryid',
    'publisheddate', 'publishedat', 'author', 'readtime', 'status',
    'partners', 'galleryimages', 'galleryposition', 'showtableofcontents',
    'enablesharebuttons', 'showauthorbox', 'contentmode',
    'statsusers', 'statsrating', 'statsdeploy', 'pricing',
    'badge', 'features', 'createdat', 'updatedat',
    // Contact/Office fields (email, phone, address, city are not translatable)
    'email', 'phone', 'address', 'city', 'iframe', 'iframesrc'
  ];
  
  const lowerFieldName = fieldName.toLowerCase();
  // Kiểm tra nếu field name chứa các từ khóa không cần dịch
  const containsNonTranslatable = nonTranslatableFields.some(field => 
    lowerFieldName.includes(field) || field.includes(lowerFieldName)
  );
  
  return !containsNonTranslatable && !nonTranslatableFields.includes(lowerFieldName);
}

/**
 * Kiểm tra xem một value đã là locale object chưa
 */
function isLocaleObject(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  // Kiểm tra xem có các key vi, en, ja không
  const hasLocaleKeys = 'vi' in value || 'en' in value || 'ja' in value;
  // Kiểm tra xem các giá trị có phải là string không (hoặc có thể là rỗng)
  if (hasLocaleKeys) {
    const keys = Object.keys(value);
    // Nếu chỉ có các key locale (vi, en, ja) và không có key khác, thì là locale object
    const localeKeys = ['vi', 'en', 'ja'];
    const allKeysAreLocale = keys.every(k => localeKeys.includes(k));
    // Kiểm tra thêm: các giá trị phải là string, number, boolean, hoặc null/undefined
    const allValuesArePrimitive = keys.every(k => {
      const val = value[k];
      return val === null || val === undefined || 
             typeof val === 'string' || 
             typeof val === 'number' || 
             typeof val === 'boolean';
    });
    return allKeysAreLocale && allValuesArePrimitive;
  }
  return false;
}

/**
 * Migrate object từ string format sang locale object format
 * Dùng để migrate dữ liệu cũ
 * Normalize cả arrays và nested objects
 */
export function migrateObjectToLocale(obj: any): any {
  if (!obj || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  
  if (typeof obj === 'string') {
    // Thử parse JSON string thành locale object
    try {
      const parsed = JSON.parse(obj);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Kiểm tra xem có phải là locale object không (có các key vi, en, ja)
        const hasLocaleKeys = 'vi' in parsed || 'en' in parsed || 'ja' in parsed;
        if (hasLocaleKeys) {
          // Parse thành locale object với đầy đủ các key
          return {
            vi: parsed.vi || '',
            en: parsed.en || '',
            ja: parsed.ja || '',
          };
        }
      }
    } catch (e) {
      // Không phải JSON string, giữ nguyên string
    }
    // Nếu không parse được hoặc không phải locale object, giữ nguyên string
    return obj;
  }
  
  // Nếu đã là locale object, giữ nguyên
  if (isLocaleObject(obj)) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        // String trong array - convert thành locale object
        return { vi: item, en: '', ja: '' };
      }
      // Nếu đã là locale object, giữ nguyên
      if (isLocaleObject(item)) {
        return item;
      }
      return migrateObjectToLocale(item);
    });
  }
  
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip các field không cần dịch
    if (!isTranslatableField(key)) {
      result[key] = value;
      continue;
    }
    
    // Nếu đã là locale object, giữ nguyên
    if (isLocaleObject(value)) {
      result[key] = value;
    } else if (typeof value === 'string') {
      // Chỉ migrate các field text (string) và có thể dịch được
      result[key] = { vi: value, en: '', ja: '' };
    } else if (Array.isArray(value)) {
      // Normalize arrays
      result[key] = value.map(item => {
        if (typeof item === 'string') {
          return { vi: item, en: '', ja: '' };
        }
        // Nếu đã là locale object, giữ nguyên
        if (isLocaleObject(item)) {
          return item;
        }
        return migrateObjectToLocale(item);
      });
    } else if (typeof value === 'object' && value !== null) {
      // Recursively migrate nested objects
      result[key] = migrateObjectToLocale(value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

