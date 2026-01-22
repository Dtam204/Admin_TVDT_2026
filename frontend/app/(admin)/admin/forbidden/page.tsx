"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2 max-w-xl">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          Bạn không có quyền truy cập nội dung này
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          Vui lòng liên hệ quản trị viên hệ thống để được cấp quyền phù hợp, hoặc
          sử dụng tài khoản khác có đủ quyền truy cập.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/admin");
            }
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          onClick={() => router.push("/admin")}
        >
          Về trang Dashboard
        </Button>
      </div>
    </div>
  );
}


