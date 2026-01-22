"use client";

import { useState, useEffect } from "react";
import { Save, Globe2, Bell, Shield, Database, Plus, Trash2, Languages } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ImageUpload from "@/components/admin/ImageUpload";
import { getSettings, updateSettings } from "@/lib/api/settings";
import { LocaleInput } from "@/components/admin/LocaleInput";
import { getLocaleValue, setLocaleValue, migrateObjectToLocale } from "@/lib/utils/locale-admin";
import { useTranslationControls } from "@/lib/hooks/useTranslationControls";
import { AIProviderSelector } from "@/components/admin/AIProviderSelector";

type Locale = 'vi' | 'en' | 'ja';

interface FooterLink {
  name: string | Record<Locale, string>;
  href: string;
}

interface GeneralSettings {
  favicon: string;
  logo: string;
  slogan: string | Record<Locale, string>;
  site_name: string | Record<Locale, string>;
  site_description: string | Record<Locale, string>;
  phone: string;
  email: string;
  address: string | Record<Locale, string>;
  social_facebook: string;
  social_twitter: string;
  social_linkedin: string;
  social_instagram: string;
  footer_quick_links: string;
  footer_solutions: string;
  google_site_verification: string;
  openai_api_key: string;
  gemini_api_key: string;
  announcement_enabled: boolean;
  announcement_title: string | Record<Locale, string>;
  announcement_message: string | Record<Locale, string>;
  announcement_cta_text: string | Record<Locale, string>;
  announcement_cta_link: string;
  announcement_reappear_hours: number;
}

