"use client";
import { useState, useEffect } from "react";
import { Save, MessageCircle, MapPin, Phone, Mail, Clock, Facebook, Linkedin, Twitter, Youtube, CheckCircle2, ChevronDown, ChevronUp, Languages, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { getCleanValue } from "@/lib/utils/locale-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as LucideIcons from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Preview components removed - public pages deleted
// import { ContactHero } from "@/pages/Contact/ContactHero";
// import { ContactInfoCards } from "@/pages/Contact/ContactInfoCards";
// import { ContactForm } from "@/pages/Contact/ContactForm";
// import { ContactSidebar } from "@/pages/Contact/ContactSidebar";
// import { ContactMap } from "@/pages/Contact/ContactMap";
// Interfaces
interface HeroData {
  id?: number;
  badge: string;
  title: {
    prefix: string;
    highlight: string;
  };
  description: string;
  iconName: string;
  image: string;
  isActive: boolean;
}

interface InfoCardItem {
  id?: number;
  iconName: string;
  title: string;
  content: string;
  link: string | null;
  gradient: string;
  sortOrder: number;
  isActive: boolean;
}

interface InfoCardsData {
  id?: number;
  items: InfoCardItem[];
  isActive: boolean;
}

interface FormData {
  id?: number;
  header: string;
  description: string;
  fields: {
    name: { label: string; placeholder: string };
    email: { label: string; placeholder: string };
    phone: { label: string; placeholder: string };
    company: { label: string; placeholder: string };
    service: { label: string; placeholder: string };
    message: { label: string; placeholder: string };
  };
  button: {
    submit: string;
    success: string;
  };
  services: string[];
  isActive: boolean;
}

interface OfficeItem {
  id?: number;
  title?: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  sortOrder: number;
  isActive: boolean;
}

interface SocialItem {
  id?: number;
  iconName: string;
  href: string;
  label: string;
  gradient: string;
  sortOrder: number;
  isActive: boolean;
}

interface SidebarData {
  id?: number;
  quickActions: {
    title: string;
    description: string;
    buttons: {
      hotline: { label: string; value: string; href: string };
      appointment: { label: string; value: string; href: string };
    };
  };
  offices: OfficeItem[];
  officesTitle?: string;
  socials: SocialItem[];
  isActive: boolean;
}

interface MapData {
  id?: number;
  address: string;
  iframeSrc: string;
  isActive: boolean;
}

// Icon options
const ICON_OPTIONS = [
  "MessageCircle", "MapPin", "Phone", "Mail", "Clock",
  "Facebook", "Linkedin", "Twitter", "Youtube",
  "Code2", "MonitorSmartphone", "Network", "Globe2",
  "ShieldCheck", "Users", "Award", "Target", "Sparkles",
];

const GRADIENT_OPTIONS = [
  { value: "from-blue-500 to-cyan-500", label: "Xanh dương - Cyan" },
  { value: "from-purple-500 to-pink-500", label: "Tím - Hồng" },
  { value: "from-emerald-500 to-teal-500", label: "Xanh lá - Teal" },
  { value: "from-orange-500 to-amber-500", label: "Cam - Vàng" },
  { value: "from-sky-500 to-blue-600", label: "Sky - Blue" },
  { value: "from-rose-500 to-pink-500", label: "Rose - Pink" },
  { value: "from-indigo-500 to-purple-500", label: "Indigo - Purple" },
  { value: "from-green-500 to-emerald-500", label: "Green - Emerald" },
];

export default function AdminContactPage() {

  // Hero State
  const [heroData, setHeroData] = useState<HeroData>({
    badge: "",
    title: { prefix: "", highlight: "" },
    description: "",
    iconName: "MessageCircle",
    image: "",
    isActive: true,
  });
  const [loadingHero, setLoadingHero] = useState(false);

  // Info Cards State
  const [infoCardsData, setInfoCardsData] = useState<InfoCardsData>({
    items: [],
    isActive: true,
  });
  const [loadingInfoCards, setLoadingInfoCards] = useState(false);
  const [editingInfoCardIndex, setEditingInfoCardIndex] = useState<number | null>(null);
  const [infoCardFormData, setInfoCardFormData] = useState<InfoCardItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<FormData>({
    header: "",
    description: "",
    fields: {
      name: { label: "", placeholder: "" },
      email: { label: "", placeholder: "" },
      phone: { label: "", placeholder: "" },
      company: { label: "", placeholder: "" },
      service: { label: "", placeholder: "" },
      message: { label: "", placeholder: "" },
    },
    button: { submit: "", success: "" },
    services: [],
    isActive: true,
  });
  const [loadingForm, setLoadingForm] = useState(false);
  const [newService, setNewService] = useState<string>("");

  // Sidebar State
  const [sidebarData, setSidebarData] = useState<SidebarData>({
    quickActions: {
      title: "",
      description: "",
      buttons: {
        hotline: { label: "", value: "", href: "" },
        appointment: { label: "", value: "", href: "" },
      },
    },
    offices: [],
    officesTitle: "",
    socials: [],
    isActive: true,
  });
  const [loadingSidebar, setLoadingSidebar] = useState(false);
  const [editingOfficeIndex, setEditingOfficeIndex] = useState<number | null>(null);
  const [officeFormData, setOfficeFormData] = useState<OfficeItem | null>(null);
  const [editingSocialIndex, setEditingSocialIndex] = useState<number | null>(null);
  const [socialFormData, setSocialFormData] = useState<SocialItem | null>(null);

  // Map State
  const [mapData, setMapData] = useState<MapData>({
    address: "",
    iframeSrc: "",
    isActive: true,
  });
  const [loadingMap, setLoadingMap] = useState(false);

  // Fetch functions
  const fetchHero = async () => {
    try {
      setLoadingHero(true);
      const data = await adminApiCall<{ success: boolean; data?: HeroData }>(
        AdminEndpoints.contact.hero.get,
      );
      if (data?.data) {
        setHeroData(data.data);
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải hero");
    } finally {
      setLoadingHero(false);
    }
  };

  const fetchInfoCards = async () => {
    try {
      setLoadingInfoCards(true);
      const data = await adminApiCall<{ success: boolean; data?: InfoCardsData }>(
        AdminEndpoints.contact.infoCards.get,
      );
      if (data?.data) {
        setInfoCardsData(data.data);
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải info cards");
    } finally {
      setLoadingInfoCards(false);
    }
  };

  const fetchForm = async () => {
    try {
      setLoadingForm(true);
      const data = await adminApiCall<{ success: boolean; data?: FormData }>(
        AdminEndpoints.contact.form.get,
      );
      if (data?.data) {
        setFormData(data.data);
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải form");
    } finally {
      setLoadingForm(false);
    }
  };

  const fetchSidebar = async () => {
    try {
      setLoadingSidebar(true);
      const data = await adminApiCall<{ success: boolean; data?: SidebarData }>(
        AdminEndpoints.contact.sidebar.get,
      );
      if (data?.data) {
        setSidebarData(data.data);
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải sidebar");
    } finally {
      setLoadingSidebar(false);
    }
  };

  const fetchMap = async () => {
    try {
      setLoadingMap(true);
      const data = await adminApiCall<{ success: boolean; data?: MapData }>(
        AdminEndpoints.contact.map.get,
      );
      if (data?.data) {
        setMapData(data.data);
      }
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải map");
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    void fetchHero();
    void fetchInfoCards();
    void fetchForm();
    void fetchSidebar();
    void fetchMap();
  }, []);

  // Collapse state for config blocks (default: all hidden)
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({
    heroSection: true,
    infoCards: true,
    contactForm: true,
    sidebar: true,
    mapSection: true,
  });

  const toggleBlock = (blockKey: string) => {
    setCollapsedBlocks(prev => ({
      ...prev,
      [blockKey]: !prev[blockKey]
    }));
  };

  // Save handlers
  const handleSaveHero = async () => {
    try {
      setLoadingHero(true);
      await adminApiCall(AdminEndpoints.contact.hero.update, {
        method: "PUT",
        body: JSON.stringify(heroData),
      });
      toast.success("Đã lưu hero thành công");
      void fetchHero();
    } catch (error: any) {
      toast.error(error?.message || "Không thể lưu hero");
    } finally {
      setLoadingHero(false);
    }
  };

  const handleSaveInfoCards = async () => {
    try {
      setLoadingInfoCards(true);
      await adminApiCall(AdminEndpoints.contact.infoCards.update, {
        method: "PUT",
        body: JSON.stringify(infoCardsData),
      });
      toast.success("Đã lưu info cards thành công");
      void fetchInfoCards();
    } catch (error: any) {
      toast.error(error?.message || "Không thể lưu info cards");
    } finally {
      setLoadingInfoCards(false);
    }
  };

  const handleSaveForm = async () => {
    try {
      setLoadingForm(true);
      await adminApiCall(AdminEndpoints.contact.form.update, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      toast.success("Đã lưu form thành công");
      void fetchForm();
    } catch (error: any) {
      toast.error(error?.message || "Không thể lưu form");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleSaveSidebar = async () => {
    try {
      setLoadingSidebar(true);
      await adminApiCall(AdminEndpoints.contact.sidebar.update, {
        method: "PUT",
        body: JSON.stringify(sidebarData),
      });
      toast.success("Đã lưu sidebar thành công");
      void fetchSidebar();
    } catch (error: any) {
      toast.error(error?.message || "Không thể lưu sidebar");
    } finally {
      setLoadingSidebar(false);
    }
  };

  const handleSaveMap = async () => {
    try {
      setLoadingMap(true);
      await adminApiCall(AdminEndpoints.contact.map.update, {
        method: "PUT",
        body: JSON.stringify(mapData),
      });
      toast.success("Đã lưu map thành công");
      void fetchMap();
    } catch (error: any) {
      toast.error(error?.message || "Không thể lưu map");
    } finally {
      setLoadingMap(false);
    }
  };

  // Info Card handlers
  const handleAddInfoCard = () => {
    const newItem: InfoCardItem = {
      iconName: "MapPin",
      title: "",
      content: "",
      link: null,
      gradient: GRADIENT_OPTIONS[0].value,
      sortOrder: infoCardsData.items.length,
      isActive: true,
    };
    setInfoCardsData({
      ...infoCardsData,
      items: [...infoCardsData.items, newItem],
    });
    setEditingInfoCardIndex(infoCardsData.items.length);
    setInfoCardFormData(newItem);
  };

  const handleEditInfoCard = (index: number) => {
    setEditingInfoCardIndex(index);
    setInfoCardFormData(infoCardsData.items[index]);
  };

  const handleSaveInfoCard = () => {
    if (!infoCardFormData || editingInfoCardIndex === null) return;
    const newItems = [...infoCardsData.items];
    newItems[editingInfoCardIndex] = infoCardFormData;
    setInfoCardsData({ ...infoCardsData, items: newItems });
    setEditingInfoCardIndex(null);
    setInfoCardFormData(null);
  };

  const handleDeleteInfoCard = (index: number) => {
    const newItems = infoCardsData.items.filter((_, i) => i !== index);
    setInfoCardsData({ ...infoCardsData, items: newItems });
  };

  // Office handlers
  const handleAddOffice = () => {
    const newItem: OfficeItem = {
      title: "",
      city: "",
      address: "",
      phone: "",
      email: "",
      sortOrder: sidebarData.offices.length,
      isActive: true,
    };
    setSidebarData({
      ...sidebarData,
      offices: [...sidebarData.offices, newItem],
    });
    setEditingOfficeIndex(sidebarData.offices.length);
    setOfficeFormData(newItem);
  };

  const handleEditOffice = (index: number) => {
    setEditingOfficeIndex(index);
    setOfficeFormData(sidebarData.offices[index]);
  };

  const handleSaveOffice = () => {
    if (!officeFormData || editingOfficeIndex === null) return;
    const newOffices = [...sidebarData.offices];
    newOffices[editingOfficeIndex] = officeFormData;
    setSidebarData({ ...sidebarData, offices: newOffices });
    setEditingOfficeIndex(null);
    setOfficeFormData(null);
  };

  const handleDeleteOffice = (index: number) => {
    const newOffices = sidebarData.offices.filter((_, i) => i !== index);
    setSidebarData({ ...sidebarData, offices: newOffices });
  };

  // Social handlers
  const handleAddSocial = () => {
    const newItem: SocialItem = {
      iconName: "Facebook",
      href: "",
      label: "",
      gradient: GRADIENT_OPTIONS[0].value,
      sortOrder: sidebarData.socials.length,
      isActive: true,
    };
    setSidebarData({
      ...sidebarData,
      socials: [...sidebarData.socials, newItem],
    });
    setEditingSocialIndex(sidebarData.socials.length);
    setSocialFormData(newItem);
  };

  const handleEditSocial = (index: number) => {
    setEditingSocialIndex(index);
    setSocialFormData(sidebarData.socials[index]);
  };

  const handleSaveSocial = () => {
    if (!socialFormData || editingSocialIndex === null) return;
    const newSocials = [...sidebarData.socials];
    newSocials[editingSocialIndex] = socialFormData;
    setSidebarData({ ...sidebarData, socials: newSocials });
    setEditingSocialIndex(null);
    setSocialFormData(null);
  };

  const handleDeleteSocial = (index: number) => {
    const newSocials = sidebarData.socials.filter((_, i) => i !== index);
    setSidebarData({ ...sidebarData, socials: newSocials });
  };

  // Form service handlers
  const handleAddService = () => {
    if (newService && newService.trim()) {
      setFormData({
        ...formData,
        services: [...formData.services, newService.trim()],
      });
      setNewService("");
    } else {
      toast.error("Vui lòng nhập tên dịch vụ");
    }
  };

  const handleDeleteService = (index: number) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };


  // Active main tab state
  const [activeMainTab, setActiveMainTab] = useState<string>("hero");

  // Tab configuration with descriptions
  const tabsConfig = [
    {
      value: "hero",
      label: "Hero",
      description: "Banner đầu trang với tiêu đề..",
      icon: MessageCircle,
    },
    {
      value: "info-cards",
      label: "Info Cards",
      description: "Thẻ thông tin liên hệ",
      icon: MapPin,
    },
    {
      value: "form",
      label: "Form",
      description: "Biểu mẫu liên hệ",
      icon: Mail,
    },
    {
      value: "sidebar",
      label: "Sidebar",
      description: "Thanh bên với văn phòng..",
      icon: Phone,
    },
    {
      value: "map",
      label: "Map",
      description: "Bản đồ và địa chỉ",
      icon: MapPin,
    },
  ];

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveMainTab(value);
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý trang Liên hệ</h1>
          <p className="text-gray-600 mt-1">Cấu hình và quản lý nội dung trang liên hệ (Tiếng Việt)</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {tabsConfig.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeMainTab === tab.value;
              const isCompleted = tabsConfig.findIndex(t => t.value === activeMainTab) > index;

              return (
                <div key={tab.value} className="flex items-center flex-1">
                  <button
                    onClick={() => handleTabChange(tab.value)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-2 border-blue-500"
                        : isCompleted
                        ? "bg-green-50 text-green-700 border-2 border-green-300"
                        : "bg-gray-50 text-gray-600 border-2 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{tab.label}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </button>
                  {index < tabsConfig.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-gray-300"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeMainTab} onValueChange={handleTabChange} className="w-full">

        {/* Hero Tab */}
        <TabsContent value="hero" className="space-y-4 mt-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList>
              <TabsTrigger value="config">Cấu hình</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4 mt-4">
              {/* Tab Controls - Locale Selector và Translate Button
              <Card className="mb-4">
                ...
              </Card> */}

              <Card>
                <CardHeader className="p-0">
                  <div
                    className="flex items-center justify-between w-full px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                    onClick={() => toggleBlock("heroSection")}
                  >
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900 mb-1">
                        {collapsedBlocks.heroSection ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        )}
                        Hero Section
                      </CardTitle>
                      <p className="text-sm text-gray-600 ml-8">Cấu hình phần hero của trang liên hệ</p>
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); handleSaveHero(); }} disabled={loadingHero} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {loadingHero ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedBlocks.heroSection && (
                  <CardContent className="space-y-4 px-6 py-4">
                  <div>
                    <Label>Badge</Label>
                    <Input
                      value={heroData.badge}
                      onChange={(e) => setHeroData({ ...heroData, badge: e.target.value })}
                      placeholder="LIÊN HỆ VỚI CHÚNG TÔI"
                    />
                  </div>
                  <div>
                    <Label>Title Prefix</Label>
                    <Input
                      value={heroData.title.prefix}
                      onChange={(e) => setHeroData({ ...heroData, title: { ...heroData.title, prefix: e.target.value } })}
                      placeholder="Hãy để chúng tôi"
                    />
                  </div>
                  <div>
                    <Label>Title Highlight</Label>
                    <Input
                      value={heroData.title.highlight}
                      onChange={(e) => setHeroData({ ...heroData, title: { ...heroData.title, highlight: e.target.value } })}
                      placeholder="hỗ trợ bạn"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={heroData.description}
                      onChange={(e) => setHeroData({ ...heroData, description: e.target.value })}
                      placeholder="Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng tư vấn và hỗ trợ bạn 24/7"
                    />
                  </div>
                  <div>
                    <Label>Icon Name</Label>
                    <Select
                      value={heroData.iconName}
                      onValueChange={(value) => setHeroData({ ...heroData, iconName: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Image</Label>
                    <ImageUpload
                      currentImage={heroData.image}
                      onImageSelect={(url) => setHeroData({ ...heroData, image: url })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Kích hoạt</Label>
                    <Switch
                      checked={heroData.isActive}
                      onCheckedChange={(checked) => setHeroData({ ...heroData, isActive: checked })}
                    />
                  </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

          </Tabs>
        </TabsContent>

        {/* Info Cards Tab - Continue in next part due to length */}
        <TabsContent value="info-cards" className="space-y-4 mt-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList>
              <TabsTrigger value="config">Cấu hình</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="p-0">
                  <div
                    className="flex items-center justify-between w-full px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                    onClick={() => toggleBlock("infoCards")}
                  >
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900 mb-1">
                        {collapsedBlocks.infoCards ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        )}
                        Info Cards
                      </CardTitle>
                      <p className="text-sm text-gray-600 ml-8">Quản lý các thẻ thông tin liên hệ</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={(e) => { e.stopPropagation(); handleAddInfoCard(); }} size="sm" variant="outline">
                        Thêm Card
                      </Button>
                      <Button onClick={(e) => { e.stopPropagation(); handleSaveInfoCards(); }} disabled={loadingInfoCards} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        {loadingInfoCards ? "Đang lưu..." : "Lưu"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {!collapsedBlocks.infoCards && (
                  <CardContent className="space-y-4 px-6 py-4">
                  {infoCardsData.items.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold">Card {index + 1}</h4>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditInfoCard(index)}
                              size="sm"
                              variant="outline"
                            >
                              Sửa
                            </Button>
                            <Button
                              onClick={() => handleDeleteInfoCard(index)}
                              size="sm"
                              variant="destructive"
                            >
                              Xóa
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p><strong>Icon:</strong> {item.iconName}</p>
                          <p><strong>Title:</strong> {item.title}</p>
                          <p><strong>Content:</strong> {item.content}</p>
                          <p><strong>Link:</strong> {item.link || "N/A"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  </CardContent>
                )}
              </Card>

              {/* Edit Dialog */}
              <Dialog open={editingInfoCardIndex !== null} onOpenChange={(open) => {
                if (!open) {
                  setEditingInfoCardIndex(null);
                  setInfoCardFormData(null);
                }
              }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa Info Card</DialogTitle>
                  </DialogHeader>
                  {infoCardFormData && (
                    <div className="space-y-4">
                      <div>
                        <Label>Icon Name</Label>
                        <Select
                          value={infoCardFormData.iconName}
                          onValueChange={(value) => setInfoCardFormData({ ...infoCardFormData, iconName: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((icon) => (
                              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={infoCardFormData.title}
                          onChange={(e) => setInfoCardFormData({ ...infoCardFormData, title: e.target.value })}
                          placeholder="Tiêu đề"
                        />
                      </div>
                      <div>
                        <Label>Content</Label>
                        <Textarea
                          value={infoCardFormData.content}
                          onChange={(e) => setInfoCardFormData({ ...infoCardFormData, content: e.target.value })}
                          placeholder="Nội dung"
                        />
                      </div>
                      <div>
                        <Label>Link (optional)</Label>
                        <Input
                          value={infoCardFormData.link || ""}
                          onChange={(e) => setInfoCardFormData({ ...infoCardFormData, link: e.target.value || null })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label>Gradient</Label>
                        <Select
                          value={infoCardFormData.gradient}
                          onValueChange={(value) => setInfoCardFormData({ ...infoCardFormData, gradient: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADIENT_OPTIONS.map((grad) => (
                              <SelectItem key={grad.value} value={grad.value}>{grad.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Kích hoạt</Label>
                        <Switch
                          checked={infoCardFormData.isActive}
                          onCheckedChange={(checked) => setInfoCardFormData({ ...infoCardFormData, isActive: checked })}
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingInfoCardIndex(null);
                        setInfoCardFormData(null);
                      }}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleSaveInfoCard}>Lưu</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

          </Tabs>
        </TabsContent>

        {/* Form Tab */}
        <TabsContent value="form" className="space-y-4 mt-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList>
              <TabsTrigger value="config">Cấu hình</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4 mt-4">
              {/* Tab Controls - Locale Selector và Translate Button
              <Card className="mb-4">
                ...
              </Card> */}

              <Card>
                <CardHeader className="p-0">
                  <div
                    className="flex items-center justify-between w-full px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                    onClick={() => toggleBlock("contactForm")}
                  >
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900 mb-1">
                        {collapsedBlocks.contactForm ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        )}
                        Contact Form
                      </CardTitle>
                      <p className="text-sm text-gray-600 ml-8">Cấu hình form liên hệ</p>
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); handleSaveForm(); }} disabled={loadingForm} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {loadingForm ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedBlocks.contactForm && (
                  <CardContent className="space-y-4 px-6 py-4">
                  <div>
                    <Label>Header</Label>
                    <Input
                      value={formData.header}
                      onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                      placeholder="Gửi yêu cầu tư vấn"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Điền thông tin bên dưới..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name Label</Label>
                      <Input
                        value={formData.fields.name.label}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, name: { ...formData.fields.name, label: e.target.value } },
                        })}
                        placeholder="Họ và tên"
                      />
                    </div>
                    <div>
                      <Label>Name Placeholder</Label>
                      <Input
                        value={formData.fields.name.placeholder}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, name: { ...formData.fields.name, placeholder: e.target.value } },
                        })}
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email Label</Label>
                      <Input
                        value={formData.fields.email.label}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, email: { ...formData.fields.email, label: e.target.value } },
                        })}
                        placeholder="Email"
                      />
                    </div>
                    <div>
                      <Label>Email Placeholder</Label>
                      <Input
                        value={formData.fields.email.placeholder}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, email: { ...formData.fields.email, placeholder: e.target.value } },
                        })}
                        placeholder="Nhập email"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone Label</Label>
                      <Input
                        value={formData.fields.phone.label}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, phone: { ...formData.fields.phone, label: e.target.value } },
                        })}
                        placeholder="Số điện thoại"
                      />
                    </div>
                    <div>
                      <Label>Phone Placeholder</Label>
                      <Input
                        value={formData.fields.phone.placeholder}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, phone: { ...formData.fields.phone, placeholder: e.target.value } },
                        })}
                        placeholder="Nhập số điện thoại"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Company Label</Label>
                      <Input
                        value={formData.fields.company.label}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, company: { ...formData.fields.company, label: e.target.value } },
                        })}
                        placeholder="Công ty"
                      />
                    </div>
                    <div>
                      <Label>Company Placeholder</Label>
                      <Input
                        value={formData.fields.company.placeholder}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, company: { ...formData.fields.company, placeholder: e.target.value } },
                        })}
                        placeholder="Nhập tên công ty"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Service Label</Label>
                      <Input
                        value={formData.fields.service.label}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, service: { ...formData.fields.service, label: e.target.value } },
                        })}
                        placeholder="Dịch vụ"
                      />
                    </div>
                    <div>
                      <Label>Service Placeholder</Label>
                      <Input
                        value={formData.fields.service.placeholder}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, service: { ...formData.fields.service, placeholder: e.target.value } },
                        })}
                        placeholder="Chọn dịch vụ"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Message Label</Label>
                      <Input
                        value={formData.fields.message.label}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, message: { ...formData.fields.message, label: e.target.value } },
                        })}
                        placeholder="Tin nhắn"
                      />
                    </div>
                    <div>
                      <Label>Message Placeholder</Label>
                      <Input
                        value={formData.fields.message.placeholder}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: { ...formData.fields, message: { ...formData.fields.message, placeholder: e.target.value } },
                        })}
                        placeholder="Nhập tin nhắn"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Button Submit</Label>
                      <Input
                        value={formData.button.submit}
                        onChange={(e) => setFormData({
                          ...formData,
                          button: { ...formData.button, submit: e.target.value },
                        })}
                        placeholder="Gửi"
                      />
                    </div>
                    <div>
                      <Label>Button Success</Label>
                      <Input
                        value={formData.button.success}
                        onChange={(e) => setFormData({
                          ...formData,
                          button: { ...formData.button, success: e.target.value },
                        })}
                        placeholder="Gửi thành công"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Services</Label>
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1">
                        <Input
                          value={newService}
                          onChange={(e) => setNewService(e.target.value)}
                          placeholder="Thêm dịch vụ mới"
                        />
                      </div>
                      <Button onClick={handleAddService} type="button" className="mt-6">Thêm</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {formData.services.map((service, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors relative">
                          <Button
                            onClick={() => handleDeleteService(index)}
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <div className="flex flex-col gap-2 pr-8">
                            <span className="text-sm text-gray-900 truncate" title={service}>
                              {service}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Kích hoạt</Label>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

          </Tabs>
        </TabsContent>

        {/* Sidebar Tab */}
        <TabsContent value="sidebar" className="space-y-4 mt-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList>
              <TabsTrigger value="config">Cấu hình</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4 mt-4">
              {/* Tab Controls - Locale Selector và Translate Button
              <Card className="mb-4">
                ...
              </Card> */}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer hover:bg-gray-50 -mx-6 px-6 py-2 rounded transition-colors"
                      onClick={() => toggleBlock("sidebar")}
                    >
                      <CardTitle className="flex items-center gap-2">
                        {collapsedBlocks.sidebar ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                        Sidebar
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">Cấu hình sidebar liên hệ</p>
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); handleSaveSidebar(); }} disabled={loadingSidebar} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {loadingSidebar ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedBlocks.sidebar && (
                  <CardContent className="space-y-6">
                  <div>
                    <Label>Quick Actions Title</Label>
                    <Input
                      value={sidebarData.quickActions.title}
                      onChange={(e) => setSidebarData({
                        ...sidebarData,
                        quickActions: { ...sidebarData.quickActions, title: e.target.value },
                      })}
                      placeholder="Tiêu đề"
                    />
                  </div>
                  <div>
                    <Label>Quick Actions Description</Label>
                    <Textarea
                      value={sidebarData.quickActions.description}
                      onChange={(e) => setSidebarData({
                        ...sidebarData,
                        quickActions: { ...sidebarData.quickActions, description: e.target.value },
                      })}
                      placeholder="Mô tả"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hotline Label</Label>
                      <Input
                        value={sidebarData.quickActions.buttons.hotline.label}
                        onChange={(e) => setSidebarData({
                          ...sidebarData,
                          quickActions: {
                            ...sidebarData.quickActions,
                            buttons: {
                              ...sidebarData.quickActions.buttons,
                              hotline: { ...sidebarData.quickActions.buttons.hotline, label: e.target.value },
                            },
                          },
                        })}
                        placeholder="Hotline"
                      />
                    </div>
                    <div>
                      <Label>Hotline Value</Label>
                      <Input
                        value={sidebarData.quickActions.buttons.hotline.value}
                        onChange={(e) => setSidebarData({
                          ...sidebarData,
                          quickActions: {
                            ...sidebarData.quickActions,
                            buttons: {
                              ...sidebarData.quickActions.buttons,
                              hotline: { ...sidebarData.quickActions.buttons.hotline, value: e.target.value },
                            },
                          },
                        })}
                      />
                    </div>
                    <div>
                      <Label>Hotline Href</Label>
                      <Input
                        value={sidebarData.quickActions.buttons.hotline.href}
                        onChange={(e) => setSidebarData({
                          ...sidebarData,
                          quickActions: {
                            ...sidebarData.quickActions,
                            buttons: {
                              ...sidebarData.quickActions.buttons,
                              hotline: { ...sidebarData.quickActions.buttons.hotline, href: e.target.value },
                            },
                          },
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Appointment Label</Label>
                      <Input
                        value={sidebarData.quickActions.buttons.appointment.label}
                        onChange={(e) => setSidebarData({
                          ...sidebarData,
                          quickActions: {
                            ...sidebarData.quickActions,
                            buttons: {
                              ...sidebarData.quickActions.buttons,
                              appointment: { ...sidebarData.quickActions.buttons.appointment, label: e.target.value },
                            },
                          },
                        })}
                        placeholder="Đặt lịch"
                      />
                    </div>
                    <div>
                      <Label>Appointment Value</Label>
                      <Input
                        value={sidebarData.quickActions.buttons.appointment.value}
                        onChange={(e) => setSidebarData({
                          ...sidebarData,
                          quickActions: {
                            ...sidebarData.quickActions,
                            buttons: {
                              ...sidebarData.quickActions.buttons,
                              appointment: { ...sidebarData.quickActions.buttons.appointment, value: e.target.value },
                            },
                          },
                        })}
                        placeholder="Giá trị đặt lịch"
                      />
                    </div>
                    <div>
                      <Label>Appointment Href</Label>
                      <Input
                        value={sidebarData.quickActions.buttons.appointment.href}
                        onChange={(e) => setSidebarData({
                          ...sidebarData,
                          quickActions: {
                            ...sidebarData.quickActions,
                            buttons: {
                              ...sidebarData.quickActions.buttons,
                              appointment: { ...sidebarData.quickActions.buttons.appointment, href: e.target.value },
                            },
                          },
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Offices</Label>
                      <Button onClick={handleAddOffice} size="sm" variant="outline">
                        Thêm Office
                      </Button>
                    </div>
                    {sidebarData.offices.map((office, index) => (
                      <Card key={index} className="mb-2">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              {office.title && (
                                <p className="text-xs text-blue-600 mb-1">{office.title}</p>
                              )}
                              <p><strong>{office.city}</strong></p>
                              <p className="text-sm text-gray-600">{office.address}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleEditOffice(index)} size="sm" variant="outline">
                                Sửa
                              </Button>
                              <Button onClick={() => handleDeleteOffice(index)} size="sm" variant="destructive">
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label>Social Links</Label>
                      <Button onClick={handleAddSocial} size="sm" variant="outline">
                        Thêm Social
                      </Button>
                    </div>
                    {sidebarData.socials.map((social, index) => (
                      <Card key={index} className="mb-2">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p><strong>{social.label}</strong></p>
                              <p className="text-sm text-gray-600">{social.href}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => handleEditSocial(index)} size="sm" variant="outline">
                                Sửa
                              </Button>
                              <Button onClick={() => handleDeleteSocial(index)} size="sm" variant="destructive">
                                Xóa
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Kích hoạt</Label>
                    <Switch
                      checked={sidebarData.isActive}
                      onCheckedChange={(checked) => setSidebarData({ ...sidebarData, isActive: checked })}
                    />
                  </div>
                  </CardContent>
                )}
              </Card>

              {/* Office Edit Dialog */}
              <Dialog open={editingOfficeIndex !== null} onOpenChange={(open) => {
                if (!open) {
                  setEditingOfficeIndex(null);
                  setOfficeFormData(null);
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa Office</DialogTitle>
                  </DialogHeader>
                  {officeFormData && (
                    <div className="space-y-4">
                      <div>
                        <Label>Tiêu đề</Label>
                        <Input
                          value={officeFormData.title}
                          onChange={(e) => setOfficeFormData({ ...officeFormData, title: e.target.value })}
                          placeholder="Văn phòng chi nhánh"
                        />
                      </div>
                      <div>
                        <Label>Thành phố</Label>
                        <Input
                          value={officeFormData.city}
                          onChange={(e) => setOfficeFormData({ ...officeFormData, city: e.target.value })}
                          placeholder="Hà Nội"
                        />
                      </div>
                      <div>
                        <Label>Địa chỉ</Label>
                        <Textarea
                          value={officeFormData.address}
                          onChange={(e) => setOfficeFormData({ ...officeFormData, address: e.target.value })}
                          placeholder="Địa chỉ..."
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={officeFormData.phone}
                          onChange={(e) => setOfficeFormData({ ...officeFormData, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={officeFormData.email}
                          onChange={(e) => setOfficeFormData({ ...officeFormData, email: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setEditingOfficeIndex(null);
                      setOfficeFormData(null);
                    }}>
                      Hủy
                    </Button>
                    <Button onClick={handleSaveOffice}>Lưu</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Social Edit Dialog */}
              <Dialog open={editingSocialIndex !== null} onOpenChange={(open) => {
                if (!open) {
                  setEditingSocialIndex(null);
                  setSocialFormData(null);
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Chỉnh sửa Social Link</DialogTitle>
                  </DialogHeader>
                  {socialFormData && (
                    <div className="space-y-4">
                      <div>
                        <Label>Icon Name</Label>
                        <Select
                          value={socialFormData.iconName}
                          onValueChange={(value) => setSocialFormData({ ...socialFormData, iconName: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map((icon) => (
                              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Label</Label>
                        <Input
                          value={socialFormData.label}
                          onChange={(e) => setSocialFormData({ ...socialFormData, label: e.target.value })}
                          placeholder="Label"
                        />
                      </div>
                      <div>
                        <Label>Href</Label>
                        <Input
                          value={socialFormData.href}
                          onChange={(e) => setSocialFormData({ ...socialFormData, href: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Gradient</Label>
                        <Select
                          value={socialFormData.gradient}
                          onValueChange={(value) => setSocialFormData({ ...socialFormData, gradient: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADIENT_OPTIONS.map((grad) => (
                              <SelectItem key={grad.value} value={grad.value}>{grad.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => {
                      setEditingSocialIndex(null);
                      setSocialFormData(null);
                    }}>
                      Hủy
                    </Button>
                    <Button onClick={handleSaveSocial}>Lưu</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

          </Tabs>
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map" className="space-y-4 mt-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList>
              <TabsTrigger value="config">Cấu hình</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="p-0">
                  <div
                    className="flex items-center justify-between w-full px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                    onClick={() => toggleBlock("mapSection")}
                  >
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3 text-lg font-semibold text-gray-900 mb-1">
                        {collapsedBlocks.mapSection ? (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        )}
                        Map Section
                      </CardTitle>
                      <p className="text-sm text-gray-600 ml-8">Cấu hình bản đồ</p>
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); handleSaveMap(); }} disabled={loadingMap} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {loadingMap ? "Đang lưu..." : "Lưu"}
                    </Button>
                  </div>
                </CardHeader>
                {!collapsedBlocks.mapSection && (
                  <CardContent className="space-y-4 px-6 py-4">
                  <div>
                    <Label>Address</Label>
                    <Input
                      value={mapData.address}
                      onChange={(e) => setMapData({ ...mapData, address: e.target.value })}
                      placeholder="Địa chỉ..."
                    />
                  </div>
                  <div>
                    <Label>Iframe Src (Google Maps Embed URL)</Label>
                    <Textarea
                      value={mapData.iframeSrc}
                      onChange={(e) => setMapData({ ...mapData, iframeSrc: e.target.value })}
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Kích hoạt</Label>
                    <Switch
                      checked={mapData.isActive}
                      onCheckedChange={(checked) => setMapData({ ...mapData, isActive: checked })}
                    />
                  </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}

