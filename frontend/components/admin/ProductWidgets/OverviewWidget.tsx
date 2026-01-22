"use client";

import { useState } from "react";
import { EditableWidget } from "../EditableWidget";
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
import { PLACEHOLDER_DESCRIPTION } from "@/lib/placeholders";

interface OverviewCard {
  step: number;
  title: string;
  description?: string;
}

interface OverviewWidgetProps {
  kicker: string;
  title: string;
  cards: OverviewCard[];
  onUpdate: (data: { overviewKicker: string; overviewTitle: string; overviewCards: OverviewCard[] }) => void;
  isEditing?: boolean;
  onEditClick?: () => void;
}

export function OverviewWidget({
  kicker,
  title,
  cards,
  onUpdate,
  isEditing = false,
  onEditClick,
}: OverviewWidgetProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    overviewKicker: kicker,
    overviewTitle: title,
    overviewCards: cards,
  });

  const handleEdit = () => {
    setEditData({ overviewKicker: kicker, overviewTitle: title, overviewCards: cards });
    setShowEditDialog(true);
    onEditClick?.();
  };

  const handleSave = () => {
    onUpdate(editData);
    setShowEditDialog(false);
  };

  const addCard = () => {
    setEditData({
      ...editData,
      overviewCards: [
        ...editData.overviewCards,
        { step: editData.overviewCards.length + 1, title: "", description: "" },
      ],
    });
  };

  const removeCard = (index: number) => {
    setEditData({
      ...editData,
      overviewCards: editData.overviewCards.filter((_, i) => i !== index),
    });
  };

  const updateCard = (index: number, field: keyof OverviewCard, value: string | number) => {
    const newCards = [...editData.overviewCards];
    newCards[index] = { ...newCards[index], [field]: value };
    setEditData({ ...editData, overviewCards: newCards });
  };

  // Kiểm tra xem có dữ liệu hay không
  const hasData = kicker || title || cards.length > 0;

  return (
    <>
      <EditableWidget
        title="Overview section - Tổng quan các bước chính"
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
                    Overview Section - Cấu trúc các field
                  </h3>
                  <p className="text-sm text-blue-700">
                    Click nút "Edit" để thêm dữ liệu cho các field bên dưới
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Kicker */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Kicker (Text nhỏ phía trên)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Text nhỏ màu xanh, chữ in hoa, hiển thị phía trên tiêu đề chính
                        </div>
                        <div className="text-xs text-blue-600 uppercase tracking-widest bg-gray-50 px-3 py-2 rounded border border-gray-200">
                          {kicker || "[Chưa có dữ liệu - Ví dụ: SFB - HỒ SƠ HỌC SINH]"}
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
                        <div className="font-semibold text-gray-900 mb-1">Title (Tiêu đề chính)</div>
                        <div className="text-sm text-gray-600 mb-2">
                          Tiêu đề lớn, đậm, căn giữa, hiển thị dưới kicker
                        </div>
                        <div className="text-xl font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200 text-center">
                          {title || "[Chưa có dữ liệu - Click Edit để thêm tiêu đề]"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="bg-white rounded-lg p-4 border-l-4 border-cyan-500 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">Overview Cards (Các thẻ bước)</div>
                        <div className="text-sm text-gray-600 mb-3">
                          Danh sách các thẻ hiển thị các bước/tính năng chính. Mỗi thẻ gồm:
                        </div>
                        {cards.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cards.map((card, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="text-xs text-gray-500 mb-1">Card {idx + 1}:</div>
                                <div className="text-sm font-medium text-gray-700">Step: {card.step}</div>
                                <div className="text-sm text-gray-700">Title: {card.title || "[Chưa có]"}</div>
                                <div className="text-xs text-gray-500">Desc: {card.description || PLACEHOLDER_DESCRIPTION}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300 text-center">
                            <div className="text-gray-400 text-sm mb-2">📋</div>
                            <div className="text-sm text-gray-500">
                              [Chưa có card nào - Click Edit để thêm các thẻ bước]
                            </div>
                            <div className="text-xs text-gray-400 mt-2">
                              Mỗi card gồm: Step (số thứ tự), Title (tiêu đề), Description (mô tả)
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Hiển thị bình thường khi đã có dữ liệu
            <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-[120px] py-[90px] flex justify-center">
              <div className="flex flex-col items-start gap-[60px] w-full lg:w-[1340px]">
                <div className="w-full text-center space-y-4">
                  {kicker && (
                    <div className="w-full text-center text-[#1D8FCF] uppercase font-medium text-[15px] leading-normal tracking-widest">
                      {kicker}
                    </div>
                  )}

                  {title && (
                    <h2 className="mx-auto max-w-[840px] text-center text-[#0F172A] text-[32px] sm:text-[44px] lg:text-[56px] font-bold leading-normal">
                      {title}
                    </h2>
                  )}
                </div>

                {cards.length > 0 && (
                  <div className="flex justify-center items-start content-start gap-[18px] flex-wrap w-full lg:w-[1340px]">
                    {cards.map((card, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-3 w-full max-w-[433px] lg:w-[433px] px-6 py-8 rounded-xl border border-white"
                        style={{
                          background:
                            "linear-gradient(237deg, rgba(128, 192, 228, 0.10) 7%, rgba(29, 143, 207, 0.10) 71.94%)",
                        }}
                      >
                        <div className="flex justify-center mb-3">
                          <div className="w-12 h-12 rounded-full bg-[#1D8FCF] text-white flex items-center justify-center font-bold">
                            {card.step}
                          </div>
                        </div>

                        <div className="text-[#0B78B8] font-semibold text-center">
                          {card.title}
                        </div>
                        {card.description && (
                          <div className="text-gray-600 text-sm leading-relaxed text-center">
                            {card.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </EditableWidget>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Overview Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kicker</Label>
                <Input
                  value={editData.overviewKicker}
                  onChange={(e) =>
                    setEditData({ ...editData, overviewKicker: e.target.value })
                  }
                  placeholder="SFB - HỒ SƠ HỌC SINH"
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={editData.overviewTitle}
                  onChange={(e) =>
                    setEditData({ ...editData, overviewTitle: e.target.value })
                  }
                  placeholder="Tổng quan hệ thống"
                />
              </div>
            </div>

            <div>
              <Label>Overview Cards</Label>
              <div className="space-y-2 mt-2">
                {editData.overviewCards.map((card, index) => (
                  <div key={index} className="flex gap-2 p-3 border rounded-lg">
                    <Input
                      value={card.step}
                      onChange={(e) =>
                        updateCard(index, "step", Number(e.target.value) || 1)
                      }
                      placeholder="Step"
                      type="number"
                      className="w-20"
                    />
                    <Input
                      value={card.title}
                      onChange={(e) => updateCard(index, "title", e.target.value)}
                      placeholder="Title"
                      className="flex-1"
                    />
                    <Textarea
                      value={card.description || ""}
                      onChange={(e) => updateCard(index, "description", e.target.value)}
                      placeholder="Description"
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeCard(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCard}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Card
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

