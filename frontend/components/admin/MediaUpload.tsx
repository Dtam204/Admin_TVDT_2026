"use client";

import { useRef, useState, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Video, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/lib/api/admin";
import { buildUrl } from "@/lib/api/base";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MediaLibraryPicker from "@/app/(admin)/admin/news/MediaLibraryPicker";

interface MediaUploadProps {
  onMediaSelect?: (mediaUrl: string) => void;
  currentMedia?: string;
  fileTypeFilter?: string; // "image", "video", "image,video"
  label?: string;
}

// Helper để normalize media URL
function normalizeMediaUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/")) {
    return buildUrl(url);
  }
  return url;
}

// Helper để check xem URL là video hay image
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();

  // YouTube / streaming platforms
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return true;
  }

  // Check extension
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  // Check path contains /video/
  if (lowerUrl.includes('/video/')) {
    return true;
  }
  return false;
}

export default function MediaUpload({
  onMediaSelect,
  currentMedia,
  fileTypeFilter = "image,video",
  label = "Ảnh/Video Hero",
}: MediaUploadProps) {
  const [preview, setPreview] = useState<string>(normalizeMediaUrl(currentMedia));
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  
  useEffect(() => {
    const normalized = normalizeMediaUrl(currentMedia);
    setPreview(normalized);
    if (normalized) {
      setMediaType(isVideoUrl(normalized) ? "video" : "image");
    }
  }, [currentMedia]);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [mediaTab, setMediaTab] = useState<"upload" | "library">("upload");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const file = files[0];
    const allowedTypes = fileTypeFilter.split(',').map(t => t.trim());
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!allowedTypes.includes("image") && isImage) {
      toast.error("Chỉ cho phép upload video.");
      return;
    }
    if (!allowedTypes.includes("video") && isVideo) {
      toast.error("Chỉ cho phép upload ảnh.");
      return;
    }
    if (!isImage && !isVideo) {
      toast.error("Vui lòng chọn file ảnh hoặc video");
      return;
    }

    // Check file size (50MB cho video, 10MB cho ảnh)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File quá lớn. Kích thước tối đa là ${isVideo ? '50MB' : '10MB'}`);
      return;
    }

    try {
      setUploading(true);

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setMediaType(isVideo ? "video" : "image");
      };
      reader.readAsDataURL(file);

      // Upload to media library
      const uploadedFile = await uploadFile(file);
      const mediaUrl = uploadedFile.file_url?.startsWith("/")
        ? buildUrl(uploadedFile.file_url)
        : uploadedFile.file_url;

      setPreview(mediaUrl);
      setMediaType(isVideo ? "video" : "image");
      onMediaSelect?.(mediaUrl);
      toast.success(`Upload ${isVideo ? "video" : "ảnh"} thành công`);
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra khi upload file");
      setPreview(currentMedia || "");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setUploading(false);
    }
  };

  const handleUrlInput = () => {
    const url = window.prompt("Nhập URL media (ảnh hoặc video):");
    if (url) {
      setPreview(url);
      setMediaType(isVideoUrl(url) ? "video" : "image");
      onMediaSelect?.(url);
    }
  };

  const handleRemove = () => {
    setPreview("");
    setMediaType("image");
    onMediaSelect?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSelectFromLibrary = (url: string) => {
    setPreview(url);
    setMediaType(isVideoUrl(url) ? "video" : "image");
    onMediaSelect?.(url);
    setShowMediaLibrary(false);
  };

  const acceptTypes = fileTypeFilter.includes("image") && fileTypeFilter.includes("video")
    ? "image/*,video/*"
    : fileTypeFilter.includes("image")
    ? "image/*"
    : "video/*";

  return (
    <div className="w-full space-y-4">
      {preview ? (
        <div className="relative group w-full">
          {mediaType === "video" ? (
            <video
              src={preview}
              controls
              className="w-full h-64 object-cover rounded-lg border border-gray-200"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg border border-gray-200"
            />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Đang upload...</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-lg flex items-center justify-center">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              disabled={uploading}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          {fileTypeFilter.includes("image") && fileTypeFilter.includes("video") ? (
            <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          ) : fileTypeFilter.includes("video") ? (
            <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          ) : (
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          )}
          <p className="text-gray-600 mb-4">Kéo thả file media vào đây hoặc</p>
          <div className="flex gap-3 justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload từ máy
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleUrlInput}
              disabled={uploading}
            >
              Nhập URL
            </Button>
            <Dialog open={showMediaLibrary} onOpenChange={setShowMediaLibrary}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMediaTab("library");
                    setShowMediaLibrary(true);
                  }}
                  disabled={uploading}
                >
                  <Library className="w-4 h-4 mr-2" />
                  Chọn từ thư viện
                </Button>
              </DialogTrigger>
              <DialogContent
                style={{
                  maxWidth: "1100px",
                  width: "1100px",
                  maxHeight: "80vh",
                  height: "80vh",
                  display: "flex",
                  flexDirection: "column",
                  overflowY: "auto"
                }}
              >
                <DialogHeader>
                  <DialogTitle>Chọn Media từ Thư viện</DialogTitle>
                </DialogHeader>
                <Tabs value={mediaTab} onValueChange={(value) => setMediaTab(value as "upload" | "library")} className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload mới</TabsTrigger>
                    <TabsTrigger value="library">Thư viện</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="flex-1 flex flex-col pt-4">
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Kéo thả file media vào đây hoặc</p>
                      <Button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang upload...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Chọn file
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="library" className="flex-1 flex flex-col pt-4">
                    <MediaLibraryPicker onSelectImage={handleSelectFromLibrary} fileTypeFilter={fileTypeFilter} />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
