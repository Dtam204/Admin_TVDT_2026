"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Home, Sparkles, Users, Briefcase, ShieldCheck, MessageSquare, CheckCircle2, ArrowRight, Play, CheckCircle, LineChart, Code, Database, Cloud, BarChart3, FileCheck, Plus, Edit, Trash2, ChevronUp, ChevronDown, Star, Link as LinkIcon, Image as ImageIcon, Languages, Bot, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageUpload from "@/components/admin/ImageUpload";
import MediaLibraryPicker from "@/app/(admin)/admin/news/MediaLibraryPicker";
import * as LucideIcons from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LocaleInput } from "@/components/admin/LocaleInput";
import { getLocaleValue, setLocaleValue } from "@/lib/utils/locale-admin";
import { getLocalizedText } from "@/lib/utils/i18n";

const BLOCK_TYPES = ['RECOMMEND', 'SUGGEST', 'UPDATED', 'MOST_VIEWED', 'MOST_BORROWED', 'FAVORITE'] as const;
type BlockType = typeof BLOCK_TYPES[number];

const ICON_OPTIONS = [
  "Code2", "MonitorSmartphone", "Network", "Globe2", "ShieldCheck", "Users", "Award", "Target",
  "Sparkles", "ArrowRight", "Phone", "Package", "Settings", "Database", "Cloud", "Server",
  "Cpu", "HardDrive", "LineChart", "Code", "BarChart3", "FileCheck", "CheckCircle", "CheckCircle2"
];

const GRADIENT_OPTIONS = [
  { value: "from-cyan-400 to-blue-600", label: "Cyan - Blue" },
  { value: "from-fuchsia-400 to-indigo-600", label: "Fuchsia - Indigo" },
  { value: "from-emerald-400 to-green-600", label: "Emerald - Green" },
  { value: "from-orange-400 to-pink-600", label: "Orange - Pink" },
  { value: "from-blue-500 to-cyan-500", label: "Blue - Cyan" },
  { value: "from-purple-500 to-pink-500", label: "Purple - Pink" },
  { value: "from-emerald-500 to-teal-500", label: "Emerald - Teal" },
  { value: "from-orange-500 to-amber-500", label: "Orange - Amber" },
];

interface HomepageBlock {
  id?: number;
  sectionType: BlockType;
  data: any;
  isActive: boolean;
}

