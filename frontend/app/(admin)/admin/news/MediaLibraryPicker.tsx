"use client";

import React, { useEffect, useState } from "react";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";
import { buildUrl } from "@/lib/api/base";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Image as ImageIcon, Grid3x3, List, Video, Music } from "lucide-react";
import { toast } from "sonner";

interface MediaFileItem {
  id: number;
  file_url: string;
  original_name: string;
  file_size: number;
  created_at: string;
  alt_text?: string | null;
  file_type: string;
  width?: number | null;
  height?: number | null;
}

interface MediaLibraryPickerProps {
  onSelectImage: (url: string) => void;
  fileTypeFilter?: string; // "image", "video", "audio", "document", hoặc "video,audio"
}

const formatFileSize = (bytes: number) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MediaLibraryPicker: React.FC<MediaLibraryPickerProps> = ({ onSelectImage, fileTypeFilter = "image" }) => {
  const [files, setFiles] = useState<MediaFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video" | "audio">("all");

  const loadFiles = async (overrideType?: "all" | "image" | "video" | "audio") => {
    try {
      setLoading(true);
      const baseTypes = fileTypeFilter.split(",").map((t) => t.trim());
      // Nếu chọn "all" thì dùng đúng các type được truyền từ props (mặc định image hoặc image,video,...)
      // Nếu chọn cụ thể (image, video, audio) thì filter lại theo lựa chọn này (nếu có trong baseTypes)
      const currentType = overrideType ?? typeFilter;
      const effectiveTypes =
        currentType === "all"
          ? baseTypes
          : baseTypes.includes(currentType)
          ? [currentType]
          : baseTypes;

      let allFiles: MediaFileItem[] = [];

      // Load từng loại file riêng và gộp lại
      for (const fileType of effectiveTypes) {
        const params = new URLSearchParams();
        params.append("file_type", fileType);
        if (search) {
          params.append("search", search);
        }
        params.append("sort_by", "created_at");
        params.append("sort_order", "DESC");
        params.append("page", "1");
        params.append("limit", "50");

        const resp = await adminApiCall<{ data: MediaFileItem[]; pagination: any }>(
          `${AdminEndpoints.media.files.list}?${params.toString()}`
        );

        if (resp.data) {
          allFiles = [...allFiles, ...resp.data];
        }
      }

      // Sắp xếp lại theo created_at (mới nhất trước)
      allFiles.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      setFiles(allFiles);
    } catch (err: any) {
      const msg = err?.message || "Không thể tải thư viện media";
      // Silently fail
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles();
  };

  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Input
              placeholder="Tìm kiếm media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => loadFiles()}
            >
              Tìm
            </Button>
            <Button
              type="button"
              variant={typeFilter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setTypeFilter("all");
                loadFiles("all");
              }}
            >
              Tất cả
            </Button>
            <Button
              type="button"
              variant={typeFilter === "image" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setTypeFilter("image");
                loadFiles("image");
              }}
            >
              Ảnh
            </Button>
            <Button
              type="button"
              variant={typeFilter === "video" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setTypeFilter("video");
                loadFiles("video");
              }}
            >
              Video
            </Button>
            <Button
              type="button"
              variant={typeFilter === "audio" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setTypeFilter("audio");
                loadFiles("audio");
              }}
            >
              Audio
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div
        className="mt-2 overflow-y-auto"
        style={{ maxHeight: 430 }}
      >
        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải thư viện media...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Không có file nào trong thư viện. Hãy upload file mới.
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => {
              const src = file.file_url.startsWith("/")
                ? buildUrl(file.file_url)
                : file.file_url;
              const sizeLabel = formatFileSize(file.file_size);
              const dimensionLabel =
                file.width && file.height ? `${file.width}×${file.height}` : "";
              return (
                <button
                  key={file.id}
                  type="button"
                  className="group border rounded-lg overflow-hidden text-left bg-white hover:shadow-md transition-shadow"
                  onClick={() => onSelectImage(src)}
                >
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {file.file_type === "image" ? (
                      <img
                        src={src}
                        alt={file.alt_text || file.original_name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                      />
                    ) : file.file_type === "video" ? (
                      <video
                        src={src}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                        preload="metadata"
                        muted
                      />
                    ) : file.file_type === "audio" ? (
                      <Music className="w-12 h-12 text-purple-500" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    <div className="text-xs font-medium truncate">
                      {file.original_name}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center justify-between">
                      <span>{sizeLabel}</span>
                      {dimensionLabel && <span>{dimensionLabel}</span>}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {new Date(file.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const src = file.file_url.startsWith("/")
                ? buildUrl(file.file_url)
                : file.file_url;
              const sizeLabel = formatFileSize(file.file_size);
              const dimensionLabel =
                file.width && file.height ? `${file.width}×${file.height}` : "";
              return (
                <button
                  key={file.id}
                  type="button"
                  className="w-full border rounded-lg bg-white hover:bg-gray-50 text-left p-2 flex items-center gap-3"
                  onClick={() => onSelectImage(src)}
                >
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center overflow-hidden rounded">
                    {file.file_type === "image" ? (
                      <img
                        src={src}
                        alt={file.alt_text || file.original_name}
                        className="w-full h-full object-cover"
                      />
                    ) : file.file_type === "video" ? (
                      <video
                        src={src}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                    ) : file.file_type === "audio" ? (
                      <Music className="w-8 h-8 text-purple-500" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {file.original_name}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2">
                      <span>{sizeLabel}</span>
                      {dimensionLabel && (
                        <>
                          <span>•</span>
                          <span>{dimensionLabel}</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {new Date(file.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibraryPicker;

