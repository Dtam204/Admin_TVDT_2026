"use client";

import { useRef, useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image as ImageIcon,
  Undo,
  Redo,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Type,
  Palette,
  Loader2,
  Indent,
  Outdent,
  Subscript,
  Superscript,
  Minus,
  RemoveFormatting,
  Maximize2,
  Minimize2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import MediaLibraryPicker from "@/app/(admin)/admin/news/MediaLibraryPicker";
import { uploadFile } from "@/lib/api/admin";
import { buildUrl } from "@/lib/api/base";
import { toast } from "sonner";

type MediaElement = HTMLImageElement | HTMLVideoElement;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const isUpdatingRef = useRef(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaElement | null>(null);
  const [mediaTab, setMediaTab] = useState<"upload" | "library">("library");
  const [uploading, setUploading] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedImageRect, setSelectedImageRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
  } | null>(null);
  const [controlPanelPosition, setControlPanelPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const resizingRef = useRef<{
    startX: number;
    startWidth: number;
  } | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Lưu selection trước khi update
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      try {
        selectionRef.current = selection.getRangeAt(0).cloneRange();
        return true;
      } catch (e) {
        // Ignore
      }
    }
    return false;
  };

  // Khôi phục selection sau khi update
  const restoreSelection = () => {
    if (selectionRef.current && editorRef.current) {
      const selection = window.getSelection();
      if (selection) {
        try {
          selection.removeAllRanges();
          selection.addRange(selectionRef.current);
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  // Khởi tạo editor với value ban đầu
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Sync value với editor
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const currentContent = editorRef.current.innerHTML || "";
      const normalizedValue = value || "";
      
      if (currentContent !== normalizedValue && value !== undefined) {
        const wasFocused = document.activeElement === editorRef.current;
        const hadSelection = saveSelection();
        
        isUpdatingRef.current = true;
        editorRef.current.innerHTML = normalizedValue;
        
        requestAnimationFrame(() => {
          if (wasFocused && hadSelection) {
            restoreSelection();
            editorRef.current?.focus();
          }
          isUpdatingRef.current = false;
        });
      }
    }
  }, [value]);

  const execCommand = (command: string, commandValue?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      saveSelection();
      document.execCommand(command, false, commandValue);
      isUpdatingRef.current = true;
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      isUpdatingRef.current = false;
      setTimeout(() => {
        restoreSelection();
      }, 0);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (editorRef.current && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const newValue = editorRef.current.innerHTML;
      if (newValue !== value) {
        onChange(newValue);
      }
      isUpdatingRef.current = false;
    }
  };

  const addLink = () => {
    const url = window.prompt("Nhập URL:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const addImage = () => {
    const url = window.prompt("Nhập URL hình ảnh:");
    if (url) {
      execCommand("insertImage", url);
    }
  };

  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return true;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => lowerUrl.includes(ext));
  };

  const insertMediaIntoEditor = (url: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      if (selectionRef.current) {
        const range = selectionRef.current;
        range.collapse(false);
        const isVideo = isVideoUrl(url);
        let mediaElement: HTMLElement;
        if (isVideo) {
          const video = document.createElement("video");
          video.src = url;
          video.controls = true;
          video.style.maxWidth = "100%";
          video.style.height = "auto";
          mediaElement = video;
        } else {
          const img = document.createElement("img");
          img.src = url;
          img.alt = "";
          img.style.maxWidth = "100%";
          img.style.height = "auto";
          mediaElement = img;
        }
        range.insertNode(mediaElement);
        const newRange = document.createRange();
        newRange.setStartAfter(mediaElement);
        newRange.setEndAfter(mediaElement);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        selectionRef.current = newRange;
        onChange(editorRef.current.innerHTML);
        return;
      }
    } catch (e) {}

    const currentHtml = editorRef.current.innerHTML || "";
    const isVideo = isVideoUrl(url);
    const mediaHtml = isVideo
      ? `<p><video src="${url}" controls style="max-width: 100%; height: auto;"></video></p>`
      : `<p><img src="${url}" alt="" style="max-width: 100%; height: auto;" /></p>`;
    const mergedHtml = currentHtml ? `${currentHtml}${mediaHtml}` : mediaHtml;
    editorRef.current.innerHTML = mergedHtml;
    onChange(mergedHtml);
  };

  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const file = files[0];
    const isVideo = file.type.startsWith("video/");
    try {
      setUploading(true);
      const uploadedFile = await uploadFile(file);
      const mediaUrl = uploadedFile.file_url?.startsWith("/") ? buildUrl(uploadedFile.file_url) : uploadedFile.file_url;
      setShowMediaDialog(false);
      insertMediaIntoEditor(mediaUrl);
      toast.success("Tải lên thành công");
    } catch (error: any) {
      toast.error(error?.message || "Lỗi tải lên");
    } finally {
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = "";
      setUploading(false);
    }
  };

  const commonColors = [
    { name: "Đen", value: "#000000" },
    { name: "Xám đậm", value: "#333333" },
    { name: "Đỏ", value: "#EF4444" },
    { name: "Cam", value: "#F97316" },
    { name: "Xanh lá", value: "#22C55E" },
    { name: "Xanh dương", value: "#3B82F6" },
    { name: "Tím", value: "#A855F7" },
  ];

  const updateSelectedImageSize = (mode: string) => {
    if (!selectedImage) return;
    selectedImage.style.width = mode === "small" ? "40%" : mode === "medium" ? "60%" : mode === "large" ? "80%" : "100%";
    selectedImage.style.height = "auto";
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const updateSelectedImageAlign = (align: string) => {
    if (!selectedImage || !editorRef.current) return;
    selectedImage.style.display = "block";
    selectedImage.style.marginLeft = align === "center" || align === "right" ? "auto" : "0";
    selectedImage.style.marginRight = align === "center" || align === "left" ? "auto" : "0";
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden relative transition-all ${isFullScreen ? 'fixed inset-4 z-[100] bg-white shadow-2xl flex flex-col' : ''}`}>
      <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {/* Basic formatting buttons */}
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("undo")}><Undo className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("redo")}><Redo className="w-4 h-4" /></Button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("bold")}><Bold className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("italic")}><Italic className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("underline")}><Underline className="w-4 h-4" /></Button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("formatBlock", "h1")}><Heading1 className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("formatBlock", "h2")}><Heading2 className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("formatBlock", "p")}><Type className="w-4 h-4" /></Button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("justifyLeft")}><AlignLeft className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("justifyCenter")}><AlignCenter className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("justifyRight")}><AlignRight className="w-4 h-4" /></Button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("insertUnorderedList")}><List className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => execCommand("insertOrderedList")}><ListOrdered className="w-4 h-4" /></Button>
        <div className="w-px h-8 bg-gray-300 mx-1" />
        <Button type="button" size="icon" variant="ghost" onClick={() => setShowMediaDialog(true)}><ImageIcon className="w-4 h-4" /></Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => setIsFullScreen(!isFullScreen)}>
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </Button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={saveSelection}
        onFocus={restoreSelection}
        onMouseUp={(e) => {
          const target = e.target as HTMLElement;
          if (target && (target.tagName === "IMG" || target.tagName === "VIDEO")) {
            setSelectedImage(target as MediaElement);
          } else {
            setSelectedImage(null);
          }
          saveSelection();
        }}
        className="min-h-[300px] p-4 focus:outline-none prose prose-lg max-w-none"
        style={{ minHeight: "300px" }}
        data-placeholder={placeholder}
      />

      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Thư viện Media</DialogTitle></DialogHeader>
          <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as any)} className="flex-1 overflow-hidden flex flex-col">
            <TabsList><TabsTrigger value="library">Thư viện</TabsTrigger><TabsTrigger value="upload">Tải lên</TabsTrigger></TabsList>
            <TabsContent value="library" className="flex-1 overflow-y-auto pt-4">
              <MediaLibraryPicker onSelectImage={(url) => { setShowMediaDialog(false); insertMediaIntoEditor(url); }} />
            </TabsContent>
            <TabsContent value="upload" className="flex-1 pt-4">
              <div className="border-2 border-dashed rounded-lg p-10 text-center">
                <input ref={mediaFileInputRef} type="file" className="hidden" onChange={handleMediaFileUpload} />
                <Button type="button" onClick={() => mediaFileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                  Chọn file tải lên
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
