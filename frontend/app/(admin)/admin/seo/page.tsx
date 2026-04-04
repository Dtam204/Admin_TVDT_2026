"use client";

import { useState, useEffect } from "react";
import { Save, Settings2, Languages } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getSeoPageByPath, updateSeoPage, SeoPageData } from "@/lib/api/seo";
import ImageUpload from "@/components/admin/ImageUpload";
import { getCleanValue } from "@/lib/utils/locale-admin";

type Locale = 'vi' | 'en' | 'ja';

const PAGE_OPTIONS = [
  { path: '/', label: 'Trang chủ', type: 'home' },
  { path: '/products', label: 'Danh sách sản phẩm', type: 'products' },
  { path: '/about', label: 'Về chúng tôi', type: 'about' },
  { path: '/contact', label: 'Liên hệ', type: 'contact' },
  { path: '/news', label: 'Tin tức', type: 'news' },
  { path: '/industries', label: 'Lĩnh vực', type: 'industries' },
  { path: '/careers', label: 'Tuyển dụng', type: 'careers' },
];

export default function AdminSeoPage() {
  const [selectedPath, setSelectedPath] = useState<string>('/');
  const [seoData, setSeoData] = useState<Partial<SeoPageData>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadSeoData();
  }, [selectedPath]);

  const loadSeoData = async () => {
    try {
      setLoading(true);
      const data = await getSeoPageByPath(selectedPath);
      if (data) {
        setSeoData({
          ...data,
          title: getCleanValue(data.title),
          description: getCleanValue(data.description),
          keywords: getCleanValue(data.keywords),
          og_title: getCleanValue(data.og_title),
          og_description: getCleanValue(data.og_description),
          twitter_title: getCleanValue(data.twitter_title),
          twitter_description: getCleanValue(data.twitter_description),
        });
      } else {
        const pageOption = PAGE_OPTIONS.find(p => p.path === selectedPath);
        setSeoData({
          page_path: selectedPath,
          page_type: pageOption?.type || 'website',
        });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Không thể tải dữ liệu SEO');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSeoPage(selectedPath, seoData as SeoPageData);
      toast.success('Đã lưu cấu hình SEO thành công');
      await new Promise(resolve => setTimeout(resolve, 500));
      void loadSeoData();
    } catch (error: any) {
      toast.error(error?.message || 'Không thể lưu cấu hình SEO');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 font-bold">Quản lý SEO</h1>
          <p className="text-gray-500 mt-1">
            Cấu hình SEO cho các trang của website (Vietnamese Only)
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Chọn trang cần cấu hình</CardTitle>
          <CardDescription>
            Chọn trang bạn muốn cấu hình SEO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedPath} onValueChange={setSelectedPath}>
            <SelectTrigger className="w-full h-12 rounded-xl">
              <SelectValue placeholder="Chọn trang" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {PAGE_OPTIONS.map((page) => (
                <SelectItem key={page.path} value={page.path}>
                  {page.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-20 text-slate-400 animate-pulse">Đang tải dữ liệu SEO...</div>
      ) : (
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="basic" className="rounded-lg px-6">SEO Cơ bản</TabsTrigger>
            <TabsTrigger value="social" className="rounded-lg px-6">Mạng xã hội</TabsTrigger>
            <TabsTrigger value="advanced" className="rounded-lg px-6">Nâng cao</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Thông tin SEO cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">Tiêu đề (Title)</Label>
                  <Input
                    value={seoData.title || ''}
                    onChange={(e) => setSeoData({ ...seoData, title: e.target.value })}
                    placeholder="Tiêu đề trang (50-60 ký tự)"
                    className="h-12 rounded-xl"
                  />
                  <p className="text-[10px] text-gray-500 text-right">
                    {(seoData.title || '').length}/60 ký tự
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">Mô tả (Description)</Label>
                  <Textarea
                    value={seoData.description || ''}
                    onChange={(e) => setSeoData({ ...seoData, description: e.target.value })}
                    placeholder="Mô tả trang (150-160 ký tự)"
                    className="min-h-[120px] rounded-xl"
                  />
                  <p className="text-[10px] text-gray-500 text-right">
                    {(seoData.description || '').length}/160 ký tự
                  </p>
                </div>

                <div className="space-y-2">
                   <Label className="text-slate-600 font-bold">Từ khóa (Keywords)</Label>
                   <Input
                    value={seoData.keywords || ''}
                    onChange={(e) => setSeoData({ ...seoData, keywords: e.target.value })}
                    placeholder="từ khóa 1, từ khóa 2, từ khóa 3"
                    className="h-12 rounded-xl"
                  />
                  <p className="text-[10px] text-gray-500">
                    Phân cách bằng dấu phẩy
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canonical" className="text-slate-600 font-bold">Canonical URL</Label>
                  <Input
                    id="canonical"
                    value={seoData.canonical_url || ''}
                    onChange={(e) => setSeoData({ ...seoData, canonical_url: e.target.value })}
                    placeholder="https://thuvien-tn.vn/..."
                    className="h-12 rounded-xl"
                  />
                  <p className="text-[10px] text-gray-500">
                    URL chính thức của trang này. Dùng để tránh duplicate content.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">Ảnh SEO Mặc định</Label>
                  <ImageUpload
                    currentImage={(seoData as any).image || ''}
                    onImageSelect={(imageUrl) => setSeoData({ ...seoData, image: imageUrl } as Partial<SeoPageData>)}
                  />
                  <p className="text-[10px] text-gray-500">
                    Ảnh SEO chung (Fallback). Kích thước: 1200x630px
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-blue-600">Open Graph (Facebook, LinkedIn)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">OG Title</Label>
                  <Input
                    value={seoData.og_title || ''}
                    onChange={(e) => setSeoData({ ...seoData, og_title: e.target.value })}
                    placeholder="Tiêu đề khi chia sẻ"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">OG Description</Label>
                  <Textarea
                    value={seoData.og_description || ''}
                    onChange={(e) => setSeoData({ ...seoData, og_description: e.target.value })}
                    placeholder="Mô tả khi chia sẻ"
                    className="min-h-[100px] rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">OG Image</Label>
                  <ImageUpload
                    currentImage={seoData.og_image || ''}
                    onImageSelect={(imageUrl) => setSeoData({ ...seoData, og_image: imageUrl })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-sky-500">Twitter Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">Twitter Title</Label>
                  <Input
                    value={seoData.twitter_title || ''}
                    onChange={(e) => setSeoData({ ...seoData, twitter_title: e.target.value })}
                    placeholder="Tiêu đề cho Twitter"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">Twitter Description</Label>
                  <Textarea
                    value={seoData.twitter_description || ''}
                    onChange={(e) => setSeoData({ ...seoData, twitter_description: e.target.value })}
                    placeholder="Mô tả cho Twitter"
                    className="min-h-[100px] rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 font-bold">Twitter Image</Label>
                  <ImageUpload
                    currentImage={seoData.twitter_image || ''}
                    onImageSelect={(imageUrl) => setSeoData({ ...seoData, twitter_image: imageUrl })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình Robots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Index (Cho phép lập chỉ mục)</Label>
                    <p className="text-sm text-gray-500">
                      Cho phép search engine lập chỉ mục trang này
                    </p>
                  </div>
                  <Switch
                    checked={seoData.robots_index !== false}
                    onCheckedChange={(checked) => setSeoData({ ...seoData, robots_index: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Follow (Cho phép theo dõi links)</Label>
                    <p className="text-sm text-gray-500">
                      Cho phép search engine theo dõi các links trong trang
                    </p>
                  </div>
                  <Switch
                    checked={seoData.robots_follow !== false}
                    onCheckedChange={(checked) => setSeoData({ ...seoData, robots_follow: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Đang lưu...' : 'Lưu cấu hình SEO'}
            </Button>
          </div>
        </Tabs>
      )}
    </div>
  );
}


