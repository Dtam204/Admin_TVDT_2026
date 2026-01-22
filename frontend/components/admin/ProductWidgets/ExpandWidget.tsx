"use client";

import { useState } from "react";
import { CheckCircle2, ArrowRight, Plus, X } from "lucide-react";
import { EditableWidget } from "../EditableWidget";
import ImageUpload from "../ImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExpandData {
  title: string;
  bullets: string[];
  ctaText: string;
  ctaHref: string;
  image: string;
}

interface ExpandWidgetProps {
  expand: ExpandData;
  onUpdate: (data: ExpandData) => void;
  isEditing?: boolean;
  onEditClick?: () => void;
}

export function ExpandWidget({
  expand,
  onUpdate,
  isEditing = false,
  onEditClick,
}: ExpandWidgetProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState<ExpandData>({ ...expand });

  const handleEdit = () => {
    setEditData({ ...expand });
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

  return (
    <>
      <EditableWidget
        title="Expand section - Khối mở rộng lợi ích"
        onEdit={handleEdit}
        isEditing={isEditing}
        showControls={true}
      >
        <section className="w-full bg-white">
          <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-[120px] py-[90px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-5">
                {editData.title && (
                  <h3 className="text-gray-900 text-2xl font-bold">
                    {editData.title}
                  </h3>
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
                  <button className="inline-flex items-center gap-2 h-[44px] px-5 rounded-lg bg-[#2EABE2] text-white font-semibold hover:opacity-90 transition">
                    {editData.ctaText} <ArrowRight size={18} />
                  </button>
                )}
              </div>

              <div>
                {editData.image ? (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_14px_40px_rgba(0,0,0,0.08)] overflow-hidden">
                    <div className="relative aspect-[16/9]">
                      <img
                        src={editData.image}
                        alt={editData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-gray-100 border border-gray-200 aspect-[16/9] flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </EditableWidget>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Expand Section</DialogTitle>
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
            <div>
              <Label>Image</Label>
              <ImageUpload
                currentImage={editData.image}
                onImageSelect={(url) =>
                  setEditData({ ...editData, image: url })
                }
              />
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

