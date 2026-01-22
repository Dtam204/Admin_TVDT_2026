'use client';

import { useState, useEffect } from 'react';
import { Loader2, Globe, ChevronDown, ArrowRight } from 'lucide-react';
import { adminApiCall } from '@/lib/api/admin';
import { AdminEndpoints } from '@/lib/api/admin/endpoints';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Locale = 'vi' | 'en' | 'ja';
type AIProvider = 'openai' | 'gemini';

interface LocaleInputProps {
  value: string | Record<Locale, string>;
  onChange: (value: Record<Locale, string>) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  defaultLocale?: Locale; // Prop để đồng bộ với global locale selector
  aiProvider?: AIProvider; // AI provider để sử dụng cho dịch thuật
}

const LOCALE_OPTIONS: Array<{ value: Locale; label: string; flag: string }> = [
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
];

export function LocaleInput({ 
  value, 
  onChange, 
  label, 
  placeholder = '',
  multiline = false,
  className = '',
  defaultLocale = 'vi',
  aiProvider = 'openai' // Mặc định sử dụng OpenAI
}: LocaleInputProps) {
  const [translating, setTranslating] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(defaultLocale);
  const [sourceLocale, setSourceLocale] = useState<Locale>('vi'); // Ngôn ngữ nguồn để dịch
  
  // Đồng bộ selectedLocale với defaultLocale khi defaultLocale thay đổi
  useEffect(() => {
    setSelectedLocale(defaultLocale);
  }, [defaultLocale]);
  
  // Convert value to locale object format
  // Đảm bảo tất cả giá trị đều là string, không phải object
  const currentValue: Record<Locale, string> = (() => {
    if (typeof value === 'string') {
      return { vi: value, en: '', ja: '' };
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Kiểm tra xem có phải là locale object không (có các key vi, en, ja)
      const hasLocaleKeys = 'vi' in value || 'en' in value || 'ja' in value;
      
      if (hasLocaleKeys) {
        // Đảm bảo mỗi giá trị là string, không phải object nested
        const vi = value.vi;
        const en = value.en;
        const ja = value.ja;
        
        // Helper để convert giá trị thành string an toàn
        const safeString = (val: any): string => {
          if (val === null || val === undefined) return '';
          if (typeof val === 'string') return val;
          if (typeof val === 'number' || typeof val === 'boolean') return String(val);
          // Nếu là object, không convert thành "[object Object]", trả về rỗng
          if (typeof val === 'object') return '';
          return String(val);
        };
        
        return {
          vi: safeString(vi),
          en: safeString(en),
          ja: safeString(ja)
        };
      }
      
      // Nếu không phải locale object, trả về rỗng
      return { vi: '', en: '', ja: '' };
    }
    return { vi: '', en: '', ja: '' };
  })();
  
  const handleChange = (locale: Locale, text: string) => {
    onChange({
      ...currentValue,
      [locale]: text
    });
  };
  
  // Dịch từ ngôn ngữ nguồn sang ngôn ngữ đang được chọn
  const handleTranslateSingle = async () => {
    // Kiểm tra source language có nội dung không
    if (!currentValue[sourceLocale]?.trim()) {
      alert(`Vui lòng nhập nội dung ${LOCALE_OPTIONS.find(opt => opt.value === sourceLocale)?.label} trước khi dịch`);
      return;
    }
    
    // Không cho dịch nếu source và target giống nhau
    if (selectedLocale === sourceLocale) {
      alert('Ngôn ngữ nguồn và ngôn ngữ đích giống nhau, không cần dịch');
      return;
    }
    
    setTranslating(true);
    try {
      const response = await adminApiCall<{ success: boolean; data: Record<Locale, string> }>(
        AdminEndpoints.translate,
        {
          method: 'POST',
          body: JSON.stringify({
            text: currentValue[sourceLocale],
            sourceLang: sourceLocale,
            targetLangs: [selectedLocale], // Chỉ dịch sang ngôn ngữ đang được chọn
            provider: aiProvider // Sử dụng AI provider đã chọn
          })
        }
      );
      
      if (response.success && response.data) {
        const translated = response.data;
        
        // Helper để đảm bảo giá trị luôn là string
        const ensureString = (val: any, fallback: string = ''): string => {
          if (val === null || val === undefined) return fallback;
          if (typeof val === 'string') return val;
          if (typeof val === 'number' || typeof val === 'boolean') return String(val);
          return fallback;
        };
        
        // Chỉ cập nhật ngôn ngữ đang được chọn, giữ nguyên các ngôn ngữ khác
        const newValue: Record<Locale, string> = {
          ...currentValue,
          [selectedLocale]: ensureString(translated?.[selectedLocale], currentValue[selectedLocale] || '')
        };
        
        onChange(newValue);
      } else {
        alert('Dịch thất bại. Vui lòng thử lại.');
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Translation error:', error);
      }
      alert('Lỗi khi dịch: ' + (error?.message || 'Unknown error'));
    } finally {
      setTranslating(false);
    }
  };
  
  // Dịch từ tiếng Việt sang tất cả các ngôn ngữ còn thiếu
  const handleTranslateAll = async () => {
    if (!currentValue.vi.trim()) {
      alert('Vui lòng nhập nội dung tiếng Việt trước khi dịch');
      return;
    }
    
    setTranslating(true);
    try {
      // Xác định các ngôn ngữ còn thiếu
      const missingLangs: Locale[] = [];
      if (!currentValue.en.trim()) missingLangs.push('en');
      if (!currentValue.ja.trim()) missingLangs.push('ja');
      
      if (missingLangs.length === 0) {
        alert('Tất cả các ngôn ngữ đã có nội dung');
        setTranslating(false);
        return;
      }
      
      const response = await adminApiCall<{ success: boolean; data: Record<Locale, string> }>(
        AdminEndpoints.translate,
        {
          method: 'POST',
          body: JSON.stringify({
            text: currentValue.vi,
            sourceLang: 'vi',
            targetLangs: missingLangs, // Chỉ dịch các ngôn ngữ còn thiếu
            provider: aiProvider // Sử dụng AI provider đã chọn
          })
        }
      );
      
      if (response.success && response.data) {
        const translated = response.data;
        
        // Helper để đảm bảo giá trị luôn là string
        const ensureString = (val: any, fallback: string = ''): string => {
          if (val === null || val === undefined) return fallback;
          if (typeof val === 'string') return val;
          if (typeof val === 'number' || typeof val === 'boolean') return String(val);
          return fallback;
        };
        
        // Cập nhật các ngôn ngữ còn thiếu, giữ nguyên các ngôn ngữ đã có
        const newValue: Record<Locale, string> = {
          vi: ensureString(currentValue.vi, ''),
          en: ensureString(translated?.en, currentValue.en || ''),
          ja: ensureString(translated?.ja, currentValue.ja || '')
        };
        
        onChange(newValue);
      } else {
        alert('Dịch thất bại. Vui lòng thử lại.');
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Translation error:', error);
      }
      alert('Lỗi khi dịch: ' + (error?.message || 'Unknown error'));
    } finally {
      setTranslating(false);
    }
  };
  
  // Lấy danh sách các ngôn ngữ có nội dung để làm source
  const availableSourceLocales = LOCALE_OPTIONS.filter(opt => 
    currentValue[opt.value]?.trim() && opt.value !== selectedLocale
  );
  
  const InputComponent = multiline ? 'textarea' : 'input';
  const currentLocaleOption = LOCALE_OPTIONS.find(opt => opt.value === selectedLocale);
  
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header: Label + Status + Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">{label}</label>
          
          {/* Status badges - compact */}
          <div className="flex items-center gap-1.5">
            {LOCALE_OPTIONS.map((option) => {
              const hasContent = currentValue[option.value]?.trim();
              return (
                <span
                  key={option.value}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                    hasContent 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-gray-50 text-gray-400 border border-gray-200'
                  }`}
                  title={hasContent ? `${option.label}: Đã có` : `${option.label}: Chưa có`}
                >
                  <span>{option.flag}</span>
                  {hasContent && <span className="w-1 h-1 rounded-full bg-green-500" />}
                </span>
              );
            })}
          </div>
        </div>
        
        {/* Controls: Language Selector + Translate All */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={selectedLocale} onValueChange={(value) => setSelectedLocale(value as Locale)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gray-500" />
                <SelectValue>
                  {currentLocaleOption && (
                    <span className="flex items-center gap-1">
                      <span>{currentLocaleOption.flag}</span>
                      <span className="truncate hidden sm:inline">{currentLocaleOption.label}</span>
                    </span>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {LOCALE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{option.flag}</span>
                    <span>{option.label}</span>
                    {selectedLocale === option.value && (
                      <span className="ml-auto text-blue-600">✓</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Quick translate all button */}
          {currentValue.vi.trim() && (
            <button
              type="button"
              onClick={handleTranslateAll}
              disabled={translating}
              title="Tự dịch tất cả ngôn ngữ từ nội dung tiếng Việt"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-blue-200 bg-blue-50 text-[11px] font-medium text-blue-600 hover:bg-blue-100 hover:border-blue-300 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {translating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Đang dịch...</span>
                </>
              ) : (
                <>
                  <span className="text-base leading-none">🤖</span>
                  <span className="hidden sm:inline">Tự dịch</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Input field */}
      <div className="space-y-2">
        <InputComponent
          type="text"
          value={currentValue[selectedLocale]}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
            handleChange(selectedLocale, e.target.value)
          }
          placeholder={
            selectedLocale === 'vi' 
              ? (placeholder || 'Nhập nội dung tiếng Việt...')
              : selectedLocale === 'en'
                ? 'English translation...'
                : '日本語の翻訳...'
          }
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={multiline ? 4 : undefined}
        />
        
        {/* Translate controls - below input */}
        {availableSourceLocales.length > 0 && selectedLocale !== sourceLocale && (
          <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-medium">Dịch từ:</span>
              <Select 
                value={sourceLocale} 
                onValueChange={(value) => setSourceLocale(value as Locale)}
              >
                <SelectTrigger className="w-[110px] h-7 text-xs border-gray-200 bg-white hover:bg-gray-50">
                  <SelectValue>
                    {LOCALE_OPTIONS.find(opt => opt.value === sourceLocale) && (
                      <span className="flex items-center gap-1.5">
                        <span>{LOCALE_OPTIONS.find(opt => opt.value === sourceLocale)?.flag}</span>
                        <span className="truncate">{LOCALE_OPTIONS.find(opt => opt.value === sourceLocale)?.label}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableSourceLocales.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.flag}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="flex items-center gap-1">
                <span>{currentLocaleOption?.flag}</span>
                <span className="font-medium">{currentLocaleOption?.label}</span>
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleTranslateSingle}
              disabled={translating}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-blue-200 bg-blue-50 text-xs font-medium text-blue-600 hover:bg-blue-100 hover:border-blue-300 disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {translating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Đang dịch...</span>
                </>
              ) : (
                <>
                  <span>🤖</span>
                  <span>Dịch</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

