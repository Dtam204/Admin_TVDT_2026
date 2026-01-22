"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Plus, X } from "lucide-react";
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

interface ShowcaseData {
  title: string;
  desc: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
  imageBack: string;
  imageFront: string;
  imageSide?: "left" | "right"; // vị trí ảnh: trái/phải
}

interface ShowcaseWidgetProps {
  showcase: ShowcaseData;
  onUpdate: (data: ShowcaseData) => void;
  isEditing?: boolean;
  onEditClick?: () => void;
}

export function ShowcaseWidget({
  showcase,
  onUpdate,
  isEditing = false,
  onEditClick,
}: ShowcaseWidgetProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState<ShowcaseData>({ ...showcase });

  // Đồng bộ lại state nội bộ khi props showcase thay đổi (ví dụ đổi Image Side từ form khác)
  useEffect(() => {
    setEditData({ ...showcase });
  }, [showcase]);

  const handleEdit = () => {
    setEditData({ ...showcase });
    setShowEditDialog(true);
    onEditClick?.();
  };

  const handleSave = () => {
    onUpdate(editData);
    setShowEditDialog(false);
  };

  const addBullet = () => {
    setEditData({ ...editData, bullets: [...editData.bullets, ""] });
  };

  const removeBullet = (index: number) => {
    setEditData({
      ...editData,
      bullets: editData.bullets.filter((_, i) => i !== index),
    });
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...editData.bullets];
    newBullets[index] = value;
    setEditData({ ...editData, bullets: newBullets });
  };

  // Kiểm tra xem có dữ liệu hay không
  const hasData = editData.title || editData.desc || editData.bullets.length > 0 || editData.imageBack || editData.imageFront;

  return (
    <>
      <EditableWidget
        title="Showcase section - Khối trình diễn màn hình sản phẩm"
        onEdit={handleEdit}
        isEditing={isEditing}
        showControls={true}
      >
        <section className="w-full bg-white">
          {!hasData ? (
            // Flowchart mô tả khi chưa có dữ liệu
            <div className="w-full bg-gradient-to-br from-blue-50 to-sky-50 border-2 border-dashed border-blue-300 rounded-lg p-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Showcase Section - Cấu trúc các field
                  </h3>
                  <p className="text-sm text-blue-700">
                    Click nút "Edit" để thêm dữ liệu cho các field bên dưới
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Title (Tiêu đề)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Tiêu đề chính của showcase section
                        </div>
                        <div className="text-lg font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          {editData.title || "[Chưa có dữ liệu - Click Edit để thêm tiêu đề]"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-sky-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Description (Mô tả)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Đoạn mô tả chi tiết về tính năng/sản phẩm
                        </div>
                        <div className="text-sm text-gray-500 italic bg-gray-50 px-3 py-2 rounded border border-gray-200 min-h-[60px] flex items-center">
                          {editData.desc || "[Chưa có dữ liệu - Click Edit để thêm mô tả]"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bullets */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-cyan-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Bullets (Danh sách điểm nổi bật)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Danh sách các điểm nổi bật, hiển thị với icon checkmark
                        </div>
                        {editData.bullets.length > 0 ? (
                          <div className="space-y-2">
                            {editData.bullets.map((bullet, idx) => (
                              <div key={idx} className="bg-gray-50 rounded px-3 py-2 border border-gray-200 text-sm text-gray-700">
                                ✓ {bullet || `[Bullet ${idx + 1} - Chưa có nội dung]`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-300 text-sm text-gray-500">
                            [Chưa có bullet nào - Click Edit để thêm các điểm nổi bật]
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        4
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Images (Ảnh minh họa)</div>
                        <div className="text-sm text-gray-600 mb-3">
                          Hai ảnh hiển thị dạng overlay: Image Back (ảnh nền) và Image Front (ảnh phía trước)
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-300 text-center">
                            <div className="text-gray-400 text-xs mb-2">📷 Image Back</div>
                            {editData.imageBack ? (
                              <img src={editData.imageBack} alt="Back" className="w-full h-24 object-cover rounded" />
                            ) : (
                              <div className="text-xs text-gray-500">[Chưa có ảnh]</div>
                            )}
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-300 text-center">
                            <div className="text-gray-400 text-xs mb-2">📷 Image Front</div>
                            {editData.imageFront ? (
                              <img src={editData.imageFront} alt="Front" className="w-full h-24 object-cover rounded" />
                            ) : (
                              <div className="text-xs text-gray-500">[Chưa có ảnh]</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        5
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Call-to-Action (Nút hành động)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Nút CTA với text và link (tự động hiển thị khi có dữ liệu)
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          CTA Text: {editData.ctaText || "[Chưa có]"} | CTA Link: {editData.ctaHref || "[Chưa có]"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Hiển thị bình thường khi đã có dữ liệu
            <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-[120px] py-[90px]">
              <div
                className={`grid gap-12 items-center ${
                  (editData.imageSide || "left") === "right"
                    ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:flex-row-reverse"
                    : "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
                }`}
              >
              {/* LEFT: Stacked dashboard preview (giống hình minh họa) */}
              <div className="relative flex justify-center lg:justify-start">
                <div className="relative w-full max-w-[620px]">
                  {/* Card lớn phía sau */}
                  <div className="rounded-3xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Báo cáo số lượng học sinh theo khối
                      </span>
                      <span className="inline-flex h-6 px-2 rounded-full bg-sky-50 text-[11px] font-medium text-sky-700 items-center">
                        Dashboard tổng quan
                      </span>
                    </div>
                    <div className="px-6 py-5">
                      <div className="h-56 flex items-end gap-3">
                        <div className="flex-1 bg-sky-100 rounded-md overflow-hidden flex items-end justify-center">
                          <div className="w-10 bg-sky-500 rounded-t-md h-[70%]" />
                        </div>
                        <div className="flex-1 bg-sky-50 rounded-md overflow-hidden flex items-end justify-center">
                          <div className="w-10 bg-sky-300 rounded-t-md h-[35%]" />
                        </div>
                        <div className="flex-1 bg-sky-50 rounded-md overflow-hidden flex items-end justify-center">
                          <div className="w-10 bg-sky-400 rounded-t-md h-[50%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card nhỏ phía trước, lệch xuống giống chart tròn */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[78%] rounded-3xl bg-white shadow-[0_20px_50px_rgba(15,23,42,0.24)] border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 px-5 py-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Báo cáo học sinh nữ theo khối
                      </span>
                    </div>
                    <div className="px-5 py-4 flex items-center justify-center">
                      <div className="relative w-40 h-40">
                        <div className="absolute inset-0 rounded-full bg-sky-500" />
                        <div className="absolute inset-3 rounded-full bg-white" />
                        <div className="absolute inset-3 clip-[polygon(0%_0%,100%_0%,100%_100%)] rounded-full bg-[#8B5CF6]" />
                      </div>
                    </div>
                  </div>

                  {/* Nếu admin đã upload ảnh thì overlay ảnh thật lên trên mock */}
                  {(editData.imageBack || editData.imageFront) && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="relative w-full h-full">
                        {editData.imageBack && (
                          <img
                            src={editData.imageBack}
                            alt={editData.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-90 rounded-3xl"
                          />
                        )}
                        {editData.imageFront && (
                          <img
                            src={editData.imageFront}
                            alt={editData.title}
                            className="absolute bottom-4 right-6 w-1/3 rounded-2xl shadow-lg border border-white object-cover"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Text */}
              <div className="flex w-full max-w-[560px] flex-col items-start gap-6">
                {editData.title && (
                  <h3 className="text-gray-900 text-2xl font-bold">
                    {editData.title}
                  </h3>
                )}
                {editData.desc && (
                  <p className="text-gray-600 leading-relaxed">{editData.desc}</p>
                )}

                {editData.bullets.length > 0 && (
                  <div className="space-y-3">
                    {editData.bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-[#0B78B8] mt-0.5" />
                        <span className="text-gray-700">{b}</span>
                      </div>
                    ))}
                  </div>
                )}

                {editData.ctaText && (
                  <button className="inline-flex items-center gap-2 h-[42px] px-5 rounded-lg bg-[#2EABE2] text-white font-semibold hover:opacity-90 transition">
                    {editData.ctaText} <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
          )}
        </section>
      </EditableWidget>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Showcase Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editData.desc}
                onChange={(e) =>
                  setEditData({ ...editData, desc: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label>Bullets</Label>
              <div className="space-y-2 mt-2">
                {editData.bullets.map((bullet, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={bullet}
                      onChange={(e) => updateBullet(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeBullet(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addBullet}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Bullet
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CTA Text</Label>
                <Input
                  value={editData.ctaText}
                  onChange={(e) =>
                    setEditData({ ...editData, ctaText: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>CTA Href</Label>
                <Input
                  value={editData.ctaHref}
                  onChange={(e) =>
                    setEditData({ ...editData, ctaHref: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Image Back</Label>
                <ImageUpload
                  currentImage={editData.imageBack}
                  onImageSelect={(url) =>
                    setEditData({ ...editData, imageBack: url })
                  }
                />
              </div>
              <div>
                <Label>Image Front</Label>
                <ImageUpload
                  currentImage={editData.imageFront}
                  onImageSelect={(url) =>
                    setEditData({ ...editData, imageFront: url })
                  }
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