export default function AdminHomepagePage() {
  const [blocks, setBlocks] = useState<Record<BlockType, HomepageBlock>>({
    RECOMMEND: { sectionType: 'RECOMMEND', data: {}, isActive: true },
    SUGGEST: { sectionType: 'SUGGEST', data: {}, isActive: true },
    UPDATED: { sectionType: 'UPDATED', data: {}, isActive: true },
    MOST_VIEWED: { sectionType: 'MOST_VIEWED', data: {}, isActive: true },
    MOST_BORROWED: { sectionType: 'MOST_BORROWED', data: {}, isActive: true },
    FAVORITE: { sectionType: 'FAVORITE', data: {}, isActive: true },
  });
  const [loading, setLoading] = useState<Record<BlockType, boolean>>({
    RECOMMEND: false,
    SUGGEST: false,
    UPDATED: false,
    MOST_VIEWED: false,
    MOST_BORROWED: false,
    FAVORITE: false,
  });
  const [activeTab, setActiveTab] = useState<BlockType>('RECOMMEND');
  const [globalLocale, setGlobalLocale] = useState<'vi' | 'en' | 'ja'>('vi');
  const [aiProvider, setAiProvider] = useState<'openai' | 'gemini'>('openai');
  const [translatingAll, setTranslatingAll] = useState(false);
  const [translateSourceLang, setTranslateSourceLang] = useState<'vi' | 'en' | 'ja'>('vi'); // Ngôn ngữ nguồn để dịch

  // State for editing array items
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [editingSolutionIndex, setEditingSolutionIndex] = useState<number | null>(null);
  const [editingTrustFeatureIndex, setEditingTrustFeatureIndex] = useState<number | null>(null);
  const [editingFeatureItemIndex, setEditingFeatureItemIndex] = useState<{ block: 'block2' | 'block3', index: number } | null>(null);
  const [editingFeatureBlockIndex, setEditingFeatureBlockIndex] = useState<number | null>(null);
  const [editingTestimonialIndex, setEditingTestimonialIndex] = useState<number | null>(null);

  // State for secondary button link dialog
  const [showSecondaryLinkDialog, setShowSecondaryLinkDialog] = useState(false);
  const [secondaryLinkTab, setSecondaryLinkTab] = useState<"url" | "media">("url");

  const tabsConfig = [
    { value: 'RECOMMEND' as BlockType, label: 'Banner Đề cử', icon: Home, description: 'Băng rôn nổi bật trang chủ' },
    { value: 'SUGGEST' as BlockType, label: 'Sách Gợi ý', icon: Sparkles, description: 'Sách ngẫu nhiên cho bạn đọc' },
    { value: 'UPDATED' as BlockType, label: 'Mới cập nhật', icon: Play, description: 'Danh sách sách vừa nhập' },
    { value: 'MOST_VIEWED' as BlockType, label: 'Xem nhiều nhất', icon: LineChart, description: 'Được quan tâm nhiều nhất' },
    { value: 'MOST_BORROWED' as BlockType, label: 'Mượn nhiều nhất', icon: Briefcase, description: 'Thống kê mượn trả' },
    { value: 'FAVORITE' as BlockType, label: 'Sách Nổi bật', icon: Star, description: 'Bộ sưu tập tiêu biểu' },
  ];

  useEffect(() => {
    void fetchAllBlocks();
  }, []);

  // Collapse state for config blocks (default: all hidden)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({
    RECOMMEND: false,
    SUGGEST: false,
    UPDATED: false,
    MOST_VIEWED: false,
    MOST_BORROWED: false,
    FAVORITE: false,
  });

  const toggleBlock = (blockKey: string) => {
    setCollapsedBlocks(prev => ({
      ...prev,
      [blockKey]: !prev[blockKey]
    }));
  };

  const fetchAllBlocks = async () => {
    try {
      for (const blockType of BLOCK_TYPES) {
        try {
          const data = await adminApiCall<{ success: boolean; data?: HomepageBlock }>(
            AdminEndpoints.homepage.block(blockType),
          );
          if (data?.data) {
            setBlocks(prev => ({
              ...prev,
              [blockType]: data.data!,
            }));
          }
        } catch (error) {
          // Block might not exist yet
        }
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải dữ liệu");
    }
  };

  const handleSaveBlock = async (blockType: BlockType) => {
    try {
      setLoading(prev => ({ ...prev, [blockType]: true }));
      const block = blocks[blockType];
      await adminApiCall(AdminEndpoints.homepage.block(blockType), {
        method: "PUT",
        body: JSON.stringify({
          data: block.data,
          isActive: block.isActive,
        }),
      });
      toast.success(`Đã lưu khối ${tabsConfig.find(t => t.value === blockType)?.label} thành công`);
      void fetchAllBlocks();
    } catch (error: any) {
      toast.error(error?.message || `Không thể lưu khối ${blockType}`);
    } finally {
      setLoading(prev => ({ ...prev, [blockType]: false }));
    }
  };

  const updateBlockData = (blockType: BlockType, path: string, value: any) => {
    setBlocks(prev => {
      const newData = { ...prev[blockType].data };
      const keys = path.split('.');
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return {
        ...prev,
        [blockType]: {
          ...prev[blockType],
          data: newData,
        },
      };
    });
  };

  const getBlockData = (blockType: BlockType, path: string, defaultValue: any = '') => {
    const keys = path.split('.');
    let current: any = blocks[blockType]?.data;
    if (!current) return defaultValue;
    for (const key of keys) {
      if (current && typeof current === 'object') {
        if (Array.isArray(current)) {
          // Nếu current là array nhưng key là string (không phải index), return default
          if (isNaN(Number(key))) {
            return defaultValue;
          }
          const index = Number(key);
          if (index >= 0 && index < current.length) {
            current = current[index];
          } else {
            return defaultValue;
          }
        } else if (key in current) {
          current = current[key];
        } else {
          return defaultValue;
        }
      } else {
        return defaultValue;
      }
    }
    
    // Đảm bảo type matching với default value
    if (Array.isArray(defaultValue) && !Array.isArray(current)) {
      return defaultValue;
    }
    if (!Array.isArray(defaultValue) && Array.isArray(current)) {
      return defaultValue;
    }
    
    return current ?? defaultValue;
  };
  
  // Helper để update locale value
  const updateLocaleValue = (blockType: BlockType, path: string, value: Record<'vi' | 'en' | 'ja', string>) => {
    setBlocks(prev => {
      const currentData = prev[blockType]?.data || {};
      const newData = setLocaleValue(currentData, path, value);
      return {
        ...prev,
        [blockType]: {
          ...prev[blockType],
          data: newData
        }
      };
    });
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Code2;
    return <IconComponent className="w-6 h-6" />;
  };

  // Helper functions for array management
  const addArrayItem = (blockType: BlockType, arrayPath: string, defaultItem: any) => {
    const currentArray = getBlockData(blockType, arrayPath, []) as any[];
    updateBlockData(blockType, arrayPath, [...currentArray, defaultItem]);
  };

  const updateArrayItem = (blockType: BlockType, arrayPath: string, index: number, item: any) => {
    const currentArray = getBlockData(blockType, arrayPath, []) as any[];
    const newArray = [...currentArray];
    newArray[index] = item;
    updateBlockData(blockType, arrayPath, newArray);
  };

  const removeArrayItem = (blockType: BlockType, arrayPath: string, index: number) => {
    const currentArray = getBlockData(blockType, arrayPath, []) as any[];
    const newArray = currentArray.filter((_, i) => i !== index);
    updateBlockData(blockType, arrayPath, newArray);
  };

  const moveArrayItem = (blockType: BlockType, arrayPath: string, index: number, direction: 'up' | 'down') => {
    const currentArray = getBlockData(blockType, arrayPath, []) as any[];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentArray.length - 1) return;

    const newArray = [...currentArray];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newArray[index], newArray[newIndex]] = [newArray[newIndex], newArray[index]];
    updateBlockData(blockType, arrayPath, newArray);
  };

  // Hàm dịch toàn bộ các trường locale trong TẤT CẢ các blocks
  // Gom tất cả thành 1 request duy nhất để dịch chuẩn theo từng khối
  const handleTranslateAll = async () => {
    setTranslatingAll(true);
    try {
      // Tạo object chứa các fields cần dịch, giữ nguyên cấu trúc
      // Chỉ lấy các fields có locale object và còn thiếu ngôn ngữ
      const fieldMap: Map<string, { blockType: BlockType; path: string; originalValue: Record<'vi' | 'en' | 'ja', string> }> = new Map();

      // Hàm tạo object chỉ chứa các fields cần dịch, giữ nguyên cấu trúc
      // Hàm này sẽ tìm tất cả locale objects và cả string values (để convert thành locale objects)
      const buildTranslationObject = (obj: any, blockType: BlockType, path: string = '', targetObj: any = {}): any => {
        if (!obj || typeof obj !== 'object') return targetObj;
        
        // Skip các fields không cần dịch
        const skipFields = [
          'image', 'link', 'href', 'url', 'icon', 'gradient', 'color',
          'partners', 'heroImage', 'backgroundImage', 'imageUrl', 'slug',
          'id', 'sortOrder', 'isActive', 'iconName', 'rating', 'type', 'imageSide',
          'buttonLink', 'imageSide',
          // Các field không nên dịch
          'author' // tên khách hàng trong testimonials
        ];
        
        for (const [key, value] of Object.entries(obj)) {
          // Skip các fields không cần dịch
          if (skipFields.includes(key)) continue;
          
          const currentPath = path ? `${path}.${key}` : key;
          
          // Nếu là string - tự động convert thành locale object
          if (typeof value === 'string' && value.trim()) {
            // Convert string thành locale object với source language = string hiện tại, các ngôn ngữ khác = rỗng
            const localeValue: Record<'vi' | 'en' | 'ja', string> = {
              vi: '',
              en: '',
              ja: ''
            };
            localeValue[translateSourceLang] = value.trim();
            
            // Tạo nested structure trong targetObj
            const keys = currentPath.split('.');
            let current: any = targetObj;
            for (let i = 0; i < keys.length - 1; i++) {
              if (!current[keys[i]]) current[keys[i]] = {};
              current = current[keys[i]];
            }
            
            // Lưu source text (chỉ lấy text từ source language đã chọn)
            current[keys[keys.length - 1]] = localeValue[translateSourceLang];
            
            // Lưu mapping để sau này cập nhật
            fieldMap.set(`${blockType}.${currentPath}`, {
              blockType,
              path: currentPath,
              originalValue: localeValue
            });
            
            continue;
          }
          
          // Kiểm tra nếu là locale object (có vi, en, ja)
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const hasVi = 'vi' in value;
            const hasEn = 'en' in value;
            const hasJa = 'ja' in value;
            
            if (hasVi || hasEn || hasJa) {
              const localeValue = value as Record<'vi' | 'en' | 'ja', string>;
              const viText = (localeValue.vi || '').trim();
              const enText = (localeValue.en || '').trim();
              const jaText = (localeValue.ja || '').trim();
              
              // Chỉ xử lý nếu ngôn ngữ nguồn đã chọn có nội dung
              const sourceText = (localeValue[translateSourceLang] || '').trim();
              if (!sourceText) {
                // Bỏ qua field này nếu không có nội dung ở ngôn ngữ nguồn
                continue;
              }
              
              // Sử dụng source language đã chọn
              const sourceLang = translateSourceLang;
              
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
                
                // Lưu mapping để sau này cập nhật
                fieldMap.set(`${blockType}.${currentPath}`, {
                  blockType,
                  path: currentPath,
                  originalValue: localeValue
                });
              }
            } else {
              // Đệ quy tìm trong nested objects (không phải locale object)
              buildTranslationObject(value, blockType, currentPath, targetObj);
            }
          } else if (Array.isArray(value)) {
            // Xử lý arrays
            value.forEach((item, index) => {
              if (item && typeof item === 'object') {
                buildTranslationObject(item, blockType, `${currentPath}.${index}`, targetObj);
              } else if (typeof item === 'string' && item.trim()) {
                // Xử lý string trong array (như title, description trong slides)
                // Chỉ xử lý nếu string có giá trị (đã được kiểm tra ở trên)
                const localeValue: Record<'vi' | 'en' | 'ja', string> = {
                  vi: '',
                  en: '',
                  ja: ''
                };
                localeValue[translateSourceLang] = item.trim();
                
                // Tạo nested structure trong targetObj
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
                  current[Number(lastKey)] = localeValue[translateSourceLang];
                } else {
                  current[lastKey] = localeValue[translateSourceLang];
                }
                
                fieldMap.set(`${blockType}.${currentPath}.${index}`, {
                  blockType,
                  path: `${currentPath}.${index}`,
                  originalValue: localeValue
                });
              }
            });
          }
        }
        
        return targetObj;
      };

      // Chỉ dịch block hiện tại (activeTab) thay vì tất cả blocks
      const block = blocks[activeTab];
      if (!block || !block.data) {
        toast.info('Không có dữ liệu để dịch');
        setTranslatingAll(false);
        return;
      }

      // Kiểm tra xem ngôn ngữ nguồn đã chọn có nội dung trong block không
      const hasSourceLanguageContent = (data: any, sourceLang: 'vi' | 'en' | 'ja'): boolean => {
        if (!data || typeof data !== 'object') return false;
        
        for (const [key, value] of Object.entries(data)) {
          // Skip các fields không cần dịch
          const skipFields = ['image', 'link', 'href', 'url', 'icon', 'gradient', 'color', 
                             'partners', 'heroImage', 'backgroundImage', 'imageUrl', 'slug',
                             'id', 'sortOrder', 'isActive', 'iconName', 'rating', 'type', 'imageSide',
                             'buttonLink'];
          if (skipFields.includes(key)) continue;
          
          if (typeof value === 'string' && value.trim()) {
            return true; // Có string value
          }
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            // Kiểm tra nếu là locale object
            if (sourceLang in value && (value as any)[sourceLang]?.trim()) {
              return true;
            }
            // Đệ quy kiểm tra nested objects
            if (hasSourceLanguageContent(value, sourceLang)) {
              return true;
            }
          } else if (Array.isArray(value)) {
            // Kiểm tra trong arrays
            for (const item of value) {
              if (hasSourceLanguageContent(item, sourceLang)) {
                return true;
              }
            }
          }
        }
        
        return false;
      };
      
      if (!hasSourceLanguageContent(block.data, translateSourceLang)) {
        const sourceLangName = translateSourceLang === 'vi' ? 'Tiếng Việt' : translateSourceLang === 'en' ? 'English' : '日本語';
        toast.warning(`Không tìm thấy nội dung ${sourceLangName} trong khối "${tabsConfig.find(t => t.value === activeTab)?.label}". Vui lòng nhập nội dung ${sourceLangName} trước khi dịch.`);
        setTranslatingAll(false);
        return;
      }


      // Build translation object cho block hiện tại
      const blockTranslationData = buildTranslationObject(block.data, activeTab);
      
      
      if (Object.keys(blockTranslationData).length === 0 || fieldMap.size === 0) {
        // Kiểm tra xem block có dữ liệu không
        const hasData = block.data && Object.keys(block.data).length > 0;
        
        // Thông báo chi tiết hơn để debug
        let message = '';
        if (!hasData) {
          message = `Khối "${tabsConfig.find(t => t.value === activeTab)?.label}" chưa có dữ liệu. Vui lòng nhập dữ liệu trước khi dịch.`;
        } else if (fieldMap.size === 0) {
          const sourceLangName = translateSourceLang === 'vi' ? 'Tiếng Việt' : translateSourceLang === 'en' ? 'English' : '日本語';
          message = `Không tìm thấy trường nào có nội dung ${sourceLangName} để dịch trong khối "${tabsConfig.find(t => t.value === activeTab)?.label}".\n- Vui lòng nhập nội dung ${sourceLangName} trước khi dịch\n- Hoặc chọn ngôn ngữ nguồn khác có nội dung`;
        } else {
          message = 'Không có trường nào cần dịch (tất cả đã có đầy đủ nội dung)';
        }
        
        toast.info(message, {
          duration: 5000,
        });
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[Translate ${activeTab}] No translatable fields found. Block data:`, block.data);
        }
        
        setTranslatingAll(false);
        return;
      }


      toast.info(`Đang dịch ${fieldMap.size} trường trong khối "${tabsConfig.find(t => t.value === activeTab)?.label}" (1 request duy nhất)...`);

      // Thu thập tất cả target languages cần dịch (tất cả ngôn ngữ khác source)
      const allTargetLangs = new Set<'vi' | 'en' | 'ja'>();
      fieldMap.forEach((field) => {
        const viText = (field.originalValue.vi || '').trim();
        const enText = (field.originalValue.en || '').trim();
        const jaText = (field.originalValue.ja || '').trim();
        
        // Sử dụng source language đã chọn
        const sourceLang = translateSourceLang;
        
        // Thêm tất cả ngôn ngữ khác source vào target languages nếu chúng còn thiếu
        if (sourceLang !== 'vi' && !viText) allTargetLangs.add('vi');
        if (sourceLang !== 'en' && !enText) allTargetLangs.add('en');
        if (sourceLang !== 'ja' && !jaText) allTargetLangs.add('ja');
      });

      const targetLangsArray = Array.from(allTargetLangs);
      if (targetLangsArray.length === 0) {
        toast.info('Không có ngôn ngữ nào cần dịch');
        setTranslatingAll(false);
        return;
      }

      // Sử dụng source language đã chọn
      const mainSourceLang = translateSourceLang;

      try {
        // Gửi 1 request duy nhất với translation data của block hiện tại
        // Gửi trực tiếp blockTranslationData (không wrap trong activeTab key)
        // Vì backend sẽ trả về cùng cấu trúc
        const response = await adminApiCall<{ success: boolean; data: any }>(
          AdminEndpoints.translate,
          {
            method: 'POST',
            body: JSON.stringify({
              text: blockTranslationData,
              sourceLang: mainSourceLang,
              targetLangs: targetLangsArray,
              provider: aiProvider
            })
          }
        );

        if (response.success && response.data) {

          // Hàm để extract và cập nhật translations từ response
          // Response.data có cấu trúc giống như translationData đã gửi (không wrap trong blockType key)
          const extractAndUpdate = (translatedObj: any, blockType: BlockType, path: string = '', parentIsArray: boolean = false, arrayIndex: number = -1): number => {
            let updatedCount = 0;
            
            if (!translatedObj || typeof translatedObj !== 'object') return updatedCount;
            
            if (Array.isArray(translatedObj)) {
              translatedObj.forEach((item, index) => {
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                  // Kiểm tra nếu item là locale object
                  const hasVi = 'vi' in item;
                  const hasEn = 'en' in item;
                  const hasJa = 'ja' in item;
                  
                  if (hasVi || hasEn || hasJa) {
                    // Đây là locale object trong array
                    const currentPath = path ? `${path}.${index}` : `${index}`;
                    const fieldKey = `${blockType}.${currentPath}`;
                    const fieldInfo = fieldMap.get(fieldKey);
                    
                    if (fieldInfo) {
                      const originalValue = fieldInfo.originalValue;
                      const translatedValue = item as Record<'vi' | 'en' | 'ja', string>;
                      
                      const newLocaleValue: Record<'vi' | 'en' | 'ja', string> = {
                        vi: (originalValue.vi || '').trim() || '',
                        en: (originalValue.en || '').trim() || '',
                        ja: (originalValue.ja || '').trim() || ''
                      };
                      
                      if (translatedValue.vi && typeof translatedValue.vi === 'string' && !newLocaleValue.vi) {
                        newLocaleValue.vi = translatedValue.vi.trim();
                      }
                      if (translatedValue.en && typeof translatedValue.en === 'string' && !newLocaleValue.en) {
                        newLocaleValue.en = translatedValue.en.trim();
                      }
                      if (translatedValue.ja && typeof translatedValue.ja === 'string' && !newLocaleValue.ja) {
                        newLocaleValue.ja = translatedValue.ja.trim();
                      }
                      
                      if (newLocaleValue.vi !== originalValue.vi || 
                          newLocaleValue.en !== originalValue.en || 
                          newLocaleValue.ja !== originalValue.ja) {
                        updateLocaleValue(blockType, currentPath, newLocaleValue);
                        updatedCount++;
                        
                      }
                    }
                  } else {
                    // Đệ quy tìm trong nested objects
                    updatedCount += extractAndUpdate(item, blockType, path ? `${path}.${index}` : `${index}`, true, index);
                  }
                }
              });
              return updatedCount;
            }
            
            for (const [key, value] of Object.entries(translatedObj)) {
              const currentPath = path ? `${path}.${key}` : key;
              
              // Kiểm tra nếu value là locale object (có vi, en, ja)
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                const hasVi = 'vi' in value;
                const hasEn = 'en' in value;
                const hasJa = 'ja' in value;
                
                if (hasVi || hasEn || hasJa) {
                  // Đây là locale object - cần cập nhật
                  const fieldKey = `${blockType}.${currentPath}`;
                  const fieldInfo = fieldMap.get(fieldKey);
                  
                  if (fieldInfo) {
                    // Tìm thấy field cần cập nhật
                    const originalValue = fieldInfo.originalValue;
                    const translatedValue = value as Record<'vi' | 'en' | 'ja', string>;
                    
                    // Tạo locale object mới, giữ nguyên các giá trị đã có
                    const newLocaleValue: Record<'vi' | 'en' | 'ja', string> = {
                      vi: (originalValue.vi || '').trim() || '',
                      en: (originalValue.en || '').trim() || '',
                      ja: (originalValue.ja || '').trim() || ''
                    };
                    
                    // Cập nhật các ngôn ngữ còn thiếu từ translated value
                    if (translatedValue.vi && typeof translatedValue.vi === 'string' && !newLocaleValue.vi) {
                      newLocaleValue.vi = translatedValue.vi.trim();
                    }
                    if (translatedValue.en && typeof translatedValue.en === 'string' && !newLocaleValue.en) {
                      newLocaleValue.en = translatedValue.en.trim();
                    }
                    if (translatedValue.ja && typeof translatedValue.ja === 'string' && !newLocaleValue.ja) {
                      newLocaleValue.ja = translatedValue.ja.trim();
                    }
                    
                    // Chỉ cập nhật nếu có thay đổi
                    if (newLocaleValue.vi !== originalValue.vi || 
                        newLocaleValue.en !== originalValue.en || 
                        newLocaleValue.ja !== originalValue.ja) {
                      updateLocaleValue(blockType, currentPath, newLocaleValue);
                      updatedCount++;
                    }
                  } else {
                    // Không tìm thấy trong fieldMap - có thể là nested locale object
                    if (process.env.NODE_ENV === 'development') {
                      console.warn(`[Translate ${activeTab}] Field not found in map: ${fieldKey}`);
                    }
                  }
                } else {
                  // Không phải locale object - đệ quy tìm tiếp
                  updatedCount += extractAndUpdate(value, blockType, currentPath, false, -1);
                }
              } else if (value && typeof value === 'object' && Array.isArray(value)) {
                // Array - đệ quy
                updatedCount += extractAndUpdate(value, blockType, currentPath, false, -1);
              }
            }
            
            return updatedCount;
          };

          // Áp dụng translations cho block hiện tại
          // Response.data có cùng cấu trúc như translationData đã gửi (không wrap trong blockType key)
          let totalUpdated = 0;
          if (response.data && typeof response.data === 'object') {
            totalUpdated = extractAndUpdate(response.data, activeTab);
          }

          if (totalUpdated > 0) {
            toast.success(`Đã dịch thành công ${totalUpdated} trường trong khối "${tabsConfig.find(t => t.value === activeTab)?.label}" (1 request duy nhất)`);
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[Translate ${activeTab}] No fields updated. Response:`, response.data);
            }
            toast.warning('Không có trường nào được cập nhật. Có thể tất cả đã có đầy đủ hoặc cấu trúc không khớp.');
          }
        } else {
          toast.error('Không thể dịch: ' + (response as any)?.message || 'Unknown error');
        }
      } catch (error: any) {
        toast.error('Lỗi khi dịch: ' + (error?.message || 'Unknown error'));
        if (process.env.NODE_ENV === 'development') {
          console.error('Translation error:', error);
        }
      }
    } catch (error: any) {
      toast.error('Lỗi khi xử lý: ' + (error?.message || 'Unknown error'));
    } finally {
      setTranslatingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Trang chủ</h1>
          <p className="text-gray-600 mt-1">Quản lý đầy đủ các khối trên trang chủ</p>
        </div>
        <div className="flex items-center gap-4">
          {/* AI Provider Selector - Giữ ở header vì dùng chung cho tất cả tabs */}
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-gray-500" />
            <Select value={aiProvider} onValueChange={(value: 'openai' | 'gemini') => setAiProvider(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4o-mini)</SelectItem>
                <SelectItem value="gemini">Google Gemini</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {tabsConfig.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              const isCompleted = tabsConfig.findIndex(t => t.value === activeTab) > index;

              return (
                <div key={tab.value} className="flex items-center flex-1 min-w-[150px]">
                  <button
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all flex-1 ${isActive
                        ? "bg-blue-50 text-blue-700 border-2 border-blue-500"
                        : isCompleted
                          ? "bg-green-50 text-green-700 border-2 border-green-300"
                          : "bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100"
                      }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${isActive
                        ? "bg-blue-500 text-white"
                        : isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm truncate">{tab.label}</div>
                      <div className="text-xs opacity-75 truncate">{tab.description}</div>
                    </div>
                  </button>
                  {index < tabsConfig.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${isCompleted ? "bg-green-500" : "bg-gray-300"
                      }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BlockType)} className="w-full">
        {BLOCK_TYPES.map((blockType) => {
          const tabConfig = tabsConfig.find(t => t.value === blockType);
          const block = blocks[blockType];

          return (
            <TabsContent key={blockType} value={blockType} className="space-y-6">
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-6">
                  {/* Language Selection Bar */}
                  <Card className="bg-white/50 backdrop-blur-sm border-blue-100">
                    <CardContent className="flex items-center justify-between p-4 flex-wrap gap-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4 text-blue-600" />
                          <Label className="text-sm font-bold text-gray-700">Ngôn ngữ:</Label>
                        </div>
                        <Select value={globalLocale} onValueChange={(v: any) => setGlobalLocale(v)}>
                          <SelectTrigger className="w-[150px] bg-white"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                            <SelectItem value="en">🇬🇧 English</SelectItem>
                            <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleTranslateAll}
                          disabled={translatingAll}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200"
                        >
                          {translatingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                          AI Translate
                        </Button>
                      </div>
                      <Button
                        onClick={() => handleSaveBlock(blockType)}
                        disabled={loading[blockType]}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading[blockType] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Cập nhật {tabConfig?.label}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Sections Configuration */}
                  <Card className="shadow-lg border-blue-50 overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-600 rounded-lg text-white">
                            {tabConfig && <tabConfig.icon className="h-5 w-5" />}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-slate-800 italic">Quản lý {tabConfig?.label}</CardTitle>
                            <p className="text-xs text-slate-500 font-medium italic">{tabConfig?.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                          <span className="text-[10px] font-black text-slate-400">STATUS:</span>
                          <Switch
                            checked={block?.isActive}
                            onCheckedChange={(checked) => setBlocks(prev => ({
                              ...prev,
                              [blockType]: { ...prev[blockType], isActive: checked }
                            }))}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label className="text-xs font-black uppercase tracking-widest text-blue-600">Nội dung văn bản</Label>
                          <LocaleInput
                            value={getLocaleValue(block?.data, 'title')}
                            onChange={(value) => updateLocaleValue(blockType, 'title', value)}
                            label="Tiêu đề chính"
                            placeholder="Tiêu đề hiển thị trên Website"
                            defaultLocale={globalLocale}
                            aiProvider={aiProvider}
                          />
                          <LocaleInput
                            value={getLocaleValue(block?.data, 'subtitle')}
                            onChange={(value) => updateLocaleValue(blockType, 'subtitle', value)}
                            label="Mô tả phụ"
                            placeholder="Mô tả ngắn gọn phía dưới"
                            defaultLocale={globalLocale}
                            aiProvider={aiProvider}
                            multiline
                          />
                        </div>
                        <div className="flex flex-col justify-center p-6 bg-blue-50/50 rounded-2xl border border-dashed border-blue-200">
                          <div className="flex items-center gap-2 mb-2 text-blue-700">
                            <Info className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase">Lưu ý quản trị</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed italic">
                            {blockType === 'RECOMMEND' 
                              ? "Bạn có thể thêm/xóa các Banner ở danh sách bên dưới để tạo Slideshow." 
                              : `Các ấn phẩm thuộc mục "${tabConfig?.label}" sẽ được hiển thị tự động từ cơ sở dữ liệu.`}
                          </p>
                        </div>
                      </div>

                      {blockType === 'RECOMMEND' && (
                        <div className="pt-8 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 uppercase tracking-tight">Danh sách Banner Slideshow</h3>
                            <Button size="sm" onClick={() => {
                              const slides = getBlockData('RECOMMEND', 'slides', []) as any[];
                              addArrayItem('RECOMMEND', 'slides', {
                                title: { vi: '', en: '', ja: '' },
                                description: { vi: '', en: '', ja: '' },
                                buttonText: { vi: 'Xem ngay', en: 'View', ja: '見る' },
                                buttonLink: '', image: '',
                              });
                              setEditingSlideIndex(slides.length);
                            }} className="bg-blue-600 h-8 text-xs">Thêm Banner</Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {(getBlockData('RECOMMEND', 'slides', []) as any[]).map((slide, idx) => (
                              <Card key={idx} className="group overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all">
                                <div className="relative aspect-video bg-slate-100 italic flex items-center justify-center cursor-pointer" onClick={() => setEditingSlideIndex(idx)}>
                                  {slide.image ? <img src={slide.image} className="w-full h-full object-cover" /> : <span className="text-[10px] text-gray-400">Click để chọn ảnh</span>}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-sm"><Edit className="h-3 w-3" /></Button>
                                    <Button variant="destructive" size="icon" className="h-7 w-7 rounded-sm" onClick={(e) => { e.stopPropagation(); removeArrayItem('RECOMMEND', 'slides', idx); }}><Trash2 className="h-3 w-3" /></Button>
                                  </div>
                                  <div className="p-2 text-xs font-bold truncate bg-white border-t">
                                    {getLocalizedText(slide.title, globalLocale) || "Banner " + (idx+1)}
                                  </div>
                                </div>
                              </Card>
                            ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
            </TabsContent>
          );
        })}
      </Tabs>
      {/* Dialog for Slides (RECOMMEND section) */}
      <Dialog open={editingSlideIndex !== null} onOpenChange={(open) => !open && setEditingSlideIndex(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold italic text-blue-600">CHỈNH SỬA BANNER SLIDESHOW</DialogTitle>
            <DialogDescription className="italic">Cấu hình chi tiết nội dung hiển thị cho banner này trên trang chủ.</DialogDescription>
          </DialogHeader>
          <div className="h-px bg-slate-100 my-2" />
          {editingSlideIndex !== null && (() => {
            const slides = getBlockData('RECOMMEND', 'slides', []) as any[];
            const slide = slides[editingSlideIndex] || {};
            
            const updateSlideField = (field: string, value: any) => {
              const newSlides = [...slides];
              newSlides[editingSlideIndex] = { ...newSlides[editingSlideIndex], [field]: value };
              updateBlockData('RECOMMEND', 'slides', newSlides);
            };

            const updateSlideLocale = (field: string, value: any) => {
              const newSlides = [...slides];
              newSlides[editingSlideIndex] = setLocaleValue(newSlides[editingSlideIndex], field, value);
              updateBlockData('RECOMMEND', 'slides', newSlides);
            };

            return (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Visuals */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Hình ảnh Banner</Label>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
                        <ImageUpload
                          currentImage={slide.image || ''}
                          onImageSelect={(url) => updateSlideField('image', url)}
                        />
                        <p className="text-[10px] text-slate-400 mt-2 italic text-center text-blue-500">Kích thước khuyên dùng: 1920x800px hoặc tỷ lệ 16:9</p>
                      </div>
                    </div>
                    <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                        <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Liên kết điều hướng (Link)</Label>
                      </div>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          value={slide.buttonLink || ''}
                          onChange={(e) => updateSlideField('buttonLink', e.target.value)}
                          placeholder="/book/123 hoặc https://..."
                          className="pl-10 bg-slate-50 border-slate-200 font-medium italic text-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Content */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1 h-4 bg-blue-600 rounded-full" />
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-700">Nội dung đa ngôn ngữ</Label>
                    </div>
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <LocaleInput
                        value={getLocaleValue(slide, 'title')}
                        onChange={(value) => updateSlideLocale('title', value)}
                        label="Tiêu đề hiển thị"
                        placeholder="Nhập tiêu đề banner..."
                        defaultLocale={globalLocale}
                        aiProvider={aiProvider}
                      />
                      <LocaleInput
                        value={getLocaleValue(slide, 'description')}
                        onChange={(value) => updateSlideLocale('description', value)}
                        label="Mô tả chi tiết"
                        placeholder="Mô tả ngắn gọn về banner này..."
                        defaultLocale={globalLocale}
                        aiProvider={aiProvider}
                        multiline
                      />
                      <LocaleInput
                        value={getLocaleValue(slide, 'buttonText')}
                        onChange={(value) => updateSlideLocale('buttonText', value)}
                        label="Chữ trên nút (Button Text)"
                        placeholder="Xem ngay, Khám phá mẫu..."
                        defaultLocale={globalLocale}
                        aiProvider={aiProvider}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="bg-slate-50 p-4 -mx-6 -mb-6 border-t mt-4 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 font-bold italic">
              <Sparkles className="h-3 w-3 text-blue-500" />
              SỬ DỤNG AI TRANSLATE ĐỂ ĐỒNG BỘ NGÔN NGỮ NHANH
            </div>
            <Button variant="default" onClick={() => setEditingSlideIndex(null)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 px-8 font-bold">
              HOÀN TẤT & ĐÓNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

