"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Play } from "lucide-react";
import { EditableWidget } from "../EditableWidget";
import ImageUpload from "../ImageUpload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HeroWidgetProps {
  productName: string;
  metaTop: string;
  heroDescription: string;
  heroImage: string;
  ctaContactText?: string;
  ctaContactHref?: string;
  ctaDemoText?: string;
  ctaDemoHref?: string;
  backgroundGradient?: string;
  onUpdate: (data: {
    metaTop: string;
    heroDescription: string;
    heroImage: string;
    ctaContactText?: string;
    ctaContactHref?: string;
    ctaDemoText?: string;
    ctaDemoHref?: string;
  }) => void;
  isEditing?: boolean;
  onEditClick?: () => void;
}

export function HeroWidget({
  productName,
  metaTop,
  heroDescription,
  heroImage,
  ctaContactText,
  ctaContactHref,
  ctaDemoText,
  ctaDemoHref,
  backgroundGradient = "linear-gradient(31deg,#0870B4_51.21%,#2EABE2_97.73%)",
  onUpdate,
  isEditing = false,
  onEditClick,
}: HeroWidgetProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    metaTop,
    heroDescription,
    heroImage,
    ctaContactText,
    ctaContactHref,
    ctaDemoText,
    ctaDemoHref,
  });

  // Sync editData với props khi props thay đổi
  useEffect(() => {
    setEditData({
      metaTop,
      heroDescription,
      heroImage,
      ctaContactText: ctaContactText || "LIÊN HỆ NGAY",
      ctaContactHref: ctaContactHref || "#",
      ctaDemoText: ctaDemoText || "DEMO HỆ THỐNG",
      ctaDemoHref: ctaDemoHref || "#",
    });
  }, [metaTop, heroDescription, heroImage, ctaContactText, ctaContactHref, ctaDemoText, ctaDemoHref]);

  const handleEdit = () => {
    setEditData({
      metaTop,
      heroDescription,
      heroImage,
      ctaContactText,
      ctaContactHref,
      ctaDemoText,
      ctaDemoHref,
    });
    setShowEditDialog(true);
    onEditClick?.();
  };

  const handleSave = () => {
    onUpdate(editData);
    setShowEditDialog(false);
  };

  // Kiểm tra xem có dữ liệu hay không
  const hasData = metaTop || heroDescription || heroImage;

  return (
    <>
      <EditableWidget
        title="Hero section - Tiêu đề & mô tả đầu trang"
        onEdit={handleEdit}
        isEditing={isEditing}
        showControls={true}
      >
        <section className="w-full">
          {!hasData ? (
            // Flowchart mô tả khi chưa có dữ liệu
            <div className="w-full bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-dashed border-blue-300 rounded-lg p-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Hero Section - Cấu trúc các field
                  </h3>
                  <p className="text-sm text-blue-700">
                    Click nút "Edit" để thêm dữ liệu cho các field bên dưới
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Meta Top */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Meta Top</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Text nhỏ phía trên tiêu đề chính (ví dụ: "TÀI LIỆU GIỚI THIỆU PHẦN MỀM")
                        </div>
                        <div className="text-xs text-gray-500 italic bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          {metaTop || "[Chưa có dữ liệu - Click Edit để thêm]"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Name */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-sky-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Product Name (Tiêu đề chính)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Tên sản phẩm hiển thị lớn, đậm (lấy từ tên sản phẩm chính)
                        </div>
                        <div className="text-lg font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          {productName || "[Tên sản phẩm]"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hero Description */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-cyan-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Hero Description (Mô tả)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Đoạn mô tả chi tiết về sản phẩm, hiển thị dưới tiêu đề
                        </div>
                        <div className="text-sm text-gray-500 italic bg-gray-50 px-3 py-2 rounded border border-gray-200 min-h-[60px] flex items-center">
                          {heroDescription || "[Chưa có dữ liệu - Click Edit để thêm mô tả về sản phẩm...]"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hero Image */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        4
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Hero Image (Ảnh minh họa)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Ảnh hiển thị bên phải, trong khung trắng bo tròn
                        </div>
                        <div className="w-full max-w-[300px] aspect-[701/511] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                          {heroImage ? (
                            <img src={heroImage} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <div className="text-center text-gray-400 text-xs px-4">
                              <div className="mb-2">📷</div>
                              <div>[Chưa có ảnh - Click Edit để upload]</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        5
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Call-to-Action Buttons</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Hai nút hành động: "LIÊN HỆ NGAY" và "DEMO HỆ THỐNG" (tự động hiển thị)
                        </div>
                        <div className="flex gap-3">
                          <div className="h-[48px] px-6 rounded-xl bg-white border-2 border-blue-500 text-blue-500 font-semibold text-sm inline-flex items-center gap-2">
                            LIÊN HỆ NGAY →
                          </div>
                          <div className="h-[48px] px-6 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold text-sm inline-flex items-center gap-2">
                            DEMO HỆ THỐNG ▷
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Hiển thị bình thường khi đã có dữ liệu
            <div style={{ background: backgroundGradient }}>
              <div className="mx-auto w-full max-w-[1920px] px-6 lg:px-[243px] pt-[80px] sm:pt-[80px] lg:pt-[194.5px] pb-[80px] sm:pb-[110px] lg:pb-[127.5px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* LEFT - Text Content */}
                  <div className="order-2 lg:order-1">
                    <div className="text-slate-700 flex flex-col items-start gap-[29px]">
                      {metaTop && (
                        <div className="text-slate-700 uppercase font-medium text-[16px] tracking-wide">
                          {metaTop}
                        </div>
                      )}
                      <h1 className="text-slate-700 text-[32px] sm:text-[44px] lg:text-[56px] leading-[normal] font-extrabold">
                        {productName}
                      </h1>

                      {heroDescription && (
                        <p className="text-slate-700 text-[14px] leading-[22px] opacity-90">
                          {heroDescription}
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                        <a
                          href={ctaContactHref || "#"}
                          className="h-[48px] px-6 rounded-xl bg-white text-[#0B78B8] border-2 border-[#0B78B8] font-semibold text-[16px] inline-flex items-center gap-2 hover:opacity-90 transition"
                        >
                          {ctaContactText || "LIÊN HỆ NGAY"} <ArrowRight size={18} />
                        </a>

                        <a
                          href={ctaDemoHref || "#"}
                          className="h-[48px] px-6 rounded-xl bg-[#0870B4] border-2 border-white text-white font-semibold text-[16px] inline-flex items-center gap-3 hover:opacity-90 transition"
                        >
                          {ctaDemoText || "DEMO HỆ THỐNG"}
                          <span className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center">
                            <Play size={14} className="ml-[1px] text-white" />
                          </span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT - Image */}
                  <div className="order-1 lg:order-2">
                    <div className="w-full flex justify-center lg:justify-start">
                      <div className="w-full max-w-[701px] aspect-[701/511] lg:w-[701px] lg:h-[511px] rounded-[24px] border-[6px] lg:border-[10px] border-white bg-white shadow-[0_18px_36px_rgba(15,23,42,0.12)] overflow-hidden">
                        {heroImage ? (
                          <img
                            src={heroImage}
                            alt={productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </EditableWidget>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Hero Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Meta Top</Label>
              <Input
                value={editData.metaTop}
                onChange={(e) =>
                  setEditData({ ...editData, metaTop: e.target.value })
                }
                placeholder="TÀI LIỆU GIỚI THIỆU PHẦN MỀM"
              />
            </div>
            <div>
              <Label>Hero Description</Label>
              <Textarea
                value={editData.heroDescription}
                onChange={(e) =>
                  setEditData({ ...editData, heroDescription: e.target.value })
                }
                rows={4}
                placeholder="Mô tả về sản phẩm..."
              />
            </div>
            <div>
              <Label>Hero Image</Label>
              <ImageUpload
                currentImage={editData.heroImage}
                onImageSelect={(url) =>
                  setEditData({ ...editData, heroImage: url })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CTA Contact Text</Label>
                <Input
                  value={editData.ctaContactText || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, ctaContactText: e.target.value })
                  }
                  placeholder="LIÊN HỆ NGAY"
                />
              </div>
              <div>
                <Label>CTA Contact Href</Label>
                <Input
                  value={editData.ctaContactHref || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, ctaContactHref: e.target.value })
                  }
                  placeholder="/contact hoặc #"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CTA Demo Text</Label>
                <Input
                  value={editData.ctaDemoText || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, ctaDemoText: e.target.value })
                  }
                  placeholder="DEMO HỆ THỐNG"
                />
              </div>
              <div>
                <Label>CTA Demo Href</Label>
                <Input
                  value={editData.ctaDemoHref || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, ctaDemoHref: e.target.value })
                  }
                  placeholder="/demo hoặc #demo"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Hủy
              </Button>
              <Button type="button" onClick={handleSave}>Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


