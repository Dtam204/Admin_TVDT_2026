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
  Languages,
  Sparkles,
  Loader2,
  Indent,
  Outdent,
  Subscript,
  Superscript,
  Minus,
  RemoveFormatting,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
import { Upload, Video as VideoIcon } from "lucide-react";
import MediaLibraryPicker from "@/app/(admin)/admin/news/MediaLibraryPicker";
import { uploadFile } from "@/lib/api/admin";
import { buildUrl } from "@/lib/api/base";
import { toast } from "sonner";

type Locale = 'vi' | 'en' | 'ja';
type MediaElement = HTMLImageElement | HTMLVideoElement;

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  globalLocale?: Locale;
  translateData?: (data: any, updateCallback: (translated: any) => void, sectionName?: string) => Promise<void>;
  translatingAll?: boolean;
  translateSourceLang?: Locale;
  setTranslateSourceLang?: (lang: Locale) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung...",
  globalLocale = 'vi',
  translateData,
  translatingAll = false,
  translateSourceLang = 'vi',
  setTranslateSourceLang,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const isUpdatingRef = useRef(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [showTranslateDialog, setShowTranslateDialog] = useState(false);
  const [translateText, setTranslateText] = useState("");
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

  // Lưu selection trước khi update
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      try {
        selectionRef.current = selection.getRangeAt(0).cloneRange();
        return true;
      } catch (e) {
        // Ignore nếu không thể clone
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
          // Ignore nếu không thể restore
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

  // Sync value với editor nhưng không làm mất focus (chỉ khi value thay đổi từ bên ngoài)
  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      const currentContent = editorRef.current.innerHTML || "";
      const normalizedValue = value || "";
      
      // Chỉ update nếu value thay đổi từ bên ngoài (không phải từ user typing)
      if (currentContent !== normalizedValue && value !== undefined) {
        const wasFocused = document.activeElement === editorRef.current;
        const hadSelection = saveSelection();
        
        isUpdatingRef.current = true;
        editorRef.current.innerHTML = normalizedValue;
        
        // Khôi phục selection và focus sau một chút để đảm bảo DOM đã update
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
      // Chỉ update nếu thực sự thay đổi
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

  // Helper function để check xem URL là video hay image
  const isVideoUrl = (url: string): boolean => {
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
  };

  // Hàm chèn media (ảnh hoặc video) vào editor
  const insertMediaIntoEditor = (url: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();

    try {
      if (selectionRef.current) {
        // Dùng Range API để chèn media tại đúng vị trí con trỏ
        const range = selectionRef.current;
        range.collapse(false);

        const isVideo = isVideoUrl(url);
        let mediaElement: HTMLElement;

        if (isVideo) {
          // Tạo video element
          const video = document.createElement("video");
          video.src = url;
          video.controls = true;
          video.style.maxWidth = "100%";
          video.style.height = "auto";
          mediaElement = video;
        } else {
          // Tạo image element
          const img = document.createElement("img");
          img.src = url;
          img.alt = "";
          img.style.maxWidth = "100%";
          img.style.height = "auto";
          mediaElement = img;
        }

        range.insertNode(mediaElement);

        // Di chuyển caret ra sau media
        const newRange = document.createRange();
        newRange.setStartAfter(mediaElement);
        newRange.setEndAfter(mediaElement);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(newRange);
        }

        // Cập nhật selectionRef sang vị trí mới
        selectionRef.current = newRange;

        const htmlAfter = editorRef.current.innerHTML || "";
        if (htmlAfter !== value) {
          onChange(htmlAfter);
        }
        return;
      }
    } catch {
      // ignore, sẽ fallback phía dưới
    }

    // Fallback: nếu không có selection (chưa click vào nội dung)
    // thì append media vào cuối bài
    const currentHtml =
      (editorRef.current.innerHTML &&
      editorRef.current.innerHTML.trim().length > 0
        ? editorRef.current.innerHTML
        : value) || "";

    const isVideo = isVideoUrl(url);
    const mediaHtml = isVideo
      ? `<p><video src="${url}" controls style="max-width: 100%; height: auto;"></video></p>`
      : `<p><img src="${url}" alt="" style="max-width: 100%; height: auto;" /></p>`;
    const mergedHtml = currentHtml
      ? `${currentHtml}${mediaHtml}`
      : mediaHtml;

    editorRef.current.innerHTML = mergedHtml;
    if (mergedHtml !== value) {
      onChange(mergedHtml);
    }
  };

  // Hàm upload file media mới
  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

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

      // Upload to media library
      const uploadedFile = await uploadFile(file);
      const mediaUrl = uploadedFile.file_url?.startsWith("/")
        ? buildUrl(uploadedFile.file_url)
        : uploadedFile.file_url;

      toast.success(`Upload ${isVideo ? "video" : "ảnh"} thành công`);
      
      // Đóng dialog và chèn media vào editor
      setShowMediaDialog(false);
      insertMediaIntoEditor(mediaUrl);
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra khi upload file");
    } finally {
      if (mediaFileInputRef.current) {
        mediaFileInputRef.current.value = "";
      }
      setUploading(false);
    }
  };

  const setColor = (color: string) => {
    execCommand("foreColor", color);
    setShowColorPicker(false);
  };

  const setBackgroundColor = (color: string) => {
    execCommand("backColor", color);
    setShowColorPicker(false);
  };

  const commonColors = [
    { name: "Đen", value: "#000000" },
    { name: "Xám đậm", value: "#333333" },
    { name: "Xám", value: "#666666" },
    { name: "Xám nhạt", value: "#999999" },
    { name: "Trắng", value: "#FFFFFF" },
    { name: "Đỏ", value: "#EF4444" },
    { name: "Cam", value: "#F97316" },
    { name: "Vàng", value: "#EAB308" },
    { name: "Xanh lá", value: "#22C55E" },
    { name: "Xanh dương", value: "#3B82F6" },
    { name: "Tím", value: "#A855F7" },
    { name: "Hồng", value: "#EC4899" },
  ];

  const updateSelectedImageSize = (mode: "small" | "medium" | "large" | "full") => {
    if (!selectedImage) return;
    let width: string;
    switch (mode) {
      case "small":
        width = "40%";
        break;
      case "medium":
        width = "60%";
        break;
      case "large":
        width = "80%";
        break;
      case "full":
      default:
        width = "100%";
        break;
    }
    selectedImage.style.width = width;
    selectedImage.style.maxWidth = "100%";
    selectedImage.style.height = "auto";

    // Đồng bộ HTML mới ra ngoài
    if (editorRef.current) {
      const htmlAfter = editorRef.current.innerHTML || "";
      if (htmlAfter !== value) {
        onChange(htmlAfter);
      }
    }
  };

  const updateSelectedImageAlign = (align: "left" | "center" | "right") => {
    if (!selectedImage || !editorRef.current) return;

    const imgSrc = selectedImage.src;
    let parent = selectedImage.parentElement;
    
    // Xóa các style align cũ của ảnh
    selectedImage.style.marginLeft = "";
    selectedImage.style.marginRight = "";
    selectedImage.style.display = "";
    selectedImage.style.float = "";

    // Kiểm tra xem parent có phải là editor không
    const isDirectChild = !parent || parent === editorRef.current || parent.tagName === "BODY";
    
    if (isDirectChild) {
      // Tạo div wrapper mới để wrap ảnh
      const wrapper = document.createElement("div");
      wrapper.style.textAlign = align;
      wrapper.style.marginBottom = "1rem";
      wrapper.style.width = "100%";
      
      // Di chuyển ảnh vào wrapper
      if (selectedImage.parentNode) {
        selectedImage.parentNode.insertBefore(wrapper, selectedImage);
        wrapper.appendChild(selectedImage);
      }
      parent = wrapper;
    } else if (parent) {
      // Sử dụng parent hiện tại, nhưng đảm bảo nó là block element
      if (parent.tagName === "P" || parent.tagName === "DIV") {
        parent.style.textAlign = align;
        parent.style.width = "100%";
        if (!parent.style.marginBottom && parent.tagName === "DIV") {
          parent.style.marginBottom = "1rem";
        }
      } else {
        // Nếu parent không phải p/div, tạo wrapper mới
        const wrapper = document.createElement("div");
        wrapper.style.textAlign = align;
        wrapper.style.marginBottom = "1rem";
        wrapper.style.width = "100%";
        
        if (selectedImage.parentNode) {
          selectedImage.parentNode.insertBefore(wrapper, selectedImage);
          wrapper.appendChild(selectedImage);
        }
        parent = wrapper;
      }
    }

    // Đảm bảo ảnh hiển thị đúng với align
    selectedImage.style.display = "block";
    if (align === "center") {
      selectedImage.style.marginLeft = "auto";
      selectedImage.style.marginRight = "auto";
    } else if (align === "right") {
      selectedImage.style.marginLeft = "auto";
      selectedImage.style.marginRight = "0";
    } else {
      selectedImage.style.marginLeft = "0";
      selectedImage.style.marginRight = "auto";
    }

    // Đồng bộ HTML mới ra ngoài
    const htmlAfter = editorRef.current.innerHTML || "";
    if (htmlAfter !== value) {
      onChange(htmlAfter);
    }

    // Cập nhật lại selectedImage reference và vị trí sau khi DOM đã update
    requestAnimationFrame(() => {
      const newImage = editorRef.current?.querySelector(`img[src="${imgSrc}"]`) as HTMLImageElement;
      if (newImage) {
        setSelectedImage(newImage);
      }
    });
  };

  const updateSelectedImageRect = () => {
    if (!selectedImage || !editorRef.current) {
      setSelectedImageRect(null);
      setControlPanelPosition(null);
      return;
    }
    const imgRect = selectedImage.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    const imageRect = {
      top: imgRect.top - editorRect.top,
      left: imgRect.left - editorRect.left,
      width: imgRect.width,
      height: imgRect.height,
      right: imgRect.right - editorRect.left,
      bottom: imgRect.bottom - editorRect.top,
    };
    setSelectedImageRect(imageRect);

    // Tính toán vị trí khối điều khiển (bên phải ảnh, hoặc bên dưới nếu không đủ chỗ)
    const controlPanelWidth = 220; // Ước tính chiều rộng khối điều khiển
    const controlPanelHeight = 80; // Ước tính chiều cao khối điều khiển
    const editorWidth = editorRect.width;
    const editorHeight = editorRect.height;
    const spaceRight = editorWidth - imageRect.right;
    const spaceBelow = editorHeight - imageRect.bottom;

    let panelTop = imageRect.top;
    let panelLeft = imageRect.right + 12;

    // Nếu không đủ chỗ bên phải, đặt bên dưới ảnh
    if (spaceRight < controlPanelWidth + 20) {
      panelLeft = imageRect.left;
      panelTop = imageRect.bottom + 12;
      // Nếu vẫn không đủ chỗ bên dưới, đặt bên trái ảnh
      if (spaceBelow < controlPanelHeight + 20 && imageRect.left > controlPanelWidth + 20) {
        panelLeft = imageRect.left - controlPanelWidth - 12;
        panelTop = imageRect.top;
      }
    }

    // Đảm bảo không tràn ra ngoài editor
    panelLeft = Math.max(12, Math.min(panelLeft, editorWidth - controlPanelWidth - 12));
    panelTop = Math.max(12, Math.min(panelTop, editorHeight - controlPanelHeight - 12));

    setControlPanelPosition({ top: panelTop, left: panelLeft });
  };

  // Cập nhật lại vị trí handle resize và khối điều khiển khi chọn ảnh mới
  useEffect(() => {
    if (!selectedImage) {
      setSelectedImageRect(null);
      setControlPanelPosition(null);
      return;
    }
    updateSelectedImageRect();
    const handle = () => updateSelectedImageRect();
    const handleScroll = () => updateSelectedImageRect();
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handleScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage]);

  const handleResizeMove = (event: MouseEvent) => {
    if (!selectedImage || !editorRef.current || !resizingRef.current) return;
    const { startX, startWidth } = resizingRef.current;
    const deltaX = event.clientX - startX;
    const newWidthPx = Math.max(40, startWidth + deltaX);
    const editorRect = editorRef.current.getBoundingClientRect();
    const editorWidth = editorRect.width || newWidthPx;
    const percent = Math.max(10, Math.min(100, (newWidthPx / editorWidth) * 100));

    selectedImage.style.width = `${percent}%`;
    selectedImage.style.maxWidth = "100%";
    selectedImage.style.height = "auto";

    // Đồng bộ HTML ra ngoài
    const htmlAfter = editorRef.current.innerHTML || "";
    if (htmlAfter !== value) {
      onChange(htmlAfter);
    }

    updateSelectedImageRect();
  };

  const stopResize = () => {
    window.removeEventListener("mousemove", handleResizeMove);
    window.removeEventListener("mouseup", stopResize);
    resizingRef.current = null;
  };

  const startResize = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImage) return;
    const imgRect = selectedImage.getBoundingClientRect();
    resizingRef.current = {
      startX: e.clientX,
      startWidth: imgRect.width,
    };
    window.addEventListener("mousemove", handleResizeMove);
    window.addEventListener("mouseup", stopResize);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("undo")}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("redo")}
          title="Làm lại (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Text Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("bold")}
          title="Đậm (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("italic")}
          title="Nghiêng (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("underline")}
          title="Gạch chân (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("strikeThrough")}
          title="Gạch ngang"
        >
          <Strikethrough className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("subscript")}
          title="Chỉ số dưới"
        >
          <Subscript className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("superscript")}
          title="Chỉ số trên"
        >
          <Superscript className="w-4 h-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Headings - Buttons riêng lẻ cho quick access */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Heading 1 (Ctrl+Alt+1)"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => {
            if (editorRef.current) {
              editorRef.current.focus();
              restoreSelection();
              try {
                document.execCommand("formatBlock", false, "h1");
                onChange(editorRef.current.innerHTML);
              } catch (e) {
                console.error("Error applying h1:", e);
              }
            }
          }}
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Heading 2 (Ctrl+Alt+2)"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => {
            if (editorRef.current) {
              editorRef.current.focus();
              restoreSelection();
              try {
                document.execCommand("formatBlock", false, "h2");
                onChange(editorRef.current.innerHTML);
              } catch (e) {
                console.error("Error applying h2:", e);
              }
            }
          }}
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Heading 3 (Ctrl+Alt+3)"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => {
            if (editorRef.current) {
              editorRef.current.focus();
              restoreSelection();
              try {
                document.execCommand("formatBlock", false, "h3");
                onChange(editorRef.current.innerHTML);
              } catch (e) {
                console.error("Error applying h3:", e);
              }
            }
          }}
        >
          <Heading3 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Heading 4 (Ctrl+Alt+4)"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => {
            if (editorRef.current) {
              editorRef.current.focus();
              restoreSelection();
              try {
                document.execCommand("formatBlock", false, "h4");
                onChange(editorRef.current.innerHTML);
              } catch (e) {
                console.error("Error applying h4:", e);
              }
            }
          }}
        >
          <Heading4 className="w-4 h-4" />
        </Button>

        {/* Normal Paragraph button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Đoạn văn thường"
          onMouseDown={(e) => {
            e.preventDefault();
            saveSelection();
          }}
          onClick={() => {
            if (editorRef.current) {
              editorRef.current.focus();
              restoreSelection();
              try {
                document.execCommand("formatBlock", false, "p");
                onChange(editorRef.current.innerHTML);
              } catch (e) {
                console.error("Error applying paragraph:", e);
              }
            }
          }}
        >
          <Type className="w-4 h-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Font Family */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              title="Font chữ"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <Type className="w-3 h-3 mr-1" />
              Font
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-1">
              <Label className="text-xs">Chọn font chữ</Label>
              {[
                { name: "Arial", value: "Arial, sans-serif" },
                { name: "Times New Roman", value: "Times New Roman, serif" },
                { name: "Georgia", value: "Georgia, serif" },
                { name: "Courier New", value: "Courier New, monospace" },
                { name: "Verdana", value: "Verdana, sans-serif" },
                { name: "Tahoma", value: "Tahoma, sans-serif" },
                { name: "Comic Sans MS", value: "Comic Sans MS, cursive" },
                { name: "Impact", value: "Impact, fantasy" },
                { name: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
              ].map((font) => (
                <Button
                  key={font.value}
                  type="button"
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 text-sm"
                  style={{ fontFamily: font.value }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.focus();
                      restoreSelection();
                      
                      const selection = window.getSelection();
                      if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        const span = document.createElement("span");
                        span.style.setProperty('font-family', font.value, 'important');
                        
                        try {
                          range.surroundContents(span);
                        } catch (e) {
                          const fragment = range.extractContents();
                          span.appendChild(fragment);
                          range.insertNode(span);
                        }
                        
                        onChange(editorRef.current.innerHTML);
                        setTimeout(() => saveSelection(), 0);
                      }
                    }
                  }}
                >
                  {font.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Font Size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              title="Cỡ chữ"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent losing focus
                saveSelection();
              }}
            >
              <Type className="w-3 h-3 mr-1" />
              Size
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-2">
              <Label className="text-xs">Cỡ chữ</Label>
              <div className="grid grid-cols-2 gap-2">
                {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (editorRef.current) {
                        editorRef.current.focus();
                        restoreSelection();
                        
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          const span = document.createElement("span");
                          span.style.setProperty('font-size', `${size}px`, 'important');
                          
                          try {
                            range.surroundContents(span);
                          } catch (e) {
                            // Nếu surroundContents fail, dùng cách khác
                            const fragment = range.extractContents();
                            span.appendChild(fragment);
                            range.insertNode(span);
                          }
                          
                          // Trigger input event để update state
                          const newValue = editorRef.current.innerHTML;
                          onChange(newValue);
                          
                          // Save selection sau khi apply
                          setTimeout(() => saveSelection(), 0);
                        }
                      }
                    }}
                  >
                    {size}px
                  </Button>
                ))}
              </div>
              <div className="pt-2 border-t">
                <Label className="text-xs mb-1 block">Tùy chỉnh (px)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Size"
                    min="8"
                    max="200"
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const customSize = parseInt(input.value);
                        
                        if (customSize && customSize >= 8 && customSize <= 200) {
                          if (editorRef.current) {
                            editorRef.current.focus();
                            restoreSelection();
                            
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                              const range = selection.getRangeAt(0);
                              const span = document.createElement("span");
                              span.style.setProperty('font-size', `${customSize}px`, 'important');
                              
                              try {
                                range.surroundContents(span);
                              } catch (e) {
                                const fragment = range.extractContents();
                                span.appendChild(fragment);
                                range.insertNode(span);
                              }
                              
                              // Trigger input event để update state
                              const newValue = editorRef.current.innerHTML;
                              onChange(newValue);
                              
                              // Clear input and save selection
                              input.value = "";
                              setTimeout(() => saveSelection(), 0);
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Nhấn Enter để áp dụng (8-200)</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Line Height */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              title="Khoảng cách dòng"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
            >
              <AlignJustify className="w-3 h-3 mr-1" />
              Line
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="space-y-1">
              <Label className="text-xs">Khoảng cách dòng</Label>
              {[
                { name: "Đơn (1.0)", value: "1" },
                { name: "1.15", value: "1.15" },
                { name: "1.5", value: "1.5" },
                { name: "Đôi (2.0)", value: "2" },
                { name: "2.5", value: "2.5" },
                { name: "3.0", value: "3" },
              ].map((lineHeight) => (
                <Button
                  key={lineHeight.value}
                  type="button"
                  variant="ghost"
                  className="w-full justify-start h-auto py-2"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.focus();
                      restoreSelection();
                      
                      const selection = window.getSelection();
                      if (selection && selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        
                        // Tìm parent block element
                        let parentBlock = range.commonAncestorContainer;
                        if (parentBlock.nodeType === Node.TEXT_NODE) {
                          parentBlock = parentBlock.parentElement!;
                        }
                        
                        // Tìm block element gần nhất (p, div, h1-h6, li, etc.)
                        while (parentBlock && parentBlock !== editorRef.current) {
                          const tag = (parentBlock as HTMLElement).tagName?.toLowerCase();
                          if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote'].includes(tag)) {
                            (parentBlock as HTMLElement).style.setProperty('line-height', lineHeight.value, 'important');
                            break;
                          }
                          parentBlock = parentBlock.parentElement!;
                        }
                        
                        // Trigger input event để update state
                        const newValue = editorRef.current.innerHTML;
                        onChange(newValue);
                        setTimeout(() => saveSelection(), 0);
                      }
                    }
                  }}
                >
                  {lineHeight.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("justifyLeft")}
          title="Căn trái"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("justifyCenter")}
          title="Căn giữa"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("justifyRight")}
          title="Căn phải"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("justifyFull")}
          title="Căn đều"
        >
          <AlignJustify className="w-4 h-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("insertUnorderedList")}
          title="Danh sách không đánh số"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("insertOrderedList")}
          title="Danh sách có số"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("indent")}
          title="Thụt lề vào"
        >
          <Indent className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("outdent")}
          title="Thụt lề ra"
        >
          <Outdent className="w-4 h-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Special Formatting */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("formatBlock", "blockquote")}
          title="Trích dẫn"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("formatBlock", "pre")}
          title="Code block"
        >
          <Code className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("insertHorizontalRule")}
          title="Đường kẻ ngang"
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand("removeFormat")}
          title="Xóa định dạng"
        >
          <RemoveFormatting className="w-4 h-4" />
        </Button>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Colors */}
        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Màu chữ"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Màu chữ</label>
                <div className="grid grid-cols-6 gap-2">
                  {commonColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      onClick={() => setColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Màu nền</label>
                <div className="grid grid-cols-6 gap-2">
                  {commonColors.map((color) => (
                    <button
                      key={`bg-${color.value}`}
                      type="button"
                      className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      onClick={() => setBackgroundColor(color.value)}
                      title={`Nền ${color.name}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-8 bg-gray-300 mx-1" />

        {/* Links & Images */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={addLink}
          title="Thêm liên kết"
        >
          <Link className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={addImage}
          title="Thêm hình ảnh bằng URL"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-medium"
          onClick={() => {
            // KHÔNG gọi saveSelection ở đây nữa để tránh ghi đè selection sang toolbar
            // Vị trí con trỏ đã được lưu khi user click/gõ trong editor
            setShowMediaDialog(true);
          }}
        >
          <ImageIcon className="w-3 h-3 mr-1" />
          Thư viện media
        </Button>
        {translateData && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium"
            onClick={() => {
              // Lấy text đã chọn hoặc toàn bộ nội dung
              const selection = window.getSelection();
              let selectedText = "";
              
              if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
                // Có text được chọn
                selectedText = selection.toString();
              } else if (editorRef.current) {
                // Lấy toàn bộ text từ HTML (bỏ tags)
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = editorRef.current.innerHTML;
                selectedText = tempDiv.textContent || tempDiv.innerText || "";
              }
              
              setTranslateText(selectedText);
              setShowTranslateDialog(true);
            }}
          >
            <Languages className="w-3 h-3 mr-1" />
            Dịch thuật
          </Button>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={saveSelection}
        onFocus={restoreSelection}
        onMouseUp={(e) => {
          const target = e.target as HTMLElement | null;
          if (target && (target.tagName === "IMG" || target.tagName === "VIDEO")) {
            setSelectedImage(target as MediaElement);
          } else {
            setSelectedImage(null);
          }
          saveSelection();
        }}
        onKeyUp={saveSelection}
        className="min-h-[300px] p-4 focus:outline-none prose prose-lg max-w-none"
        suppressContentEditableWarning
        data-placeholder={placeholder}
        style={{
          minHeight: "300px",
        }}
      />

      {/* Khối điều khiển kích thước media (ảnh/video) - hiển thị bên cạnh media */}
      {selectedImage && controlPanelPosition && (
        <div
          className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex flex-col gap-2 min-w-[200px]"
          style={{
            top: `${controlPanelPosition.top}px`,
            left: `${controlPanelPosition.left}px`,
          }}
        >
          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            Kích thước media:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => updateSelectedImageSize("small")}
            >
              Nhỏ (40%)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => updateSelectedImageSize("medium")}
            >
              Trung bình (60%)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => updateSelectedImageSize("large")}
            >
              Lớn (80%)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => updateSelectedImageSize("full")}
            >
              Toàn chiều rộng (100%)
            </Button>
          </div>
          
          <div className="border-t border-gray-200 pt-2 mt-1">
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap block mb-1.5">
              Căn chỉnh vị trí:
            </span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updateSelectedImageAlign("left")}
                title="Căn trái"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updateSelectedImageAlign("center")}
                title="Căn giữa"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updateSelectedImageAlign("right")}
                title="Căn phải"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Handle kéo resize media (góc dưới bên phải) */}
      {selectedImage && selectedImageRect && (
        <div
          className="absolute w-3 h-3 bg-blue-500 border border-white rounded cursor-se-resize z-20"
          style={{
            top: selectedImageRect.bottom - 6,
            left: selectedImageRect.right - 6,
          }}
          onMouseDown={startResize}
        />
      )}
      
      <style jsx global>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>

      {/* Media Library Dialog */}
      <Dialog open={showMediaDialog} onOpenChange={setShowMediaDialog}>
        <DialogContent 
          className="w-full flex flex-col overflow-hidden"
          style={{ 
            maxWidth: "95vw", 
            width: "60vw",
            maxHeight: "90vh",
            height: "90vh"
          }}
        >
          <DialogHeader>
            <DialogTitle>Chọn ảnh/video từ thư viện media</DialogTitle>
          </DialogHeader>
          
          <Tabs value={mediaTab} onValueChange={(v) => setMediaTab(v as "upload" | "library")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="library">Thư viện</TabsTrigger>
              <TabsTrigger value="upload">Upload mới</TabsTrigger>
            </TabsList>
            
            <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                <MediaLibraryPicker
                  fileTypeFilter="image,video"
                  onSelectImage={(url) => {
                    setShowMediaDialog(false);
                    insertMediaIntoEditor(url);
                  }}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="upload" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                <div className="space-y-4 p-4">
                  <div>
                    <Label className="mb-2 block">Upload ảnh hoặc video mới</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                      <input
                        ref={mediaFileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleMediaFileUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => mediaFileInputRef.current?.click()}
                        disabled={uploading}
                        className="gap-2"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Đang upload...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span>Chọn file để upload</span>
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        Hỗ trợ: Ảnh (JPG, PNG, GIF) tối đa 10MB, Video (MP4, WebM) tối đa 50MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Translate Dialog */}
      {translateData && (
        <Dialog open={showTranslateDialog} onOpenChange={setShowTranslateDialog}>
          <DialogContent style={{ width: "1200px", maxWidth: "95vw" }}>
            <DialogHeader>
              <DialogTitle>Dịch thuật nội dung</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Nội dung cần dịch ({translateSourceLang?.toUpperCase()})</Label>
                  {setTranslateSourceLang && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600">Dịch từ:</Label>
                      <Select 
                        value={translateSourceLang} 
                        onValueChange={(val: Locale) => setTranslateSourceLang(val)}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs" suppressHydrationWarning>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <Textarea
                  value={translateText}
                  onChange={(e) => setTranslateText(e.target.value)}
                  placeholder="Nhập nội dung cần dịch..."
                  style={{ minHeight: "220px", height: "300px" }}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowTranslateDialog(false);
                    setTranslateText("");
                  }}
                  disabled={translatingAll}
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    if (!translateText.trim()) {
                      return;
                    }

                    // Tạo locale object với nội dung ở ngôn ngữ nguồn
                    const contentToTranslate = {
                      vi: translateSourceLang === 'vi' ? translateText : "",
                      en: translateSourceLang === 'en' ? translateText : "",
                      ja: translateSourceLang === 'ja' ? translateText : "",
                    };

                    await translateData(
                      { contentHtml: contentToTranslate },
                      (translated: any) => {
                        // Lấy nội dung đã dịch theo ngôn ngữ hiện tại
                        const translatedContent = translated.contentHtml?.[globalLocale] || translateText;
                        
                        if (editorRef.current && translatedContent) {
                          editorRef.current.focus();
                          
                          try {
                            if (selectionRef.current) {
                              // Chèn nội dung đã dịch tại vị trí con trỏ
                              const range = selectionRef.current;
                              range.collapse(false);
                              
                              // Tạo một div tạm để chuyển text thành HTML (giữ format)
                              const tempDiv = document.createElement("div");
                              tempDiv.innerHTML = translatedContent;
                              
                              // Chèn các node từ tempDiv vào editor
                              const fragment = document.createDocumentFragment();
                              while (tempDiv.firstChild) {
                                fragment.appendChild(tempDiv.firstChild);
                              }
                              
                              range.insertNode(fragment);
                              
                              // Di chuyển caret ra sau nội dung đã chèn
                              const newRange = document.createRange();
                              newRange.setStartAfter(fragment.lastChild || range.startContainer);
                              newRange.setEndAfter(fragment.lastChild || range.startContainer);
                              const sel = window.getSelection();
                              if (sel) {
                                sel.removeAllRanges();
                                sel.addRange(newRange);
                              }
                              
                              selectionRef.current = newRange;
                              
                              const htmlAfter = editorRef.current.innerHTML || "";
                              if (htmlAfter !== value) {
                                onChange(htmlAfter);
                              }
                            } else {
                              // Fallback: append vào cuối
                              const currentHtml = editorRef.current.innerHTML || value || "";
                              const mergedHtml = currentHtml ? `${currentHtml}${translatedContent}` : translatedContent;
                              editorRef.current.innerHTML = mergedHtml;
                              if (mergedHtml !== value) {
                                onChange(mergedHtml);
                              }
                            }
                          } catch (error) {
                            // Fallback: append vào cuối
                            const currentHtml = editorRef.current.innerHTML || value || "";
                            const mergedHtml = currentHtml ? `${currentHtml}${translatedContent}` : translatedContent;
                            editorRef.current.innerHTML = mergedHtml;
                            if (mergedHtml !== value) {
                              onChange(mergedHtml);
                            }
                          }
                        }
                        
                        setShowTranslateDialog(false);
                        setTranslateText("");
                      },
                      'Nội dung HTML'
                    );
                  }}
                  disabled={translatingAll || !translateText.trim()}
                  className="gap-2"
                >
                  {translatingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang dịch...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Dịch và chèn vào editor</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


