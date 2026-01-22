"use client";

import { useState, useEffect } from "react";
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
import { Plus, X } from "lucide-react";

interface NumberedSection {
  sectionNo: number;
  title: string;
  imageBack?: string;
  imageFront?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
  paragraphs?: string[];
}

interface NumberedSectionWidgetProps {
  section: NumberedSection;
  onUpdate: (data: NumberedSection) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isEditing?: boolean;
  onEditClick?: () => void;
}

export function NumberedSectionWidget({
  section,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isEditing = false,
  onEditClick,
}: NumberedSectionWidgetProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState<NumberedSection>({ ...section });

  // Đồng bộ lại state nội bộ khi props section thay đổi
  useEffect(() => {
    setEditData({ ...section });
  }, [section]);

  const handleEdit = () => {
    setEditData({ ...section });
    setShowEditDialog(true);
    onEditClick?.();
  };

  const handleSave = () => {
    onUpdate(editData);
    setShowEditDialog(false);
  };

  const addParagraph = () => {
    setEditData({
      ...editData,
      paragraphs: [...(editData.paragraphs || []), ""],
    });
  };

  const removeParagraph = (index: number) => {
    setEditData({
      ...editData,
      paragraphs: (editData.paragraphs || []).filter((_, i) => i !== index),
    });
  };

  const updateParagraph = (index: number, value: string) => {
    const newParagraphs = [...(editData.paragraphs || [])];
    newParagraphs[index] = value;
    setEditData({ ...editData, paragraphs: newParagraphs });
  };

  // Kiểm tra xem có dữ liệu hay không
  const hasData = editData.title || (editData.paragraphs && editData.paragraphs.length > 0) || editData.imageBack || editData.imageFront;

  return (
    <>
      <EditableWidget
        title={`Numbered section - Khối số ${editData.sectionNo || section.sectionNo || 1}`}
        onEdit={handleEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
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
                    Numbered Section {editData.sectionNo || section.sectionNo || 1} - Cấu trúc các field
                  </h3>
                  <p className="text-sm text-blue-700">
                    Click nút "Edit" để thêm dữ liệu cho các field bên dưới
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Section No */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Section Number (Số thứ tự)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Số thứ tự của section, hiển thị trước tiêu đề
                        </div>
                        <div className="text-lg font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          {editData.sectionNo || section.sectionNo || 1}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-sky-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Title (Tiêu đề)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Tiêu đề của section, hiển thị sau số thứ tự
                        </div>
                        <div className="text-lg font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          {editData.title || "[Chưa có dữ liệu - Click Edit để thêm tiêu đề]"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paragraphs */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-cyan-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Paragraphs (Các đoạn mô tả)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Danh sách các đoạn văn mô tả chi tiết về section này
                        </div>
                        {(editData.paragraphs && editData.paragraphs.length > 0) ? (
                          <div className="space-y-2">
                            {editData.paragraphs.map((para, idx) => (
                              <div key={idx} className="bg-gray-50 rounded px-3 py-2 border border-gray-200 text-sm text-gray-700">
                                Paragraph {idx + 1}: {para || `[Chưa có nội dung]`}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 border-2 border-dashed border-gray-300 text-sm text-gray-500">
                            [Chưa có paragraph nào - Click Edit để thêm các đoạn mô tả]
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
                          Hai ảnh hiển thị dạng overlay: Image Back (ảnh nền lớn) và Image Front (ảnh nhỏ phía trước)
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

                  {/* Image Side */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        5
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Image Side (Vị trí ảnh)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Vị trí hiển thị ảnh: Left (trái) hoặc Right (phải)
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          Vị trí hiện tại: {editData.imageSide || "left"}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div
                className={
                  (editData.imageSide || "left") === "left" ? "order-1" : "order-2 lg:order-2"
                }
              >
                <div className="w-full flex justify-center lg:justify-start">
                  {editData.imageBack || editData.imageFront ? (
                    <div className="relative w-[701px] h-[511px] scale-[0.48] sm:scale-[0.65] md:scale-[0.85] lg:scale-100 origin-top">
                      {/* Image Back - Card lớn phía sau */}
                      {editData.imageBack ? (
                        <div className="w-[701px] h-[511px] rounded-[24px] border-[10px] border-white bg-white shadow-[0_18px_36px_rgba(15,23,42,0.12)] overflow-hidden">
                          <img
                            src={editData.imageBack}
                            alt={editData.imageAlt || editData.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-[701px] h-[511px] rounded-[24px] border-[10px] border-white bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-400">No Image Back</span>
                        </div>
                      )}
                      {/* Image Front - Card nhỏ phía trước, lệch xuống */}
                      {editData.imageFront && (
                        <div className="absolute left-[183.5px] bottom-0 rounded-[24px] bg-white shadow-[0_18px_36px_rgba(15,23,42,0.12)] overflow-hidden w-[334px] h-[243px]">
                          <img
                            src={editData.imageFront}
                            alt={editData.imageAlt || editData.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-[701px] h-[511px] rounded-[24px] border-[10px] border-white bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className={
                  (editData.imageSide || "left") === "left" ? "order-2" : "order-1 lg:order-1"
                }
              >
                <div className="text-gray-900 text-xl md:text-2xl font-bold mb-4">
                  {editData.sectionNo}. {editData.title}
                </div>
                {editData.paragraphs && editData.paragraphs.length > 0 && (
                  <div className="space-y-4 text-gray-600 leading-relaxed">
                    {editData.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
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
            <DialogTitle>Chỉnh sửa Section {section.sectionNo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Section No</Label>
                <Input
                  value={editData.sectionNo}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      sectionNo: Number(e.target.value) || 1,
                    })
                  }
                  type="number"
                />
              </div>
              <div>
                <Label>Image Side</Label>
                <select
                  value={editData.imageSide || "left"}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      imageSide: e.target.value as "left" | "right",
                    })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Image Back</Label>
                <ImageUpload
                  currentImage={editData.imageBack || ""}
                  onImageSelect={(url) =>
                    setEditData({ ...editData, imageBack: url })
                  }
                />
              </div>
              <div>
                <Label>Image Front</Label>
                <ImageUpload
                  currentImage={editData.imageFront || ""}
                  onImageSelect={(url) =>
                    setEditData({ ...editData, imageFront: url })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Paragraphs</Label>
              <div className="space-y-2 mt-2">
                {(editData.paragraphs || []).map((para, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={para}
                      onChange={(e) => updateParagraph(index, e.target.value)}
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeParagraph(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addParagraph}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Paragraph
                </Button>
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

