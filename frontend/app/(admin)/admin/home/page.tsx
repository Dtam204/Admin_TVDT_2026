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
import { getCleanValue } from "@/lib/utils/locale-admin";

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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Trang chủ</h1>
          <p className="text-gray-600 mt-1">Quản lý đầy đủ các khối trên trang chủ</p>
        </div>
      </div>

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
                      {/* Language Selection Bar - Hidden for single language
                      <div className="flex items-center gap-6">
                        ...
                      </div> */}
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
                          <div className="space-y-2">
                            <Label htmlFor="block-title" className="text-sm font-semibold italic text-blue-700">Tiêu đề chính</Label>
                            <Input
                              id="block-title"
                              value={getCleanValue(block?.data?.title)}
                              onChange={(e) => updateBlockData(blockType, 'title', e.target.value)}
                              placeholder="Tiêu đề hiển thị trên Website"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="block-subtitle" className="text-sm font-semibold italic text-blue-700">Mô tả phụ</Label>
                            <Textarea
                              id="block-subtitle"
                              value={getCleanValue(block?.data?.subtitle)}
                              onChange={(e) => updateBlockData(blockType, 'subtitle', e.target.value)}
                              placeholder="Mô tả ngắn gọn phía dưới"
                              className="min-h-[80px]"
                            />
                          </div>
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
                                    {getCleanValue(slide.title) || "Banner " + (idx+1)}
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
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Tiêu đề hiển thị</Label>
                        <Input
                          value={getCleanValue(slide.title)}
                          onChange={(e) => updateSlideField('title', e.target.value)}
                          placeholder="Nhập tiêu đề banner..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Mô tả chi tiết</Label>
                        <Textarea
                          value={getCleanValue(slide.description)}
                          onChange={(e) => updateSlideField('description', e.target.value)}
                          placeholder="Mô tả ngắn gọn về banner này..."
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Chữ trên nút (Button Text)</Label>
                        <Input
                          value={getCleanValue(slide.buttonText)}
                          onChange={(e) => updateSlideField('buttonText', e.target.value)}
                          placeholder="Xem ngay, Khám phá mẫu..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="bg-slate-50 p-4 -mx-6 -mb-6 border-t mt-4 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 font-bold italic">
              <Sparkles className="h-3 w-3 text-blue-500" />
              QUẢN LÝ NỘI DUNG TIẾNG VIỆT ĐƠN NGỮ
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

