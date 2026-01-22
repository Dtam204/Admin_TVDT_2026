"use client";

import { useState } from "react";
import { Edit2, X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditableWidgetProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  title?: string;
  isEditing?: boolean;
  className?: string;
  showControls?: boolean;
}

export function EditableWidget({
  children,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  title,
  isEditing = false,
  className = "",
  showControls = true,
}: EditableWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Luôn hiển thị nhãn tiêu đề khối để người dùng biết đây là section nào */}
      {title && (
        <div className="absolute left-4 top-4 z-40 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm border border-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
          <span>{title}</span>
        </div>
      )}

      {/* Edit Controls Overlay */}
      {showControls && (isHovered || isEditing) && (
        <div className="absolute top-2 right-2 z-50 flex gap-1 flex-wrap">
          {onMoveUp && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/95 shadow-lg hover:bg-white border"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveUp();
              }}
              title="Di chuyển lên"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/95 shadow-lg hover:bg-white border"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMoveDown();
              }}
              title="Di chuyển xuống"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
          {onEdit && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/95 shadow-lg hover:bg-white border"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              title="Chỉnh sửa"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-white/95 shadow-lg hover:bg-white border"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm("Bạn có chắc muốn xóa section này?")) {
                  onDelete();
                }
              }}
              title="Xóa"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Border highlight khi editing */}
      {isEditing && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-40" />
      )}

      {/* Widget Content */}
      <div className={isEditing ? "opacity-95" : ""}>{children}</div>
    </div>
  );
}

