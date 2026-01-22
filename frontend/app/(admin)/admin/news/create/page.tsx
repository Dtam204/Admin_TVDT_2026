"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NewsForm from "../NewsForm";
import { adminApiCall, AdminEndpoints } from "@/lib/api/admin";

export default function CreateNewsPage() {
  const router = useRouter();

  const handleSave = async (formData: any) => {
    try {
      await adminApiCall(AdminEndpoints.news.list, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success("Đã tạo bài viết mới");
      // Delay nhỏ để toast hiển thị trước khi redirect
      setTimeout(() => {
        router.push("/admin/news");
      }, 100);
    } catch (error: any) {
      toast.error(error?.message || "Có lỗi xảy ra khi tạo bài viết");
      // Silently fail
      throw error; // Re-throw để NewsForm có thể handle
    }
  };

  const handleCancel = () => {
    router.push("/admin/news");
  };

  return (
    <NewsForm
      initialData={undefined}
      onSave={handleSave}
      onCancel={handleCancel}
      isEditing={false}
    />
  );
}