export default function AdminSettingsPage() {
  // Use translation controls hook
  const {
    globalLocale,
    setGlobalLocale,
    aiProvider,
    setAiProvider,
  } = useTranslationControls();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    favicon: '',
    logo: '',
    slogan: { vi: '', en: '', ja: '' },
    site_name: { vi: '', en: '', ja: '' },
    site_description: { vi: '', en: '', ja: '' },
    phone: '',
    email: '',
    address: { vi: '', en: '', ja: '' },
    social_facebook: '',
    social_twitter: '',
    social_linkedin: '',
    social_instagram: '',
    footer_quick_links: '',
    footer_solutions: '',
    google_site_verification: '',
    openai_api_key: '',
    gemini_api_key: '',
    announcement_enabled: false,
    announcement_title: { vi: '', en: '', ja: '' },
    announcement_message: { vi: '', en: '', ja: '' },
    announcement_cta_text: { vi: '', en: '', ja: '' },
    announcement_cta_link: '',
    announcement_reappear_hours: 1,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await getSettings();
      
      setGeneralSettings({
        favicon: settings.favicon?.value || '',
        logo: settings.logo?.value || '',
        slogan: migrateObjectToLocale(settings.slogan?.value || ''),
        site_name: migrateObjectToLocale(settings.site_name?.value || ''),
        site_description: migrateObjectToLocale(settings.site_description?.value || ''),
        phone: settings.phone?.value || '',
        email: settings.email?.value || '',
        address: migrateObjectToLocale(settings.address?.value || ''),
        social_facebook: settings.social_facebook?.value || '',
        social_twitter: settings.social_twitter?.value || '',
        social_linkedin: settings.social_linkedin?.value || '',
        social_instagram: settings.social_instagram?.value || '',
        footer_quick_links: settings.footer_quick_links?.value || '',
        footer_solutions: settings.footer_solutions?.value || '',
        google_site_verification: settings.google_site_verification?.value || '',
        openai_api_key: settings.openai_api_key?.value || '',
        gemini_api_key: settings.gemini_api_key?.value || '',
        announcement_enabled: settings.announcement_enabled?.value === 'true' || false,
        announcement_title: migrateObjectToLocale(settings.announcement_title?.value || ''),
        announcement_message: migrateObjectToLocale(settings.announcement_message?.value || ''),
        announcement_cta_text: migrateObjectToLocale(settings.announcement_cta_text?.value || ''),
        announcement_cta_link: settings.announcement_cta_link?.value || '',
        announcement_reappear_hours: parseInt(settings.announcement_reappear_hours?.value || '1', 10),
      });
    } catch (error: any) {
      // Silently fail
      toast.error('Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    try {
      setSaving(true);
      
      // Process locale fields before saving
      const settingsToSave: Record<string, string> = {
        favicon: generalSettings.favicon,
        logo: generalSettings.logo,
        slogan: typeof generalSettings.slogan === 'string' ? generalSettings.slogan : JSON.stringify(generalSettings.slogan),
        site_name: typeof generalSettings.site_name === 'string' ? generalSettings.site_name : JSON.stringify(generalSettings.site_name),
        site_description: typeof generalSettings.site_description === 'string' ? generalSettings.site_description : JSON.stringify(generalSettings.site_description),
        phone: generalSettings.phone,
        email: generalSettings.email,
        address: typeof generalSettings.address === 'string' ? generalSettings.address : JSON.stringify(generalSettings.address),
        social_facebook: generalSettings.social_facebook,
        social_twitter: generalSettings.social_twitter,
        social_linkedin: generalSettings.social_linkedin,
        social_instagram: generalSettings.social_instagram,
        footer_quick_links: generalSettings.footer_quick_links,
        footer_solutions: generalSettings.footer_solutions,
        google_site_verification: generalSettings.google_site_verification,
        openai_api_key: generalSettings.openai_api_key,
        gemini_api_key: generalSettings.gemini_api_key,
        announcement_enabled: generalSettings.announcement_enabled ? 'true' : 'false',
        announcement_title: typeof generalSettings.announcement_title === 'string' ? generalSettings.announcement_title : JSON.stringify(generalSettings.announcement_title),
        announcement_message: typeof generalSettings.announcement_message === 'string' ? generalSettings.announcement_message : JSON.stringify(generalSettings.announcement_message),
        announcement_cta_text: typeof generalSettings.announcement_cta_text === 'string' ? generalSettings.announcement_cta_text : JSON.stringify(generalSettings.announcement_cta_text),
        announcement_cta_link: generalSettings.announcement_cta_link,
        announcement_reappear_hours: generalSettings.announcement_reappear_hours.toString(),
      };
      
      await updateSettings(settingsToSave);
      
      toast.success('Đã lưu cấu hình thông tin chung');
    } catch (error: any) {
      // Silently fail
      toast.error('Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (section: string) => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(`Đã lưu cấu hình ${section}`);
    }, 800);
  };

  // Helper functions for footer links management
  const parseFooterLinks = (jsonString: string): FooterLink[] => {
    try {
      if (!jsonString) return [];
      const parsed = JSON.parse(jsonString);
      const links = Array.isArray(parsed) ? parsed : [];
      // Normalize name field to locale object
      return links.map(link => ({
        ...link,
        name: migrateObjectToLocale(link.name || '')
      }));
    } catch {
      return [];
    }
  };

  const formatFooterLinks = (links: FooterLink[]): string => {
    return JSON.stringify(links, null, 2);
  };

  const addFooterLink = (field: 'footer_quick_links' | 'footer_solutions') => {
    const links = parseFooterLinks(generalSettings[field]);
    links.push({ name: { vi: '', en: '', ja: '' }, href: '' });
    setGeneralSettings({
      ...generalSettings,
      [field]: formatFooterLinks(links),
    });
  };

  const removeFooterLink = (field: 'footer_quick_links' | 'footer_solutions', index: number) => {
    const links = parseFooterLinks(generalSettings[field]);
    links.splice(index, 1);
    setGeneralSettings({
      ...generalSettings,
      [field]: formatFooterLinks(links),
    });
  };

  const updateFooterLink = (
    field: 'footer_quick_links' | 'footer_solutions',
    index: number,
    key: 'name' | 'href',
    value: string
  ) => {
    const links = parseFooterLinks(generalSettings[field]);
    links[index] = { ...links[index], [key]: value };
    setGeneralSettings({
      ...generalSettings,
      [field]: formatFooterLinks(links),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900">Cấu hình hệ thống</h1>
          <p className="text-gray-500 mt-1">
            Thiết lập các thông số cho website và hệ thống admin
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* AI Provider Selector */}
          <AIProviderSelector
            value={aiProvider}
            onChange={setAiProvider}
          />
        </div>
      </div>

      {/* Translation Controls */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Locale Selector */}
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-gray-500" />
              <Label className="text-sm text-gray-600 whitespace-nowrap">Hiển thị:</Label>
              <Select value={globalLocale} onValueChange={(value: 'vi' | 'en' | 'ja') => setGlobalLocale(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                  <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Tổng quan</TabsTrigger>
          {/* <TabsTrigger value="seo">SEO & Domain</TabsTrigger> */}
          {/* <TabsTrigger value="notifications">Thông báo</TabsTrigger> */}
          {/* <TabsTrigger value="security">Bảo mật</TabsTrigger> */}
          {/* <TabsTrigger value="integrations">Tích hợp</TabsTrigger> */}
        </TabsList>

        <TabsContent value="general">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Thông tin chung</CardTitle>
                <Button
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <LocaleInput
                        label="Tên website"
                        value={getLocaleValue(generalSettings, 'site_name')}
                        onChange={(value) => {
                          const updated = setLocaleValue(generalSettings, 'site_name', value);
                          setGeneralSettings(updated as GeneralSettings);
                        }}
                        placeholder="Nhập tên website"
                        defaultLocale={globalLocale}
                        aiProvider={aiProvider}
                      />
                    </div>
                    <div className="space-y-2">
                      <LocaleInput
                        label="Slogan"
                        value={getLocaleValue(generalSettings, 'slogan')}
                        onChange={(value) => {
                          const updated = setLocaleValue(generalSettings, 'slogan', value);
                          setGeneralSettings(updated as GeneralSettings);
                        }}
                        placeholder="Smart Solutions Business"
                        defaultLocale={globalLocale}
                        aiProvider={aiProvider}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <LocaleInput
                      label="Mô tả ngắn (hiển thị trong footer)"
                      value={getLocaleValue(generalSettings, 'site_description')}
                      onChange={(value) => {
                        const updated = setLocaleValue(generalSettings, 'site_description', value);
                        setGeneralSettings(updated as GeneralSettings);
                      }}
                      placeholder="Mô tả về công ty..."
                      multiline={true}
                      defaultLocale={globalLocale}
                      aiProvider={aiProvider}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="favicon">Favicon</Label>
                      <ImageUpload
                        currentImage={generalSettings.favicon}
                        onImageSelect={(url) => setGeneralSettings({ ...generalSettings, favicon: url })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo</Label>
                      <ImageUpload
                        currentImage={generalSettings.logo}
                        onImageSelect={(url) => setGeneralSettings({ ...generalSettings, logo: url })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={generalSettings.phone}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                        placeholder="0888 917 999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email liên hệ</Label>
                      <Input
                        id="email"
                        type="email"
                        value={generalSettings.email}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                        placeholder="info@thuvien-tn.vn"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <LocaleInput
                      label="Địa chỉ"
                      value={getLocaleValue(generalSettings, 'address')}
                      onChange={(value) => {
                        const updated = setLocaleValue(generalSettings, 'address', value);
                        setGeneralSettings(updated as GeneralSettings);
                      }}
                      placeholder="Địa chỉ văn phòng..."
                      multiline={true}
                      defaultLocale={globalLocale}
                      aiProvider={aiProvider}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">Liên kết mạng xã hội</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="social_facebook">Facebook</Label>
                        <Input
                          id="social_facebook"
                          type="url"
                          value={generalSettings.social_facebook}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, social_facebook: e.target.value })}
                          placeholder="https://www.facebook.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="social_twitter">Twitter</Label>
                        <Input
                          id="social_twitter"
                          type="url"
                          value={generalSettings.social_twitter}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, social_twitter: e.target.value })}
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="social_linkedin">LinkedIn</Label>
                        <Input
                          id="social_linkedin"
                          type="url"
                          value={generalSettings.social_linkedin}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, social_linkedin: e.target.value })}
                          placeholder="https://www.linkedin.com/..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="social_instagram">Instagram</Label>
                        <Input
                          id="social_instagram"
                          type="url"
                          value={generalSettings.social_instagram}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, social_instagram: e.target.value })}
                          placeholder="https://www.instagram.com/..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">SEO & Xác minh</Label>
                    <div className="space-y-2">
                      <Label htmlFor="google_site_verification">
                        Google Site Verification Code
                      </Label>
                      <Input
                        id="google_site_verification"
                        value={generalSettings.google_site_verification}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, google_site_verification: e.target.value })}
                        placeholder="nskAzb2wgDby-HUyaAmxjuyMNgkQ1Z-GSbTs-Tx1RJw"
                      />
                      <p className="text-sm text-gray-500">
                        Mã xác minh từ Google Search Console. Sẽ được tự động thêm vào meta tag trong HTML.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">API Keys cho Dịch thuật AI</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="openai_api_key">
                          OpenAI API Key
                        </Label>
                        <Input
                          id="openai_api_key"
                          type="password"
                          value={generalSettings.openai_api_key}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, openai_api_key: e.target.value })}
                          placeholder="sk-proj-..."
                        />
                        <p className="text-sm text-gray-500">
                          API key từ OpenAI để sử dụng dịch thuật bằng GPT-4o-mini.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gemini_api_key">
                          Google Gemini API Key
                        </Label>
                        <Input
                          id="gemini_api_key"
                          type="password"
                          value={generalSettings.gemini_api_key}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, gemini_api_key: e.target.value })}
                          placeholder="AIzaSy..."
                        />
                        <p className="text-sm text-gray-500">
                          API key từ Google Gemini để sử dụng dịch thuật bằng Gemini AI.
                        </p>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Lưu ý:</strong> API keys sẽ được lưu trong database và sử dụng cho dịch thuật tự động. 
                        Đảm bảo API keys có đủ quota và quyền truy cập.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">Announcement Bar (Thanh thông báo)</Label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Bật Announcement Bar</Label>
                          <p className="text-xs text-gray-600 mt-1">
                            Hiển thị thanh thông báo ở đầu trang với nội dung khuyến mãi hoặc thông báo quan trọng
                          </p>
                        </div>
                        <Switch
                          checked={generalSettings.announcement_enabled}
                          onCheckedChange={(checked) => 
                            setGeneralSettings({ ...generalSettings, announcement_enabled: checked })
                          }
                        />
                      </div>

                      {generalSettings.announcement_enabled && (
                        <div className="space-y-4 pt-4 border-t border-blue-200">
                          <div className="space-y-2">
                            <LocaleInput
                              label="Tiêu đề"
                              value={getLocaleValue(generalSettings, 'announcement_title')}
                              onChange={(value) => {
                                const updated = setLocaleValue(generalSettings, 'announcement_title', value);
                                setGeneralSettings(updated as GeneralSettings);
                              }}
                              placeholder="Khuyến mãi đặc biệt"
                              defaultLocale={globalLocale}
                              aiProvider={aiProvider}
                            />
                          </div>

                          <div className="space-y-2">
                            <LocaleInput
                              label="Nội dung thông báo"
                              value={getLocaleValue(generalSettings, 'announcement_message')}
                              onChange={(value) => {
                                const updated = setLocaleValue(generalSettings, 'announcement_message', value);
                                setGeneralSettings(updated as GeneralSettings);
                              }}
                              placeholder="Giảm 20% cho khách hàng mới đăng ký tư vấn trong tháng 12!"
                              multiline={true}
                              defaultLocale={globalLocale}
                              aiProvider={aiProvider}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <LocaleInput
                                label="Text nút CTA"
                                value={getLocaleValue(generalSettings, 'announcement_cta_text')}
                                onChange={(value) => {
                                  const updated = setLocaleValue(generalSettings, 'announcement_cta_text', value);
                                  setGeneralSettings(updated as GeneralSettings);
                                }}
                                placeholder="Nhận ưu đãi"
                                defaultLocale={globalLocale}
                                aiProvider={aiProvider}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="announcement_cta_link">Link CTA</Label>
                              <Input
                                id="announcement_cta_link"
                                value={generalSettings.announcement_cta_link}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, announcement_cta_link: e.target.value })}
                                placeholder="/contact hoặc /vi/contact"
                              />
                              <p className="text-xs text-gray-500">
                                Đường dẫn khi click vào nút CTA (có thể dùng /contact hoặc /vi/contact)
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="announcement_reappear_hours">Thời gian hiển thị lại (giờ)</Label>
                            <Input
                              id="announcement_reappear_hours"
                              type="number"
                              min="1"
                              max="168"
                              value={generalSettings.announcement_reappear_hours}
                              onChange={(e) => setGeneralSettings({ 
                                ...generalSettings, 
                                announcement_reappear_hours: parseInt(e.target.value) || 1 
                              })}
                              placeholder="1"
                            />
                            <p className="text-xs text-gray-500">
                              Sau khi người dùng đóng thông báo, sẽ tự động hiển thị lại sau số giờ này (mặc định: 1 giờ)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">Quản lý Footer Links</Label>
                    
                    {/* Quick Links */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Liên kết nhanh</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addFooterLink('footer_quick_links')}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm link
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 border rounded-lg p-3 bg-gray-50">
                        {parseFooterLinks(generalSettings.footer_quick_links).map((link, idx) => (
                          <Card key={idx} className="border border-gray-200 shadow-sm">
                            <CardContent className="p-3">
                              <div className="flex flex-col gap-2">
                                <LocaleInput
                                  label="Tên link"
                                  value={getLocaleValue(link, 'name')}
                                  onChange={(value) => {
                                    const links = parseFooterLinks(generalSettings.footer_quick_links);
                                    links[idx] = { ...links[idx], name: value };
                                    setGeneralSettings({
                                      ...generalSettings,
                                      footer_quick_links: formatFooterLinks(links)
                                    });
                                  }}
                                  placeholder="Tên link"
                                  defaultLocale={globalLocale}
                                  aiProvider={aiProvider}
                                />
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="/path"
                                    value={link.href}
                                    onChange={(e) => updateFooterLink('footer_quick_links', idx, 'href', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFooterLink('footer_quick_links', idx)}
                                    className="h-8 w-8 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {parseFooterLinks(generalSettings.footer_quick_links).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">Chưa có link nào. Click "Thêm link" để thêm.</p>
                        )}
                      </div>
                    </div>

                    {/* Solutions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Dịch vụ</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addFooterLink('footer_solutions')}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm dịch vụ
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 border rounded-lg p-3 bg-gray-50">
                        {parseFooterLinks(generalSettings.footer_solutions).map((link, idx) => (
                          <Card key={idx} className="border border-gray-200 shadow-sm">
                            <CardContent className="p-3">
                              <div className="flex flex-col gap-2">
                                <LocaleInput
                                  label="Tên dịch vụ"
                                  value={getLocaleValue(link, 'name')}
                                  onChange={(value) => {
                                    const links = parseFooterLinks(generalSettings.footer_solutions);
                                    links[idx] = { ...links[idx], name: value };
                                    setGeneralSettings({
                                      ...generalSettings,
                                      footer_solutions: formatFooterLinks(links)
                                    });
                                  }}
                                  placeholder="Tên dịch vụ"
                                  defaultLocale={globalLocale}
                                  aiProvider={aiProvider}
                                />
                                <div className="flex items-center gap-2">
                                  <Input
                                    placeholder="/path"
                                    value={link.href}
                                    onChange={(e) => updateFooterLink('footer_solutions', idx, 'href', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFooterLink('footer_solutions', idx)}
                                    className="h-8 w-8 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {parseFooterLinks(generalSettings.footer_solutions).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-2">Chưa có dịch vụ nào. Click "Thêm dịch vụ" để thêm.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* <div className="flex items-center justify-between border rounded-lg p-4 bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">
                        Bảo trì hệ thống (Maintenance Mode)
                      </p>
                      <p className="text-sm text-gray-500">
                        Bật chế độ bảo trì sẽ hiển thị thông báo tạm dừng với người
                        dùng.
                      </p>
                    </div>
                    <Switch />
                  </div> */}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* <TabsContent value="seo">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="w-5 h-5" />
                SEO & Domain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain chính</Label>
                <Input
                  id="domain"
                  defaultValue="https://www.thuvien-tn.vn"
                  placeholder="https://"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta title mặc định</Label>
                <Input
                  id="metaTitle"
                  defaultValue="Thư viện TN - Hệ thống quản lý thư viện và khóa học"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta description</Label>
                <Textarea
                  id="metaDescription"
                  rows={3}
                  defaultValue="Thư viện TN - Hệ thống quản lý thư viện và khóa học hiện đại."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                  <Input
                    id="googleAnalytics"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                  <Input id="facebookPixel" placeholder="XXXXXXXXXXXXXXX" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave("SEO & Domain")}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu cấu hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* <TabsContent value="notifications">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Thông báo & Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border rounded-lg p-4 bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">
                      Email thông báo hệ thống
                    </p>
                    <p className="text-sm text-gray-500">
                      Gửi email khi có lỗi hệ thống hoặc đăng nhập bất thường.
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4 bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">
                      Thông báo cho bài viết mới
                    </p>
                    <p className="text-sm text-gray-500">
                      Gửi email thông báo cho admin khi có bài viết mới.
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpServer">SMTP Server</Label>
                <Input
                  id="smtpServer"
                  placeholder="smtp.gmail.com"
                  defaultValue="smtp.gmail.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP User</Label>
                  <Input id="smtpUser" placeholder="username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input id="smtpPort" placeholder="587" defaultValue="587" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave("thông báo & email")}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu cấu hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* <TabsContent value="security">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between border rounded-lg p-4 bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">
                      Bật xác thực hai lớp (2FA)
                    </p>
                    <p className="text-sm text-gray-500">
                      Tăng cường bảo mật cho tài khoản admin.
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between border rounded-lg p-4 bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">
                      Giới hạn IP đăng nhập
                    </p>
                    <p className="text-sm text-gray-500">
                      Chỉ cho phép đăng nhập từ một số IP nhất định.
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedIps">Danh sách IP cho phép</Label>
                <Textarea
                  id="allowedIps"
                  rows={3}
                  placeholder="192.168.1.1&#10;10.0.0.1"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave("bảo mật")}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu cấu hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* <TabsContent value="integrations">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Tích hợp hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiBaseUrl">API base URL</Label>
                <Input
                  id="apiBaseUrl"
                  defaultValue="http://localhost:4000"
                  placeholder="http://localhost:4000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cmsUrl">CMS URL (Thư viện TN)</Label>
                <Input
                  id="cmsUrl"
                  defaultValue="http://localhost:5173"
                  placeholder="http://localhost:5173"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook khi có bài viết mới</Label>
                <Input
                  id="webhook"
                  placeholder="https://example.com/webhook"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave("tích hợp")}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu cấu hình
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
