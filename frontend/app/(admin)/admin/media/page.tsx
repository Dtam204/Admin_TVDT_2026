"use client";
import React, { useEffect, useMemo, useState } from "react";
import { adminApiCall, AdminEndpoints, uploadFile, uploadFiles } from "@/lib/api/admin";
import { toast } from "sonner";
import {
  Upload,
  FolderPlus,
  FolderTree,
  Trash2,
  Grid3x3,
  List,
  Search,
  Home,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  CheckSquare,
  Square,
  Eye,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { buildUrl } from "@/lib/api/base";

interface MediaFolder {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  fileCount: number;
  children?: MediaFolder[];
}

interface MediaFile {
  id: number;
  folder_id: number | null;
  filename: string;
  original_name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  description: string | null;
  uploaded_by_name: string | null;
  created_at: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "image":
      return ImageIcon;
    case "document":
      return FileText;
    case "video":
      return Video;
    case "audio":
      return Music;
    default:
      return FileText;
  }
};

const MediaLibraryPage: React.FC = () => {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [folderMap, setFolderMap] = useState<Map<number, MediaFolder>>(new Map());
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<number>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  // Dialogs
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParent, setNewFolderParent] = useState<number | null>(null);
  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (selectedFolder === null) return [{ id: null as number | null, name: "Root" }];

    const path: { id: number | null; name: string }[] = [];
    let current: number | null = selectedFolder;

    while (current !== null) {
      const folder = folderMap.get(current);
      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name });
      current = folder.parent_id;
    }

    path.unshift({ id: null, name: "Root" });
    return path;
  }, [selectedFolder, folderMap]);

  // Load folders
  const loadFolders = async () => {
    try {
      const resp = await adminApiCall<{ data: MediaFolder[] }>(
        AdminEndpoints.media.folders.tree
      );
      const tree = resp.data || [];
      const map = new Map<number, MediaFolder>();

      const traverse = (list: MediaFolder[]) => {
        list.forEach((f) => {
          map.set(f.id, f);
          if (f.children && f.children.length) traverse(f.children);
        });
      };

      traverse(tree);
      setFolders(tree);
      setFolderMap(map);
    } catch (err: any) {
      const msg = err?.message || "Không thể tải danh sách thư mục";
      // Silently fail
      toast.error(msg);
    }
  };

  // Load files
  const loadFiles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFolder !== null) params.append("folder_id", selectedFolder.toString());
      else params.append("folder_id", "null");
      if (searchQuery) params.append("search", searchQuery);
      if (fileTypeFilter !== "all") params.append("file_type", fileTypeFilter);
      params.append("sort_by", sortBy);
      params.append("sort_order", "DESC");
      params.append("page", "1");
      params.append("limit", "100");

      const resp = await adminApiCall<{ data: MediaFile[]; pagination: any }>(
        `${AdminEndpoints.media.files.list}?${params.toString()}`
      );
      setFiles(resp.data || []);
    } catch (err: any) {
      const msg = err?.message || "Không thể tải danh sách file";
      // Silently fail
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    loadFiles();
  }, [selectedFolder, searchQuery, fileTypeFilter, sortBy]);

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Vui lòng nhập tên thư mục");
      return;
    }

    try {
      await adminApiCall(AdminEndpoints.media.folders.list, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: newFolderParent,
        }),
      });
      toast.success("Đã tạo thư mục thành công");
      setShowCreateFolder(false);
      setNewFolderName("");
      setNewFolderParent(null);
      loadFolders();
    } catch (err: any) {
      const msg = err?.message || "Không thể tạo thư mục";
      // Silently fail
      toast.error(msg);
    }
  };

  // Delete folder
  const handleDeleteFolder = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa thư mục này?")) return;
    try {
      await adminApiCall(AdminEndpoints.media.folders.detail(id), { method: "DELETE" });
      toast.success("Đã xóa thư mục thành công");
      if (selectedFolder === id) setSelectedFolder(null);
      setSelectedFolders((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      loadFolders();
    } catch (err: any) {
      const msg = err?.message || "Không thể xóa thư mục";
      toast.error(msg);
    }
  };

  // Upload files (input & drag-drop dùng chung)
  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const fileArray = Array.from(fileList);

    // Giới hạn tối đa 6 file
    if (fileArray.length > 6) {
      toast.error("Chỉ có thể upload tối đa 6 file cùng lúc");
      return;
    }

    // Kiểm tra kích thước file video (giới hạn 50MB)
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    const oversizedVideos = fileArray.filter(file => 
      file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE
    );

    if (oversizedVideos.length > 0) {
      const fileNames = oversizedVideos.map(f => `"${f.name}" (${formatFileSize(f.size)})`).join(', ');
      toast.error(`File video vượt quá giới hạn 50MB: ${fileNames}`);
      return;
    }

    try {
      setUploading(true);
      if (fileArray.length === 1) {
        await uploadFile(fileArray[0], selectedFolder ?? undefined);
        toast.success("Upload file thành công");
      } else {
        const results = await uploadFiles(fileArray, selectedFolder ?? undefined);
        toast.success(`Đã upload ${results.length} file thành công`);
      }
      setShowUpload(false);
      loadFiles();
    } catch (err: any) {
      const msg = err?.message || "Không thể upload file";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    await handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  // Delete
  const handleDeleteFile = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa file này?")) return;
    try {
      await adminApiCall(AdminEndpoints.media.files.detail(id), { method: "DELETE" });
      toast.success("Đã xóa file thành công");
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      loadFiles();
    } catch (err: any) {
      const msg = err?.message || "Không thể xóa file";
      toast.error(msg);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;
    if (!confirm(`Xóa ${selectedFiles.size} file đã chọn?`)) return;
    try {
      await Promise.all(
        Array.from(selectedFiles).map((id) =>
          adminApiCall(AdminEndpoints.media.files.detail(id), { method: "DELETE" })
        )
      );
      toast.success("Đã xóa file đã chọn");
      setSelectedFiles(new Set());
      loadFiles();
    } catch (err: any) {
      const msg = err?.message || "Không thể xóa file đã chọn";
      toast.error(msg);
    }
  };

  const toggleSelectFile = (id: number) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectFolder = (id: number) => {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  const toggleSelectAllFolders = () => {
    const allIds = Array.from(folderMap.keys());
    if (selectedFolders.size === allIds.length) {
      setSelectedFolders(new Set());
    } else {
      setSelectedFolders(new Set(allIds));
    }
  };

  const toggleExpandFolder = (id: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelectedFolders = async () => {
    if (selectedFolders.size === 0) return;
    if (!confirm(`Xóa ${selectedFolders.size} thư mục đã chọn?`)) return;
    let success = 0;
    let failed = 0;
    for (const id of Array.from(selectedFolders)) {
      try {
        await adminApiCall(AdminEndpoints.media.folders.detail(id), { method: "DELETE" });
        success++;
        if (selectedFolder === id) {
          setSelectedFolder(null);
        }
      } catch (err: any) {
        // Silently fail
        failed++;
      }
    }
    if (success > 0) {
      toast.success(`Đã xóa ${success} thư mục`);
      setSelectedFolders(new Set());
      loadFolders();
      loadFiles();
    }
    if (failed > 0) {
      toast.error(`Không thể xóa ${failed} thư mục (có thể còn file hoặc thư mục con)`);
    }
  };

  const renderFolderTree = (folderList: MediaFolder[], level = 0) =>
    folderList.map((folder) => {
      const hasChildren = !!folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      return (
        <div key={folder.id} className="select-none">
          <div
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer ${
              selectedFolder === folder.id ? "bg-blue-50 border border-blue-100" : ""
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              setSelectedFolder(folder.id);
              if (hasChildren) {
                toggleExpandFolder(folder.id);
              }
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                className="flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelectFolder(folder.id);
                }}
              >
                {selectedFolders.has(folder.id) ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {hasChildren && (
                <button
                  type="button"
                  className="flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpandFolder(folder.id);
                  }}
                >
                  <ChevronRight
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
              )}
              {!hasChildren && <span className="w-4" />} {/* align text when no chevron */}
              <FolderTree className="w-4 h-4 text-blue-600" />
              <span className="text-sm truncate">{folder.name}</span>
              <span className="text-xs text-gray-500">({folder.fileCount})</span>
            </div>
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-600"
                onClick={() => handleDeleteFolder(folder.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderFolderTree(folder.children!, level + 1)}</div>
          )}
        </div>
      );
    });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thư viện Media</h1>
          <p className="text-gray-500 mt-1">Quản lý file và thư mục media</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setNewFolderParent(selectedFolder);
              setShowCreateFolder(true);
            }}
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Tạo thư mục
          </Button>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Tải lên
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-180px)]">
        {/* Left - folders */}
        <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-gray-600"
                onClick={toggleSelectAllFolders}
              >
                {selectedFolders.size === 0 ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                )}
                <span>Chọn tất cả</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {selectedFolders.size > 0 && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDeleteSelectedFolders}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setNewFolderParent(selectedFolder);
                  setShowCreateFolder(true);
                }}
              >
                <FolderPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>Chọn thư mục để xem / thao tác</span>
            </div>
            {selectedFolders.size > 0 && (
              <span>{selectedFolders.size} thư mục đã chọn</span>
            )}
          </div>
          <div className="flex-1 overflow-auto space-y-1 pr-1">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer ${
                selectedFolder === null ? "bg-blue-50 border border-blue-100" : ""
              }`}
              onClick={() => setSelectedFolder(null)}
            >
              <Home className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Root</span>
            </div>
            {renderFolderTree(folders)}
          </div>
        </div>

        {/* Right - files */}
        <div
          className={`flex-1 bg-white rounded-xl border border-gray-200 p-4 flex flex-col ${
            dragActive ? "ring-2 ring-blue-400 ring-offset-2" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Breadcrumb + actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <button
                    className={`hover:text-blue-600 ${
                      selectedFolder === crumb.id ? "text-blue-600 font-semibold" : ""
                    }`}
                    onClick={() => setSelectedFolder(crumb.id)}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAllFiles}
                disabled={files.length === 0}
              >
                {selectedFiles.size === files.length && files.length > 0 ? (
                  <>
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Bỏ chọn tất cả
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    Chọn tất cả
                  </>
                )}
              </Button>
              {selectedFiles.size > 0 && (
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Xóa {selectedFiles.size}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[260px]">
              <Input
                placeholder="Tìm kiếm tệp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Loại file" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="image">Hình ảnh</SelectItem>
                <SelectItem value="document">Tài liệu</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Ngày tạo</SelectItem>
                <SelectItem value="original_name">Tên (A - Z)</SelectItem>
                <SelectItem value="file_size">Kích thước</SelectItem>
                <SelectItem value="file_type">Loại file</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {dragActive && (
            <div className="mb-3 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Thả file vào đây để upload vào thư mục hiện tại
            </div>
          )}

          {selectedFiles.size > 0 && (
            <div className="mb-3 text-sm text-gray-700 flex items-center gap-3">
              <span>Đã chọn {selectedFiles.size} file</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFiles(new Set())}>
                Bỏ chọn
              </Button>
            </div>
          )}

          {/* File list */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Đang tải...</div>
            ) : files.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-lg text-gray-500 bg-gray-50">
                Không có file nào trong thư mục này. Kéo thả file hoặc bấm Upload.
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {files.map((file) => {
                  const FileIcon = getFileIcon(file.file_type);
                  const isSelected = selectedFiles.has(file.id);
                  const imageUrl = file.file_url.startsWith("/")
                    ? buildUrl(file.file_url)
                    : file.file_url;

                  return (
                    <div
                      key={file.id}
                      className={`group relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        isSelected ? "ring-2 ring-blue-500" : "hover:shadow-md"
                      }`}
                    >
                      <div className="absolute top-2 left-2 z-10">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectFile(file.id);
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500" />
                          )}
                        </Button>
                      </div>

                      {file.file_type === "image" ? (
                        <img
                          src={imageUrl}
                          alt={file.alt_text || file.original_name}
                          className="w-full h-48 object-cover"
                          onClick={() => setPreviewFile(file)}
                        />
                      ) : file.file_type === "video" ? (
                        <video
                          src={imageUrl}
                          className="w-full h-48 object-cover"
                          preload="metadata"
                          muted
                          onClick={() => setPreviewFile(file)}
                        />
                      ) : (
                        <div
                          className="w-full h-48 bg-gray-50 flex items-center justify-center"
                          onClick={() => setPreviewFile(file)}
                        >
                          <FileIcon className="w-12 h-12 text-gray-400" />
                        </div>
                      )}

                      <div className="p-3 space-y-1" onClick={() => setPreviewFile(file)}>
                        <div className="text-sm font-medium truncate">
                          {file.original_name}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>
                            {file.file_type === "image" ? "Hình ảnh" : file.file_type}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(file.file_size)}</span>
                        </div>
                      </div>

                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewFile(file);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(file.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((file) => {
                  const FileIcon = getFileIcon(file.file_type);
                  const isSelected = selectedFiles.has(file.id);
                  const imageUrl = file.file_url.startsWith("/")
                    ? buildUrl(file.file_url)
                    : file.file_url;

                  return (
                    <div
                      key={file.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-all ${
                        isSelected ? "bg-blue-50 border-blue-300" : ""
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSelectFile(file.id)}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      {file.file_type === "image" ? (
                        <img
                          src={imageUrl}
                          alt={file.alt_text || file.original_name}
                          className="w-14 h-14 object-cover rounded"
                          onClick={() => setPreviewFile(file)}
                        />
                      ) : file.file_type === "video" ? (
                        <video
                          src={imageUrl}
                          className="w-14 h-14 object-cover rounded"
                          preload="metadata"
                          muted
                          onClick={() => setPreviewFile(file)}
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center"
                          onClick={() => setPreviewFile(file)}
                        >
                          <FileIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0" onClick={() => setPreviewFile(file)}>
                        <div className="font-medium truncate">{file.original_name}</div>
                        <div className="text-sm text-gray-500">
                          {formatFileSize(file.file_size)} • {file.file_type}
                        </div>
                        <div className="text-xs text-gray-400">
                          Tạo {new Date(file.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewFile(file)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-500">Tổng cộng {files.length} files</div>
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo thư mục mới</DialogTitle>
            <DialogDescription>
              Tạo thư mục mới để tổ chức file của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <Label>Tên thư mục</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nhập tên thư mục..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tải lên Media</DialogTitle>
            <DialogDescription>
              Chọn file để upload vào thư mục hiện tại
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 6) {
                  toast.error("Chỉ có thể chọn tối đa 6 file cùng lúc");
                  e.target.value = ""; // Reset input
                  return;
                }
                handleFileUpload(files);
              }}
              disabled={uploading}
            />
            {uploading && <div className="text-sm text-gray-500">Đang upload...</div>}
            <p className="text-xs text-gray-500">
              Chỉ chấp nhận file ảnh, video và audio. Tối đa 6 file cùng lúc. Video giới hạn 50MB.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="break-words break-all">
              {previewFile?.original_name}
            </DialogTitle>
            <DialogDescription>
              {previewFile
                ? `${formatFileSize(previewFile.file_size)} • ${previewFile.file_type}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-3 flex items-center justify-center bg-gray-50 rounded-lg p-4">
                {previewFile.file_type === "image" ? (
                  <img
                    src={
                      previewFile.file_url.startsWith("/")
                        ? buildUrl(previewFile.file_url)
                        : previewFile.file_url
                    }
                    alt={previewFile.alt_text || previewFile.original_name}
                    className="max-h-[400px] object-contain"
                  />
                ) : previewFile.file_type === "video" ? (
                  <video
                    src={
                      previewFile.file_url.startsWith("/")
                        ? buildUrl(previewFile.file_url)
                        : previewFile.file_url
                    }
                    controls
                    className="max-h-[400px] max-w-full object-contain"
                  >
                    Trình duyệt của bạn không hỗ trợ video.
                  </video>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    {(() => {
                      const Icon = getFileIcon(previewFile.file_type);
                      return <Icon className="w-10 h-10" />;
                    })()}
                    <span>Không hỗ trợ preview. Tải file để xem.</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 space-y-2 text-sm text-gray-700 min-w-0">
                <div className="font-semibold">Thông tin</div>
                <div className="flex gap-2">
                  <span className="shrink-0">Tên:</span>
                  <span className="min-w-0 break-words break-all">
                    {previewFile.original_name}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0">Kích thước:</span>
                  <span className="min-w-0 break-words break-all">
                    {formatFileSize(previewFile.file_size)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0">Loại:</span>
                  <span className="min-w-0 break-words break-all">
                    {previewFile.file_type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="shrink-0">Tạo ngày:</span>
                  <span className="min-w-0 break-words break-all">
                    {new Date(previewFile.created_at).toLocaleString()}
                  </span>
                </div>
                {previewFile.alt_text && (
                  <div className="flex gap-2">
                    <span className="shrink-0">Alt:</span>
                    <span className="min-w-0 break-words break-all">
                      {previewFile.alt_text}
                    </span>
                  </div>
                )}
                {previewFile.description && (
                  <div className="flex gap-2">
                    <span className="shrink-0">Mô tả:</span>
                    <span className="min-w-0 break-words break-all">
                      {previewFile.description}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            {previewFile && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteFile(previewFile.id);
                  setPreviewFile(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa file
              </Button>
            )}
            <Button onClick={() => setPreviewFile(null)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaLibraryPage;
