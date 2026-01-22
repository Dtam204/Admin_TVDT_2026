import { useState } from 'react';
import { toast } from 'sonner';
import { adminApiCall, AdminEndpoints } from '@/lib/api/admin';
import { 
  buildSimpleTranslationObject, 
  applySimpleTranslations,
  getTargetLanguages,
  collectTargetLanguages,
  getLanguageName,
  checkHasSourceLanguageContent,
  countTranslationFields
} from '@/lib/utils/translation-helpers';

// Export để các component có thể sử dụng để check trước khi render
export { checkHasSourceLanguageContent };

export type Locale = 'vi' | 'en' | 'ja';
export type AIProvider = 'openai' | 'gemini';

interface UseTranslationControlsOptions {
  aiProvider?: AIProvider;
  onTranslateSuccess?: (translatedData: any) => void;
}

/**
 * Hook để quản lý state và logic translation cho admin pages
 */
export function useTranslationControls(options: UseTranslationControlsOptions = {}) {
  const [globalLocale, setGlobalLocale] = useState<Locale>('vi');
  const [aiProvider, setAiProvider] = useState<AIProvider>(options.aiProvider || 'openai');
  const [translatingAll, setTranslatingAll] = useState(false);
  const [translateSourceLang, setTranslateSourceLang] = useState<Locale>('vi');

  /**
   * Hàm dịch một object data
   * @param data - Object chứa dữ liệu cần dịch
   * @param updateCallback - Callback để cập nhật state sau khi dịch thành công
   * @param sectionName - Tên section để hiển thị trong toast (optional)
   */
  const translateData = async (
    data: any,
    updateCallback: (translatedData: any) => void,
    sectionName?: string
  ) => {
    setTranslatingAll(true);
    try {
      // Kiểm tra xem có nội dung để dịch không - check đầu tiên và quan trọng nhất
      const hasContent = checkHasSourceLanguageContent(data, translateSourceLang);
      if (!hasContent) {
        const sourceLangName = getLanguageName(translateSourceLang);
        toast.error(
          sectionName
            ? `⚠️ Không tìm thấy nội dung ${sourceLangName} trong "${sectionName}". Vui lòng nhập nội dung ${sourceLangName} trước khi dịch.`
            : `⚠️ Không tìm thấy nội dung ${sourceLangName} để dịch. Vui lòng nhập nội dung ${sourceLangName} trước.`
        );
        setTranslatingAll(false);
        return;
      }

      // Đếm số lượng fields để hiển thị thông tin chi tiết
      const fieldCounts = countTranslationFields(data, translateSourceLang);
      
      // Build translation object từ data để kiểm tra xem có field nào cần dịch không
      const translationData = buildSimpleTranslationObject(data, translateSourceLang);
      
      // Thu thập target languages từ các fields cần dịch (chỉ các ngôn ngữ còn thiếu)
      const targetLangs = collectTargetLanguages(data, translateSourceLang);
      const sourceLangName = getLanguageName(translateSourceLang);
      const targetLangNames = targetLangs.length > 0 
        ? targetLangs.map(lang => getLanguageName(lang)).join(', ')
        : '';
      
      // Kiểm tra và hiển thị thông báo chi tiết
      if (fieldCounts.needsTranslation === 0) {
        if (fieldCounts.totalFields === 0) {
          // Không có field nào trong form
          toast.warning(
            sectionName
              ? `⚠️ Không có trường nào để dịch trong "${sectionName}"`
              : `⚠️ Không có trường nào để dịch`
          );
        } else if (fieldCounts.alreadyComplete > 0) {
          // Tất cả fields đã có đầy đủ ngôn ngữ
          toast.info(
            sectionName
              ? `ℹ️ Không còn trường nào cần dịch trong "${sectionName}". Tất cả ${fieldCounts.alreadyComplete} trường đã có đầy đủ ngôn ngữ (${sourceLangName}, ${targetLangNames}).`
              : `ℹ️ Không còn trường nào cần dịch. Tất cả ${fieldCounts.alreadyComplete} trường đã có đầy đủ ngôn ngữ.`
          );
        } else if (fieldCounts.skippedEmpty > 0) {
          // Có fields bị bỏ qua vì chưa có nội dung ở ngôn ngữ gốc
          toast.warning(
            sectionName
              ? `⚠️ Không có trường nào cần dịch trong "${sectionName}". ${fieldCounts.skippedEmpty} trường đã được bỏ qua vì chưa có nội dung ${sourceLangName}.`
              : `⚠️ Không có trường nào cần dịch. ${fieldCounts.skippedEmpty} trường đã được bỏ qua vì chưa có nội dung ${sourceLangName}.`
          );
        } else {
          // Trường hợp khác
          toast.info(
            sectionName
              ? `ℹ️ Không còn trường nào cần dịch trong "${sectionName}"`
              : `ℹ️ Không còn trường nào cần dịch`
          );
        }
        setTranslatingAll(false);
        return;
      }
      
      if (targetLangs.length === 0) {
        toast.info(
          sectionName
            ? `ℹ️ Không có ngôn ngữ nào cần dịch trong "${sectionName}". Tất cả các trường đã có đầy đủ ngôn ngữ.`
            : `ℹ️ Không có ngôn ngữ nào cần dịch. Tất cả các trường đã có đầy đủ ngôn ngữ.`
        );
        setTranslatingAll(false);
        return;
      }

      // Hiển thị thông tin chi tiết về số lượng fields sẽ dịch
      let infoMessage = `Đang dịch ${fieldCounts.needsTranslation} trường từ ${sourceLangName} sang các ngôn ngữ còn thiếu...`;
      const details: string[] = [];
      if (fieldCounts.skippedEmpty > 0) {
        details.push(`${fieldCounts.skippedEmpty} trường đã bỏ qua (chưa có nội dung ${sourceLangName})`);
      }
      if (fieldCounts.alreadyComplete > 0) {
        details.push(`${fieldCounts.alreadyComplete} trường đã có đầy đủ ngôn ngữ`);
      }
      if (details.length > 0) {
        infoMessage += ` (${details.join(', ')})`;
      }
      toast.info(infoMessage);

      // Call translation API
      const response = await adminApiCall<{ success: boolean; data: any }>(
        AdminEndpoints.translate,
        {
          method: 'POST',
          body: JSON.stringify({
            text: translationData,
            sourceLang: translateSourceLang,
            targetLangs: targetLangs,
            provider: aiProvider
          })
        }
      );

      if (response.success && response.data) {
        // Apply translations using utility function
        // CHỈ cập nhật các ngôn ngữ còn thiếu, không ghi đè các ngôn ngữ đã có
        const updatedData = applySimpleTranslations(data, response.data, translateSourceLang, targetLangs);
        updateCallback(updatedData);
        
        if (options.onTranslateSuccess) {
          options.onTranslateSuccess(updatedData);
        }
        
        // Hiển thị thông báo thành công với số lượng fields đã dịch
        let successMessage = `✅ Dịch thuật thành công! Đã dịch ${fieldCounts.needsTranslation} trường từ ${sourceLangName} sang các ngôn ngữ còn thiếu`;
        const summary: string[] = [];
        if (fieldCounts.skippedEmpty > 0) {
          summary.push(`${fieldCounts.skippedEmpty} trường đã bỏ qua (chưa có nội dung ${sourceLangName})`);
        }
        if (fieldCounts.alreadyComplete > 0) {
          summary.push(`${fieldCounts.alreadyComplete} trường đã có đầy đủ ngôn ngữ`);
        }
        if (summary.length > 0) {
          successMessage += `. ${summary.join(', ')}`;
        }
        toast.success(successMessage);
      } else {
        toast.error('❌ Không thể dịch: ' + ((response as any)?.message || 'Unknown error'));
      }
    } catch (error: any) {
      const sourceLangName = getLanguageName(translateSourceLang);
      toast.error(`❌ Lỗi khi dịch từ ${sourceLangName}: ` + (error?.message || 'Unknown error'));
    } finally {
      setTranslatingAll(false);
    }
  };

  return {
    globalLocale,
    setGlobalLocale,
    aiProvider,
    setAiProvider,
    translatingAll,
    translateSourceLang,
    setTranslateSourceLang,
    translateData
  };
}


