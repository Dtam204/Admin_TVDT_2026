"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

import { getCleanValue } from "@/lib/utils/locale-admin";

interface MembershipPlanFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

const parseFeaturesText = (value: any) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.join("\n");
      if (parsed && typeof parsed === "object") return Object.values(parsed).join("\n");
      return value;
    } catch {
      return value;
    }
  }
  if (typeof value === "object") return Object.values(value).join("\n");
  return String(value);
};

export function MembershipPlanForm({ initialData = {}, onSubmit, isSubmitting }: MembershipPlanFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const featuresRaw = formData.get("features")?.toString() || "";
    const features = featuresRaw
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    const data = {
      name: formData.get("name")?.toString() || "", // Gửi chuỗi trực tiếp
      slug: formData.get("slug")?.toString() || "",
      tier_code: formData.get("tier_code")?.toString() || "basic",
      price: Number(formData.get("price")) || 0,
      duration_days: Number(formData.get("duration_days")) || 30,
      description: formData.get("description")?.toString() || "",
      features,
      max_books_borrowed: Number(formData.get("max_books_borrowed")) || 0,
      max_renewal_limit: Number(formData.get("max_renewal_limit")) || 0,
      late_fee_per_day: Number(formData.get("late_fee_per_day")) || 0,
      discount_percentage: Number(formData.get("discount_percentage")) || 0,
      sort_order: Number(formData.get("sort_order")) || 0,
      status: formData.get("status")?.toString() || "active",
      allow_digital_read: formData.get("allow_digital_read") === "on",
      allow_download: formData.get("allow_download") === "on",
      priority_support: formData.get("priority_support") === "on",
    };
    onSubmit(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/membership-plans">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {initialData.id ? "Chỉnh sửa Gói Bạn đọc" : "Thêm Gói mới"}
          </h1>
          <p className="text-muted-foreground">
            Thiết lập quyền truy cập cho Hạng thẻ.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg border space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tên hiển thị (Tiếng Việt)</Label>
            <Input id="name" name="name" defaultValue={getCleanValue(initialData.name)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Mã Gói (Slug)</Label>
            <Input id="slug" name="slug" defaultValue={initialData.slug} required placeholder="vd: basic-monthly" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tier_code">Phân Cấu Trúc (Tier Rank)</Label>
            <Select name="tier_code" defaultValue={initialData.tier_code || "basic"}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn Rank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic (Quyền lợi cơ bản)</SelectItem>
                <SelectItem value="premium">Premium (Quyền lợi trung cấp)</SelectItem>
                <SelectItem value="vip">VIP (Truy cập không giới hạn)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Tier sẽ quyết định được phép mượn những đầu sách nào ở module Ấn Phẩm.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái phát hành</Label>
            <Select name="status" defaultValue={initialData.status || "active"}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang kích hoạt</SelectItem>
                <SelectItem value="inactive">Tạm ngưng</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Giá (VNĐ)</Label>
            <Input id="price" name="price" type="number" defaultValue={initialData.price || 0} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_days">Thời hạn thẻ (Ngày)</Label>
            <Input id="duration_days" name="duration_days" type="number" defaultValue={initialData.duration_days || 30} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sort_order">Thứ tự hiển thị</Label>
            <Input id="sort_order" name="sort_order" type="number" defaultValue={initialData.sort_order || 0} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_percentage">Giảm giá (%)</Label>
            <Input id="discount_percentage" name="discount_percentage" type="number" min={0} max={100} defaultValue={initialData.discount_percentage || 0} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="late_fee_per_day">Phí trễ hạn (VNĐ/ngày)</Label>
            <Input id="late_fee_per_day" name="late_fee_per_day" type="number" min={0} defaultValue={initialData.late_fee_per_day || 0} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_books_borrowed">Max mượn (sách vật lý)</Label>
            <Input id="max_books_borrowed" name="max_books_borrowed" type="number" defaultValue={initialData.max_books_borrowed || 3} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_renewal_limit">Max gia hạn / lần mượn</Label>
            <Input id="max_renewal_limit" name="max_renewal_limit" type="number" defaultValue={initialData.max_renewal_limit || 1} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Mô tả gói</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={getCleanValue(initialData.description)}
            placeholder="Mô tả ngắn giúp người đọc hiểu gói phù hợp với ai"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="features">Danh sách quyền lợi nổi bật (mỗi dòng 1 quyền lợi)</Label>
          <Textarea
            id="features"
            name="features"
            rows={6}
            defaultValue={parseFeaturesText(initialData.features)}
            placeholder={"Mượn tối đa 10 sách cùng lúc\nGia hạn 3 lần\nĐược đọc tài liệu số\nHỗ trợ ưu tiên"}
          />
        </div>

        <div className="flex gap-8 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Switch id="allow_digital_read" name="allow_digital_read" defaultChecked={initialData.allow_digital_read} />
            <Label htmlFor="allow_digital_read">Cho phép Tương tác sách Điện tử (Read Online)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="allow_download" name="allow_download" defaultChecked={initialData.allow_download} />
            <Label htmlFor="allow_download">Cho phép tải sách Digital</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="priority_support" name="priority_support" defaultChecked={initialData.priority_support} />
            <Label htmlFor="priority_support">Hỗ trợ ưu tiên</Label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            Lưu Gói thành viên
          </Button>
        </div>
      </form>
    </div>
  );
}
