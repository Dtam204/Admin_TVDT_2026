import type { ReactNode } from "react";

// Layout tối giản chỉ dùng cho /admin/login
// Không dùng chung với layout admin chính ở app/(admin)/admin/layout.tsx
export default function AdminAuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}


